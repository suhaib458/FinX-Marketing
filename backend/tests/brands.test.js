import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { auth, BRAND_A, BRAND_B, buildTestApp, USER_A } from './helpers/test-app.js';

describe('brand API', () => {
  it('creates a normalized valid brand', async () => {
    const { app } = buildTestApp();
    const response = await auth(request(app).post('/api/v1/brands')).send({
      businessName: '  قهوة فينكس  ', price: '12.375', currency: 'jod',
      website: 'https://finx.example', username: '@finx', primaryColor: '#73465f',
    });
    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ businessName: 'قهوة فينكس', price: '12.375', currency: 'JOD', primaryColor: '#73465F' });
  });

  it('rejects invalid hex colors', async () => {
    const { app } = buildTestApp();
    const response = await auth(request(app).post('/api/v1/brands')).send({ businessName: 'X', primaryColor: '#12345' });
    expect(response.status).toBe(422);
  });

  it.each(['-1', '1.2345', 'abc'])('rejects invalid price %s', async (price) => {
    const { app } = buildTestApp();
    expect((await auth(request(app).post('/api/v1/brands')).send({ businessName: 'X', price })).status).toBe(422);
  });

  it('rejects mass-assignment and unknown fields', async () => {
    const { app } = buildTestApp();
    const response = await auth(request(app).post('/api/v1/brands')).send({ businessName: 'X', userId: USER_A, role: 'ADMIN' });
    expect(response.status).toBe(422);
  });

  it('paginates the owned brand list', async () => {
    const { app } = buildTestApp();
    const response = await auth(request(app).get('/api/v1/brands?page=1&limit=1'));
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.pagination).toMatchObject({ page: 1, limit: 1, total: 1, totalPages: 1 });
  });

  it('excludes soft-deleted brands', async () => {
    const { app } = buildTestApp();
    expect((await auth(request(app).delete(`/api/v1/brands/${BRAND_A}`))).status).toBe(204);
    expect((await auth(request(app).get('/api/v1/brands'))).body.data).toHaveLength(0);
  });

  it('prevents cross-user read', async () => {
    const { app } = buildTestApp();
    expect((await auth(request(app).get(`/api/v1/brands/${BRAND_B}`))).status).toBe(404);
  });

  it('prevents cross-user update', async () => {
    const { app } = buildTestApp();
    expect((await auth(request(app).patch(`/api/v1/brands/${BRAND_B}`)).send({ businessName: 'stolen' })).status).toBe(404);
  });

  it('prevents cross-user delete', async () => {
    const { app } = buildTestApp();
    expect((await auth(request(app).delete(`/api/v1/brands/${BRAND_B}`))).status).toBe(404);
  });
});
