import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { auth, buildTestApp, USER_A } from './helpers/test-app.js';

const validBody = {
  tool: 'social-post',
  params: {
    platform: 'instagram',
    contentLanguage: 'ar',
    tone: 'professional',
    description: 'قهوة مختصة محمصة في عمّان',
  },
  brand: {
    businessName: 'FinX Coffee',
    targetAudience: 'طلاب الجامعات',
  },
};

const providerOutput = {
  headline: 'قهوتك، بطريقتك',
  caption: 'ابدأ يومك بنكهة محمصة في عمّان.',
  cta: 'اطلب الآن',
  hashtags: ['#عمان', '#قهوة'],
  visualConcept: 'لقطة قهوة دافئة على طاولة خشبية',
  platformMeta: { charCount: 38, hashtagCount: 2, bestTimeToPost: '7:00 PM' },
};

describe('AI generation API', () => {
  it('requires authentication', async () => {
    const aiProvider = { generateJson: vi.fn() };
    const { app } = buildTestApp({ aiProvider });
    const response = await request(app).post('/api/v1/ai/generate').send(validBody);
    expect(response.status).toBe(401);
    expect(aiProvider.generateJson).not.toHaveBeenCalled();
  });

  it('validates the requested tool before calling the provider', async () => {
    const aiProvider = { generateJson: vi.fn() };
    const { app } = buildTestApp({ aiProvider });
    const response = await auth(request(app).post('/api/v1/ai/generate')).send({ ...validBody, tool: 'unknown-tool' });
    expect(response.status).toBe(422);
    expect(aiProvider.generateJson).not.toHaveBeenCalled();
  });

  it('atomically deducts credits and persists generated content', async () => {
    const aiProvider = { model: 'test-model', generateJson: vi.fn().mockResolvedValue(providerOutput) };
    const { app, repositories } = buildTestApp({ aiProvider });
    const response = await auth(request(app).post('/api/v1/ai/generate')).send({ ...validBody, idempotencyKey: 'test-generation-001' });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      type: 'social-post', platform: 'instagram', creditCost: 5, source: 'gemini', businessName: 'FinX Coffee', balance: 95,
    });
    expect(response.body.data.id).toMatch(/^generated-content-/);
    expect(response.body.data.content.headline).toBe('قهوتك، بطريقتك');
    expect(repositories.state.users.find((u) => u.id === USER_A).wallet.balance).toBe(95);
    expect(repositories.state.contents.some((c) => c.id === response.body.data.id)).toBe(true);
    expect(aiProvider.generateJson).toHaveBeenCalledOnce();
    expect(aiProvider.generateJson.mock.calls[0][0].responseSchema).toMatchObject({
      type: 'object',
      required: expect.arrayContaining(['headline', 'caption', 'cta']),
    });
    expect(JSON.stringify(response.body)).not.toContain('GEMINI_API_KEY');
  });

  it('refunds credits when the AI provider fails', async () => {
    const aiProvider = { generateJson: vi.fn().mockRejectedValue(new Error('provider unavailable')) };
    const { app, repositories } = buildTestApp({ aiProvider });
    const response = await auth(request(app).post('/api/v1/ai/generate')).send({ ...validBody, idempotencyKey: 'test-generation-failure' });
    expect(response.status).toBe(500);
    expect(repositories.state.users.find((u) => u.id === USER_A).wallet.balance).toBe(100);
    expect(repositories.state.ledger.some((entry) => entry.type === 'REFUND')).toBe(true);
  });

  it('refunds credits when the provider returns invalid structured content', async () => {
    const aiProvider = {
      model: 'test-model',
      generateJson: vi.fn().mockResolvedValue({ headline: 'Only a headline' }),
    };
    const { app, repositories } = buildTestApp({ aiProvider });
    const response = await auth(request(app).post('/api/v1/ai/generate')).send({
      ...validBody,
      idempotencyKey: 'invalid-structured-output',
    });

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe('AI_INVALID_RESPONSE');
    expect(repositories.state.users.find((u) => u.id === USER_A).wallet.balance).toBe(100);
    expect(repositories.state.ledger.some((entry) => entry.type === 'REFUND')).toBe(true);
  });

  it('does not double-charge a completed idempotent request', async () => {
    const aiProvider = { generateJson: vi.fn().mockResolvedValue(providerOutput) };
    const { app, repositories } = buildTestApp({ aiProvider });
    const body = { ...validBody, idempotencyKey: 'same-request-123' };
    const first = await auth(request(app).post('/api/v1/ai/generate')).send(body);
    const second = await auth(request(app).post('/api/v1/ai/generate')).send(body);
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.data.id).toBe(first.body.data.id);
    expect(repositories.state.users.find((u) => u.id === USER_A).wallet.balance).toBe(95);
    expect(aiProvider.generateJson).toHaveBeenCalledOnce();
  });
});
