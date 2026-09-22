import { spawnSync } from 'node:child_process';

const result = spawnSync(
  process.execPath,
  ['node_modules/vitest/vitest.mjs', 'run', 'tests/mysql.integration.test.js'],
  {
    cwd: process.cwd(),
    env: { ...process.env, RUN_MYSQL_INTEGRATION: 'true' },
    stdio: 'inherit',
  },
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
