import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client.ts';

function adapterOptions(databaseUrl, allowPublicKeyRetrieval) {
  const url = new URL(databaseUrl);
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    connectionLimit: 10,
    allowPublicKeyRetrieval,
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

  const adapter = new PrismaMariaDb(adapterOptions(config.databaseUrl, !config.isProduction));
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
