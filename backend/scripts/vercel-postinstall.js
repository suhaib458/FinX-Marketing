import { spawnSync } from 'node:child_process';

function run(args) {
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Build installs must stay deterministic and must not depend on a live database.
// Database migrations are deployed explicitly outside Vercel's dependency-install step.
run(['prisma', 'generate']);
