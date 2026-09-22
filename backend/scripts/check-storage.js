import { randomUUID } from 'node:crypto';
import { getStorage } from 'firebase-admin/storage';
import { loadConfig } from '../src/config/env.js';
import { getOrCreateAdminApp } from '../src/infrastructure/firebase-admin.js';

function classify(error) {
  const code = String(error?.code || '');
  const message = String(error?.message || '').toLowerCase();

  if (code.includes('403') || message.includes('permission') || message.includes('forbidden')) {
    return 'STORAGE_PERMISSION_DENIED';
  }
  if (code.includes('404') || message.includes('not found') || message.includes('does not exist')) {
    return 'STORAGE_BUCKET_NOT_FOUND';
  }
  if (message.includes('credential') || message.includes('authentication')) {
    return 'STORAGE_AUTH_ERROR';
  }
  return 'STORAGE_UNAVAILABLE';
}

async function main() {
  const config = loadConfig();
  if (!config.firebaseProjectId || !config.firebaseStorageBucket) {
    process.stdout.write(`${JSON.stringify({
      status: 'not_configured',
      code: 'STORAGE_NOT_CONFIGURED',
      hasProjectId: Boolean(config.firebaseProjectId),
      hasBucket: Boolean(config.firebaseStorageBucket),
    }, null, 2)}\n`);
    process.exitCode = 1;
    return;
  }

  try {
    const app = getOrCreateAdminApp(config);
    const bucket = getStorage(app).bucket(config.firebaseStorageBucket);
    const [exists] = await bucket.exists();

    if (!exists) {
      process.stdout.write(`${JSON.stringify({
        status: 'unavailable',
        code: 'STORAGE_BUCKET_NOT_FOUND',
        bucket: config.firebaseStorageBucket,
      }, null, 2)}\n`);
      process.exitCode = 1;
      return;
    }

    const testKey = `healthchecks/finx-${randomUUID()}.txt`;
    const file = bucket.file(testKey);
    await file.save(Buffer.from('finx-storage-check'), {
      contentType: 'text/plain',
      resumable: false,
      metadata: { cacheControl: 'no-store' },
    });
    await file.delete({ ignoreNotFound: true });

    process.stdout.write(`${JSON.stringify({
      status: 'ready',
      bucket: config.firebaseStorageBucket,
      write: 'ok',
      delete: 'ok',
    }, null, 2)}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({
      status: 'unavailable',
      code: classify(error),
      bucket: config.firebaseStorageBucket || null,
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
