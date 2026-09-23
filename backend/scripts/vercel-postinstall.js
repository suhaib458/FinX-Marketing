import { spawnSync } from 'node:child_process';

function run(args) {
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(['prisma', 'generate']);

if (process.env.VERCEL_ENV === 'production' && process.env.DATABASE_URL) {
  run(['prisma', 'migrate', 'deploy']);
}
