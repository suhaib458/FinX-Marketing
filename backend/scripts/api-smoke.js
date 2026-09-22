import { createApp } from '../src/app.js';

const USER_A = '00000000-0000-4000-8000-00000000000a';
const USER_B = '00000000-0000-4000-8000-00000000000b';
const UNKNOWN_USER = '00000000-0000-4000-8000-000000000099';
const JOB_ID = '80000000-0000-4000-8000-00000000000a';
const CONTENT_ID = '81000000-0000-4000-8000-00000000000a';
const allowedOrigin = 'http://localhost:5173';
const runtime = createApp();
const statuses = {};
let server;
let rateLimitServer;
let createdBrandId;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function listen(app, port) {
  return new Promise((resolve, reject) => {
    const instance = app.listen(port, '127.0.0.1', () => resolve(instance));
    instance.once('error', reject);
  });
}

async function close(instance) {
  if (!instance) return;
  await new Promise((resolve, reject) => instance.close((error) => error ? reject(error) : resolve()));
}

async function call(baseUrl, path, { method = 'GET', userId, body, rawBody, origin } = {}) {
  const headers = {};
  if (userId) headers['x-finx-dev-user-id'] = userId;
  if (origin) headers.origin = origin;
  if (body !== undefined || rawBody !== undefined) headers['content-type'] = 'application/json';
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: rawBody ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  return { response, payload };
}

function expectStatus(label, result, expected) {
  statuses[label] = result.response.status;
  assert(result.response.status === expected, `${label}: expected ${expected}, received ${result.response.status}`);
  assert(result.response.headers.get('x-request-id'), `${label}: missing request ID`);
}

async function cleanFixtures() {
  await runtime.database.prisma.generatedContent.deleteMany({ where: { id: CONTENT_ID } });
  await runtime.database.prisma.generationJob.deleteMany({ where: { id: JOB_ID } });
  await runtime.database.prisma.brand.deleteMany({
    where: {
      userId: USER_A,
      OR: [
        { username: '@finx_smoke' },
        ...(createdBrandId ? [{ id: createdBrandId }] : []),
      ],
    },
  });
}

try {
  assert(runtime.config.nodeEnv !== 'production', 'Smoke test refuses production');
  assert(runtime.config.allowDevAuth, 'ALLOW_DEV_AUTH must be true for the API smoke test');
  await cleanFixtures();
  await runtime.database.prisma.generationJob.create({
    data: {
      id: JOB_ID, userId: USER_A, tool: 'CONTENT_IDEAS', status: 'COMPLETED',
      input: { topic: 'أفكار تجريبية' }, creditCost: 10, idempotencyKey: 'api-smoke-content-job',
    },
  });
  await runtime.database.prisma.generatedContent.create({
    data: {
      id: CONTENT_ID, userId: USER_A, generationJobId: JOB_ID, tool: 'CONTENT_IDEAS',
      language: 'ar', platform: 'instagram', content: { ideas: ['فكرة آمنة 🚀'] },
      submittedParameters: { audience: 'Jordan' }, savedAt: new Date(),
    },
  });

  server = await listen(runtime.app, runtime.config.port);
  const baseUrl = `http://127.0.0.1:${runtime.config.port}/api/v1`;

  const live = await call(baseUrl, '/health/live');
  expectStatus('healthLive', live, 200);
  const ready = await call(baseUrl, '/health/ready');
  expectStatus('healthReady', ready, 200);
  assert(ready.payload.database === 'connected', 'Readiness did not confirm MySQL');
  expectStatus('version', await call(baseUrl, '/version'), 200);

  expectStatus('missingAuth', await call(baseUrl, '/me'), 401);
  expectStatus('unknownUser', await call(baseUrl, '/me', { userId: UNKNOWN_USER }), 401);
  const me = await call(baseUrl, '/me', { userId: USER_A });
  expectStatus('me', me, 200);
  assert(me.payload.data.id === USER_A && me.payload.data.credits === 100, 'Seed user or wallet balance is incorrect');

  const created = await call(baseUrl, '/brands', {
    method: 'POST', userId: USER_A,
    body: {
      businessName: 'علامة API المؤقتة', businessDescription: 'اختبار عربي 🚀',
      price: '19.875', currency: 'jod', website: 'https://finx.example',
      username: '@finx_smoke', primaryColor: '#73465f', secondaryColor: '#ebcbc1',
    },
  });
  expectStatus('brandCreate', created, 201);
  createdBrandId = created.payload.data.id;
  assert(created.payload.data.price === '19.875', 'API Decimal precision changed');
  assert(created.payload.data.currency === 'JOD', 'API currency was not normalized');
  assert(created.payload.data.primaryColor === '#73465F', 'API color was not normalized');

  const list = await call(baseUrl, '/brands?page=1&limit=1', { userId: USER_A });
  expectStatus('brandList', list, 200);
  assert(list.payload.pagination.limit === 1 && list.payload.data.length === 1, 'Brand pagination failed');
  expectStatus('brandGet', await call(baseUrl, `/brands/${createdBrandId}`, { userId: USER_A }), 200);
  expectStatus('brandOtherRead', await call(baseUrl, `/brands/${createdBrandId}`, { userId: USER_B }), 404);
  expectStatus('brandOtherUpdate', await call(baseUrl, `/brands/${createdBrandId}`, { method: 'PATCH', userId: USER_B, body: { businessName: 'Blocked' } }), 404);
  expectStatus('brandOtherDelete', await call(baseUrl, `/brands/${createdBrandId}`, { method: 'DELETE', userId: USER_B }), 404);
  const updated = await call(baseUrl, `/brands/${createdBrandId}`, { method: 'PATCH', userId: USER_A, body: { businessName: 'علامة API المحدثة' } });
  expectStatus('brandUpdate', updated, 200);
  assert(updated.payload.data.businessName === 'علامة API المحدثة', 'Brand update did not persist');

  const credits = await call(baseUrl, '/credits', { userId: USER_A });
  expectStatus('credits', credits, 200);
  assert(credits.payload.data.balance === 100, 'Credit balance is not 100');
  const ledger = await call(baseUrl, '/credits/ledger?page=1&limit=1', { userId: USER_A });
  expectStatus('creditLedger', ledger, 200);
  assert(ledger.payload.data.length === 1 && ledger.payload.pagination.total === 1, 'Ledger isolation or pagination failed');

  const contents = await call(baseUrl, '/contents?saved=true&tool=CONTENT_IDEAS&page=1&limit=1', { userId: USER_A });
  expectStatus('contentList', contents, 200);
  assert(contents.payload.data[0].id === CONTENT_ID, 'Content filters failed');
  expectStatus('contentGet', await call(baseUrl, `/contents/${CONTENT_ID}`, { userId: USER_A }), 200);
  expectStatus('contentOtherRead', await call(baseUrl, `/contents/${CONTENT_ID}`, { userId: USER_B }), 404);

  expectStatus('validation', await call(baseUrl, '/brands', { method: 'POST', userId: USER_A, body: { businessName: 'Invalid', price: '-1', primaryColor: '#12' } }), 422);
  expectStatus('malformedJson', await call(baseUrl, '/brands', { method: 'POST', userId: USER_A, rawBody: '{' }), 400);
  expectStatus('json404', await call(baseUrl, '/does-not-exist', { userId: USER_A }), 404);

  const corsAllowed = await call(baseUrl, '/health/live', { origin: allowedOrigin });
  expectStatus('corsAllowed', corsAllowed, 200);
  assert(corsAllowed.response.headers.get('access-control-allow-origin') === allowedOrigin, 'Allowed CORS origin missing');
  expectStatus('corsDenied', await call(baseUrl, '/health/live', { origin: 'https://not-allowed.example' }), 403);

  expectStatus('brandDelete', await call(baseUrl, `/brands/${createdBrandId}`, { method: 'DELETE', userId: USER_A }), 204);
  expectStatus('brandAfterDelete', await call(baseUrl, `/brands/${createdBrandId}`, { userId: USER_A }), 404);

  const rateRuntime = createApp({
    config: { ...runtime.config, rateLimitMax: 2, logLevel: 'silent' },
    database: runtime.database,
  });
  rateLimitServer = await listen(rateRuntime.app, 0);
  const address = rateLimitServer.address();
  const rateBase = `http://127.0.0.1:${address.port}/api/v1`;
  expectStatus('rateFirst', await call(rateBase, '/health/live'), 200);
  expectStatus('rateSecond', await call(rateBase, '/health/live'), 200);
  expectStatus('rateLimited', await call(rateBase, '/health/live'), 429);

  process.stdout.write(`${JSON.stringify({ status: 'passed', statuses, cleanedFixtureIds: [JOB_ID, CONTENT_ID] })}\n`);
} finally {
  await close(rateLimitServer);
  await close(server);
  await cleanFixtures();
  await runtime.database.disconnect();
}
