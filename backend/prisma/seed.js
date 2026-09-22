import { loadConfig } from '../src/config/env.js';
import { createDatabase } from '../src/infrastructure/database.js';

const USERS = [
  {
    id: '00000000-0000-4000-8000-00000000000a',
    walletId: '10000000-0000-4000-8000-00000000000a',
    ledgerId: '20000000-0000-4000-8000-00000000000a',
    email: 'dev-user-a@finx.local',
    name: 'FinX Development User A',
  },
  {
    id: '00000000-0000-4000-8000-00000000000b',
    walletId: '10000000-0000-4000-8000-00000000000b',
    ledgerId: '20000000-0000-4000-8000-00000000000b',
    email: 'dev-user-b@finx.local',
    name: 'FinX Development User B',
  },
];

const config = loadConfig();
if (config.isProduction) throw new Error('Development seed is disabled in production');
if (!config.databaseUrl) throw new Error('DATABASE_URL is required to run the seed');

const database = createDatabase(config);
try {
  for (const fixture of USERS) {
    await database.prisma.$transaction(async (transaction) => {
      await transaction.user.upsert({
        where: { id: fixture.id },
        update: { email: fixture.email.toLowerCase(), name: fixture.name, status: 'ACTIVE' },
        create: {
          id: fixture.id,
          email: fixture.email.toLowerCase(),
          name: fixture.name,
          role: 'USER',
          status: 'ACTIVE',
        },
      });
      const wallet = await transaction.creditWallet.upsert({
        where: { userId: fixture.id },
        update: {},
        create: { id: fixture.walletId, userId: fixture.id, balance: 100 },
      });
      await transaction.creditLedger.upsert({
        where: {
          walletId_idempotencyKey: {
            walletId: wallet.id,
            idempotencyKey: 'development-initial-grant-v1',
          },
        },
        update: {},
        create: {
          id: fixture.ledgerId,
          walletId: wallet.id,
          userId: fixture.id,
          direction: 'CREDIT',
          type: 'INITIAL_GRANT',
          amount: 100,
          balanceAfter: 100,
          idempotencyKey: 'development-initial-grant-v1',
          description: 'Development account initial credit grant',
        },
      });
    });
  }
} finally {
  await database.disconnect();
}
