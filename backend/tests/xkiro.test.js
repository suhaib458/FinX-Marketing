import { describe, expect, it, vi } from 'vitest';
import { XKiroProvider } from '../src/infrastructure/xkiro.js';

function jsonResponse(payload, status = 200, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => headers[String(name).toLowerCase()] ?? null },
    async json() { return payload; },
  };
}

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: { headline: { type: 'string' } },
  required: ['headline'],
};

describe('XKiroProvider', () => {
  it('keeps the configured paid model when the account has a paid plan', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ object: 'usage', plan: 'pro', wallet: null }))
      .mockResolvedValueOnce(jsonResponse({
        object: 'list',
        data: [{
          id: 'google/gemini-3.7-flash',
          display_name: 'Gemini 3.7 Flash',
          access_tier: 'paid',
        }],
      }));

    const provider = new XKiroProvider({
      apiKey: 'sk-xt-test',
      model: 'google/gemini-3.7-flash',
      fetchImpl,
    });

    await expect(provider.checkConnection()).resolves.toEqual({
      status: 'ready',
      configured: true,
      provider: 'xkiro',
      model: 'google/gemini-3.7-flash',
      configuredModel: 'google/gemini-3.7-flash',
      displayName: 'Gemini 3.7 Flash',
      accessTier: 'paid',
      fallbackUsed: false,
    });
  });

  it('automatically selects a free fallback for a free account', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        object: 'usage',
        plan: null,
        wallet: null,
        free_tokens: { remaining: 1000000 },
      }))
      .mockResolvedValueOnce(jsonResponse({
        object: 'list',
        data: [
          {
            id: 'google/gemini-3.7-flash',
            display_name: 'Gemini 3.7 Flash',
            access_tier: 'paid',
          },
          {
            id: 'qwen/qwen3.8-max:free',
            display_name: 'Qwen3.8 Max (Free)',
            access_tier: 'free',
          },
        ],
      }));

    const provider = new XKiroProvider({
      apiKey: 'sk-xt-test',
      model: 'google/gemini-3.7-flash',
      fallbackModel: 'qwen/qwen3.8-max:free',
      fetchImpl,
    });

    await expect(provider.checkConnection()).resolves.toEqual({
      status: 'ready',
      configured: true,
      provider: 'xkiro',
      model: 'qwen/qwen3.8-max:free',
      configuredModel: 'google/gemini-3.7-flash',
      displayName: 'Qwen3.8 Max (Free)',
      accessTier: 'free',
      fallbackUsed: true,
    });
  });

  it('maps an invalid key to a safe diagnostic', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({
      error: {
        message: 'Invalid API key.',
        type: 'authentication_error',
        code: 'authentication_error',
      },
    }, 401));

    const provider = new XKiroProvider({
      apiKey: 'sk-xt-bad',
      model: 'google/gemini-3.7-flash',
      fetchImpl,
    });

    await expect(provider.checkConnection()).resolves.toMatchObject({
      status: 'invalid_key',
      configured: true,
      provider: 'xkiro',
      code: 'AI_AUTH_ERROR',
    });
  });

  it('uses OpenAI-compatible chat completions and JSON mode', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({
      id: 'chatcmpl-test',
      choices: [{
        message: { role: 'assistant', content: '{"headline":"جاهز للنشر"}' },
        finish_reason: 'stop',
      }],
    }));

    const provider = new XKiroProvider({
      apiKey: 'sk-xt-test',
      model: 'qwen/qwen3.8-max:free',
      reasoningEffort: 'none',
      fetchImpl,
    });
    provider.resolvedModel = {
      id: 'qwen/qwen3.8-max:free',
      displayName: 'Qwen3.8 Max (Free)',
      accessTier: 'free',
      configuredModel: 'qwen/qwen3.8-max:free',
      fallbackUsed: false,
    };

    const result = await provider.generateJson({
      systemInstruction: 'Create marketing content.',
      prompt: 'Create a headline.',
      responseSchema: schema,
    });

    expect(result).toEqual({ headline: 'جاهز للنشر' });
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.xkiro.com/v1/chat/completions');
    expect(options.headers.Authorization).toBe('Bearer sk-xt-test');

    const body = JSON.parse(options.body);
    expect(body).toMatchObject({
      model: 'qwen/qwen3.8-max:free',
      response_format: { type: 'json_object' },
      reasoning_effort: 'none',
      stream: false,
    });
    expect(body.messages[0].content).toContain('"headline"');
  });

  it('maps quota exhaustion safely', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({
      error: {
        message: 'Insufficient quota.',
        type: 'insufficient_quota',
        code: 'insufficient_quota',
      },
    }, 402));

    const provider = new XKiroProvider({
      apiKey: 'sk-xt-test',
      model: 'qwen/qwen3.8-max:free',
      fetchImpl,
    });
    provider.resolvedModel = {
      id: 'qwen/qwen3.8-max:free',
      displayName: 'Qwen3.8 Max (Free)',
      accessTier: 'free',
      configuredModel: 'qwen/qwen3.8-max:free',
      fallbackUsed: false,
    };

    await expect(provider.generateJson({
      systemInstruction: 'test',
      prompt: 'test',
      responseSchema: schema,
    })).rejects.toMatchObject({
      status: 503,
      code: 'AI_QUOTA_EXHAUSTED',
    });
  });
});
