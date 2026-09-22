import { loadConfig } from '../src/config/env.js';
import { createXKiroProvider } from '../src/infrastructure/xkiro.js';

async function main() {
  const config = loadConfig();
  const provider = createXKiroProvider(config);
  const result = await provider.checkConnection();

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

  if (result.status !== 'ready') {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'unavailable',
    code: error?.code || 'AI_CHECK_FAILED',
    message: 'xKiro connectivity check failed',
  }, null, 2));
  process.exitCode = 1;
});
