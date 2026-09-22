export class UserRepository {
  constructor(prisma) { this.prisma = prisma; }

  findActiveById(id) {
    return this.prisma.user.findFirst({
      where: { id, status: 'ACTIVE', deletedAt: null },
      select: {
        id: true, email: true, name: true, role: true, status: true,
        planCode: true, onboardingCompleted: true, locale: true, timezone: true, createdAt: true,
        wallet: { select: { balance: true } },
      },
    });
  }

  findActiveByFirebaseUid(firebaseUid) {
    return this.prisma.user.findFirst({
      where: { firebaseUid, status: 'ACTIVE', deletedAt: null },
      select: {
        id: true, firebaseUid: true, email: true, emailVerified: true, name: true,
        photoUrl: true, role: true, status: true, planCode: true,
        onboardingCompleted: true, locale: true, timezone: true, createdAt: true,
        wallet: { select: { balance: true } },
      },
    });
  }

  async provisionFirebaseUser(identity) {
    const userId = crypto.randomUUID();
    const walletId = crypto.randomUUID();
    const email = identity.email.trim().toLowerCase();
    const name = (identity.name || email.split('@')[0]).trim().slice(0, 160);

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const byUid = await transaction.user.findUnique({
          where: { firebaseUid: identity.uid },
          include: { wallet: { select: { balance: true } } },
        });
        if (byUid) {
          const updated = await transaction.user.update({
            where: { id: byUid.id },
            data: {
              email,
              emailVerified: identity.emailVerified,
              name,
              photoUrl: identity.picture?.slice(0, 2048) || null,
              lastLoginAt: new Date(),
            },
            include: { wallet: { select: { balance: true } } },
          });
          if (!updated.wallet) {
            try {
              const fallbackWalletId = crypto.randomUUID();
              await transaction.creditWallet.create({
                data: { id: fallbackWalletId, userId: updated.id, balance: 100 },
              });
              await transaction.creditLedger.create({
                data: {
                  walletId: fallbackWalletId,
                  userId: updated.id,
                  direction: 'CREDIT',
                  type: 'INITIAL_GRANT',
                  amount: 100,
                  balanceAfter: 100,
                  idempotencyKey: 'firebase-initial-grant-v1',
                  description: 'Initial account credit grant',
                },
              });
              return transaction.user.findUnique({
                where: { id: updated.id },
                include: { wallet: { select: { balance: true } } },
              });
            } catch (walletError) {
              if (process.env.NODE_ENV === 'development') {
                console.error('[AUTH_ERROR_STAGE=wallet] Wallet fallback creation failed:', walletError?.message);
              }
              throw walletError;
            }
          }
          return updated;
        }

        const emailOwner = await transaction.user.findUnique({ where: { email } });
        if (emailOwner) return { emailConflict: true };

        try {
          await transaction.user.create({
            data: {
              id: userId,
              firebaseUid: identity.uid,
              email,
              emailVerified: identity.emailVerified,
              name,
              photoUrl: identity.picture?.slice(0, 2048) || null,
              lastLoginAt: new Date(),
            },
          });
        } catch (dbError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[AUTH_ERROR_STAGE=database] User creation failed:', dbError?.message);
          }
          throw dbError;
        }

        try {
          await transaction.creditWallet.create({
            data: { id: walletId, userId, balance: 100 },
          });
          await transaction.creditLedger.create({
            data: {
              walletId,
              userId,
              direction: 'CREDIT',
              type: 'INITIAL_GRANT',
              amount: 100,
              balanceAfter: 100,
              idempotencyKey: 'firebase-initial-grant-v1',
              description: 'Initial account credit grant',
            },
          });
        } catch (walletError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[AUTH_ERROR_STAGE=wallet] Wallet creation failed:', walletError?.message);
          }
          throw walletError;
        }

        return transaction.user.findUnique({
          where: { id: userId },
          include: { wallet: { select: { balance: true } } },
        });
      });
    } catch (error) {
      if (error?.code !== 'P2002') {
        if (process.env.NODE_ENV === 'development') {
          console.error('[AUTH_ERROR_STAGE=database] Transaction error:', error?.message);
        }
        throw error;
      }
      const existing = await this.findActiveByFirebaseUid(identity.uid);
      if (existing && existing.email === email) return existing;
      return { emailConflict: true };
    }
  }
}
