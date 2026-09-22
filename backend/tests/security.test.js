import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config/env.js';
import { buildTestApp, createMemoryRepositories, USER_A } from './helpers/test-app.js';

describe('environment and authentication security', () => {
  it('rejects development auth in production', () => {
    expect(() => loadConfig({ NODE_ENV: 'production', DATABASE_URL: 'mysql://user:pass@localhost:3306/finx', FIREBASE_PROJECT_ID: 'finx-production', CORS_ORIGINS: 'https://finx.example', ALLOW_DEV_AUTH: 'true' })).toThrow(/Development authentication/);
  });

  it('requires a Firebase project in production', () => {
    expect(() => loadConfig({ NODE_ENV: 'production', DATABASE_URL: 'mysql://user:pass@localhost:3306/finx', CORS_ORIGINS: 'https://finx.example' })).toThrow(/FIREBASE_PROJECT_ID/);
  });

  it('disables development auth when the flag is false', async () => {
    const { app } = buildTestApp({ config: { allowDevAuth: false } });
    expect((await request(app).get('/api/v1/me').set('x-finx-dev-user-id', USER_A)).status).toBe(401);
  });

  it('requires the development user header', async () => {
    const { app } = buildTestApp();
    expect((await request(app).get('/api/v1/me')).status).toBe(401);
  });

  it.each(['SUSPENDED', 'deleted'])('rejects a %s user', async (condition) => {
    const repositories = createMemoryRepositories();
    const user = repositories.state.users[0];
    if (condition === 'SUSPENDED') user.status = 'SUSPENDED'; else user.deletedAt = new Date().toISOString();
    const { app } = buildTestApp({ repositories });
    expect((await request(app).get('/api/v1/me').set('x-finx-dev-user-id', USER_A)).status).toBe(401);
  });

  it('does not expose database errors or secrets', async () => {
    const repositories = createMemoryRepositories();
    repositories.brands.list = async () => { throw new Error('mysql://root:super-secret@localhost/finx SQL SELECT'); };
    const { app } = buildTestApp({ repositories });
    const response = await request(app).get('/api/v1/brands').set('x-finx-dev-user-id', USER_A);
    expect(response.status).toBe(500);
    expect(JSON.stringify(response.body)).not.toContain('super-secret');
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
  });
});
