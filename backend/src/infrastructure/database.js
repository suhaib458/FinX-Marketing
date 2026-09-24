import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client.ts';

function sslOptions(url, databaseCaCert) {
  const mode = (url.searchParams.get('ssl-mode') || url.searchParams.get('sslmode') || '').toUpperCase();

  if (!mode || ['DISABLED', 'DISABLE'].includes(mode)) return undefined;

  if (databaseCaCert) {
    return { ca: databaseCaCert.replace(/\\n/g, '\n') };
  }

  // Aiven's Service URI uses ssl-mode=REQUIRED, which guarantees encryption
  // but does not require CA/hostname verification. Match that behavior when a
  // CA is not provided. For stricter verification, set DATABASE_CA_CERT.
  if (mode === 'REQUIRED' || mode === 'REQUIRE') {
    return { rejectUnauthorized: false };
  }

  throw new Error(`SSL mode ${mode} requires DATABASE_CA_CERT`);
}

function adapterOptions(databaseUrl, allowPublicKeyRetrieval, databaseCaCert) {
  const url = new URL(databaseUrl);
  const ssl = sslOptions(url, databaseCaCert);
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    // Vercel can spin up many serverless instances; each instance owns its own pool.
    // Keep the per-instance pool intentionally tiny so a burst of functions cannot
    // exhaust the database connection limit. Release idle connections quickly too.
    connectionLimit: process.env.VERCEL ? 1 : 10,
    minimumIdle: process.env.VERCEL ? 0 : undefined,
    idleTimeout: process.env.VERCEL ? 30 : 300,
    connectTimeout: 5_000,
    acquireTimeout: 10_000,
    allowPublicKeyRetrieval,
    ...(ssl ? { ssl } : {}),
  };
}

export function createDatabase(config) {
  if (!config.databaseUrl) {
    return {
      prisma: null,
      async checkConnection() { return false; },
      async disconnect() {},
    };
  }

  const adapter = new PrismaMariaDb(
    adapterOptions(config.databaseUrl, !config.isProduction, config.databaseCaCert),
  );
  const prisma = new PrismaClient({ adapter });
  return {
    prisma,
    async checkConnection() {
      await prisma.$queryRawUnsafe('SELECT 1');
      return true;
    },
    async disconnect() { await prisma.$disconnect(); },
  };
}
