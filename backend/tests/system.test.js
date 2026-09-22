import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { buildTestApp } from './helpers/test-app.js';

describe('system API', () => {
  it('reports liveness without touching the database', async () => {
    const database = { checkConnection: async () => { throw new Error('must not run'); } };
    const { app } = buildTestApp({ database });
    const response = await request(app).get('/api/v1/health/live');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it.each([[true, 200], [false, 503]])('maps database readiness %s to %s', async (connected, status) => {
    const { app } = buildTestApp({ database: { checkConnection: async () => connected } });
    expect((await request(app).get('/api/v1/health/ready')).status).toBe(status);
  });

  it('returns JSON 404 and a request ID', async () => {
    const { app } = buildTestApp();
    const response = await request(app).get('/missing');
    expect(response.status).toBe(404);
    expect(response.headers['x-request-id']).toBe(response.body.error.requestId);
  });

  it('rejects malformed JSON safely', async () => {
    const { app } = buildTestApp();
    const response = await request(app).post('/api/v1/brands').set('content-type', 'application/json').send('{');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('MALFORMED_JSON');
  });

  it('uses a deterministic testable rate limit', async () => {
    const { app } = buildTestApp({ config: { rateLimitMax: 1 } });
    expect((await request(app).get('/api/v1/health/live')).status).toBe(200);
    const limited = await request(app).get('/api/v1/health/live');
    expect(limited.status).toBe(429);
    expect(limited.body.error.code).toBe('RATE_LIMITED');
  });
});
