import { loadConfig } from '../src/config/env.js';
import { createDatabase } from '../src/infrastructure/database.js';

const seedUserIds = [
  '00000000-0000-4000-8000-00000000000a',
  '00000000-0000-4000-8000-00000000000b',
];
const database = createDatabase(loadConfig());

try {
  const users = await database.prisma.user.findMany({
    where: { id: { in: seedUserIds } },
    include: { wallet: { include: { ledger: true } } },
  });
  const fixtureCounts = await Promise.all([
    database.prisma.user.count({ where: { id: { in: seedUserIds } } }),
    database.prisma.creditWallet.count({ where: { userId: { in: seedUserIds } } }),
    database.prisma.creditLedger.count({ where: { userId: { in: seedUserIds } } }),
  ]);
  const transientCounts = await Promise.all([
    database.prisma.user.count({ where: { id: { startsWith: '70000000-' } } }),
    database.prisma.brand.count(),
    database.prisma.generationJob.count(),
    database.prisma.generatedContent.count(),
  ]);

  const validUsers = users.length === 2 && users.every((user) =>
    user.wallet?.balance === 100
    && user.wallet.ledger.length === 1
    && user.wallet.ledger[0].amount === 100
    && user.wallet.ledger[0].idempotencyKey === 'development-initial-grant-v1');
  const clean = transientCounts.every((count) => count === 0);
  if (!validUsers || fixtureCounts.some((count) => count !== 2) || !clean) {
    throw new Error('Seed verification or transient-data cleanup failed');
  }

  process.stdout.write(`${JSON.stringify({
    seedUsers: fixtureCounts[0],
    seedWallets: fixtureCounts[1],
    seedLedgerEntries: fixtureCounts[2],
    balances: users.map((user) => user.wallet.balance).sort(),
    transientRecords: transientCounts.reduce((sum, count) => sum + count, 0),
  })}\n`);
} finally {
  await database.disconnect();
}
