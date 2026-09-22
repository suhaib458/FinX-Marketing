import { loadConfig } from '../src/config/env.js';
import { createDatabase } from '../src/infrastructure/database.js';

const database = createDatabase(loadConfig());
if (!database.prisma) throw new Error('DATABASE_URL is required');

try {
  const [identity] = await database.prisma.$queryRawUnsafe(
    'SELECT DATABASE() AS databaseName, VERSION() AS serverVersion, @@character_set_database AS charsetName, @@collation_database AS collationName',
  );
  const [tables] = await database.prisma.$queryRawUnsafe(
    'SELECT COUNT(*) AS tableCount FROM information_schema.tables WHERE table_schema = DATABASE()',
  );
  process.stdout.write(`${JSON.stringify({
    ...identity,
    tableCount: Number(tables.tableCount),
  })}\n`);
} finally {
  await database.disconnect();
}
