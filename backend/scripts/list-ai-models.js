import { loadConfig } from '../src/config/env.js';
import { createXKiroProvider } from '../src/infrastructure/xkiro.js';

async function main() {
  const config = loadConfig();
  const provider = createXKiroProvider(config);
  const models = await provider.listModels();
  const googleModels = models
    .filter((model) => typeof model?.id === 'string' && model.id.startsWith('google/'))
    .map((model) => ({
      id: model.id,
      displayName: model.display_name || model.name || null,
      accessTier: model.access_tier || null,
      contextLength: model.context_length || null,
      maxOutputTokens: model.max_output_tokens || null,
      reasoning: model.reasoning_efforts || null,
    }));

  process.stdout.write(`${JSON.stringify(googleModels, null, 2)}\n`);
}

main().catch((error) => {
  console.error(JSON.stringify({
    code: error?.code || 'AI_MODEL_LIST_FAILED',
    message: 'Unable to read the xKiro model catalog',
  }, null, 2));
  process.exitCode = 1;
});
