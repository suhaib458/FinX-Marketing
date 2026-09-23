import 'dotenv/config';
import { defineConfig } from 'prisma/config';

function prismaDatabaseUrl(rawUrl) {
  if (!rawUrl) return undefined;
  const url = new URL(rawUrl);

  if (url.protocol === 'mysql:') {
    const aivenSslMode = (url.searchParams.get('ssl-mode') || '').toUpperCase();
    if (aivenSslMode) {
      url.searchParams.delete('ssl-mode');
      if (aivenSslMode === 'REQUIRED') {
        url.searchParams.set('sslaccept', 'accept_invalid_certs');
      }
    }
  }

  return url.toString();
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'node prisma/seed.js' },
  datasource: process.env.DATABASE_URL
    ? {
        url: prismaDatabaseUrl(process.env.DATABASE_URL),
        shadowDatabaseUrl: prismaDatabaseUrl(process.env.SHADOW_DATABASE_URL),
      }
    : undefined,
});
