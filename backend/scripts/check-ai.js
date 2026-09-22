import { loadConfig } from '../src/config/env.js';
import { createGeminiProvider } from '../src/infrastructure/gemini.js';

async function main() {
  const config = loadConfig();
  const provider = createGeminiProvider(config);
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
    message: 'Gemini connectivity check failed',
  }, null, 2));
  process.exitCode = 1;
});
