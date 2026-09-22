export class CreditRepository {
  constructor(prisma) { this.prisma = prisma; }

  findWallet(userId) {
    return this.prisma.creditWallet.findUnique({
      where: { userId }, select: { balance: true, updatedAt: true },
    });
  }

  async listLedger(userId, { page, limit, direction, type }) {
    const where = { userId, ...(direction && { direction }), ...(type && { type }) };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.creditLedger.findMany({
        where,
        select: {
          id: true, direction: true, type: true, amount: true, balanceAfter: true,
          description: true, metadata: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.creditLedger.count({ where }),
    ]);
    return { items, total };
  }
}
