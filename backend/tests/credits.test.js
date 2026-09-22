import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { auth, buildTestApp, USER_A } from './helpers/test-app.js';

describe('read-only credits API', () => {
  it('returns only the authenticated user wallet', async () => {
    const { app } = buildTestApp();
    const response = await auth(request(app).get('/api/v1/credits'), USER_A);
    expect(response.status).toBe(200);
    expect(response.body.data.balance).toBe(100);
    expect(response.body.data).not.toHaveProperty('userId');
  });

  it('returns only the authenticated user ledger', async () => {
    const { app } = buildTestApp();
    const response = await auth(request(app).get('/api/v1/credits/ledger'), USER_A);
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toContain('00a');
  });

  it('paginates ledger entries', async () => {
    const { app, repositories } = buildTestApp();
    repositories.state.ledger.push({ ...repositories.state.ledger[0], id: '50000000-0000-4000-8000-00000000000c' });
    const response = await auth(request(app).get('/api/v1/credits/ledger?page=2&limit=1'));
    expect(response.body.pagination).toMatchObject({ page: 2, limit: 1, total: 2, totalPages: 2 });
    expect(response.body.data).toHaveLength(1);
  });

  it('has no public balance mutation endpoint', async () => {
    const { app } = buildTestApp();
    const response = await auth(request(app).post('/api/v1/credits')).send({ balance: 999999 });
    expect(response.status).toBe(404);
  });
});
