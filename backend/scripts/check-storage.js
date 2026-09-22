import { randomUUID } from 'node:crypto';
import { loadConfig } from '../src/config/env.js';
import { createStorageProvider } from '../src/infrastructure/storage.js';

async function main() {
  const config = loadConfig();

  try {
    const provider = createStorageProvider({ config });
    const testKey = `healthchecks/finx-${randomUUID()}.txt`;
    const uploaded = await provider.upload({
      storageKey: testKey,
      buffer: Buffer.from('finx-storage-check'),
      mimeType: 'text/plain',
      metadata: { purpose: 'healthcheck' },
    });

    await provider.delete({ storageKey: testKey });

    process.stdout.write(`${JSON.stringify({
      status: 'ready',
      mode: provider.mode,
      bucket: provider.bucketName || null,
      localDirectory: provider.mode === 'local' ? config.localUploadDir : undefined,
      write: uploaded?.storageKey ? 'ok' : 'unknown',
      delete: 'ok',
    }, null, 2)}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({
      status: 'unavailable',
      mode: config.storageMode || 'auto',
      code: error?.code || 'STORAGE_UNAVAILABLE',
      message: typeof error?.message === 'string' ? error.message : 'Storage check failed',
    }, null, 2)}\n`);
    process.exitCode = 1;
  }
}

main().catch(() => {
  process.stdout.write(`${JSON.stringify({
    status: 'unavailable',
    code: 'STORAGE_CHECK_FAILED',
  }, null, 2)}\n`);
  process.exitCode = 1;
});
