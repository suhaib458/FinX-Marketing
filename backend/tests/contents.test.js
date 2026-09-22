import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { auth, buildTestApp, CONTENT_A, CONTENT_B, VARIATION_A } from './helpers/test-app.js';

describe('generated content read API', () => {
  it('returns only owned content', async () => {
    const { app } = buildTestApp();
    const response = await auth(request(app).get('/api/v1/contents'));
    expect(response.status).toBe(200);
    expect(response.body.data.map((item) => item.id)).toEqual([CONTENT_A, VARIATION_A]);
    expect(response.body.data.map((item) => item.id)).not.toContain(CONTENT_B);
  });

  it.each([['true', CONTENT_A], ['false', VARIATION_A]])('filters saved=%s', async (saved, id) => {
    const { app } = buildTestApp();
    const response = await auth(request(app).get(`/api/v1/contents?saved=${saved}`));
    expect(response.body.data.map((item) => item.id)).toEqual([id]);
  });

  it('excludes soft-deleted content', async () => {
    const { app, repositories } = buildTestApp();
    repositories.state.contents.find((item) => item.id === CONTENT_A).deletedAt = new Date().toISOString();
    const response = await auth(request(app).get('/api/v1/contents'));
    expect(response.body.data.map((item) => item.id)).toEqual([VARIATION_A]);
  });

  it('keeps a variation linked without mutating its original', async () => {
    const { app, repositories } = buildTestApp();
    const before = structuredClone(repositories.state.contents.find((item) => item.id === CONTENT_A));
    const variation = await auth(request(app).get(`/api/v1/contents/${VARIATION_A}`));
    expect(variation.body.data.originalContentId).toBe(CONTENT_A);
    expect(repositories.state.contents.find((item) => item.id === CONTENT_A)).toEqual(before);
  });
});
