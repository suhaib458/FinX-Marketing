import { describe, expect, it, vi } from 'vitest';
import { GeminiProvider } from '../src/infrastructure/gemini.js';

const responseSchema = {
  type: 'object',
  properties: { headline: { type: 'string' } },
  required: ['headline'],
};

function jsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() { return payload; },
  };
}

describe('GeminiProvider', () => {
  it('reports not configured without making a network request', async () => {
    const fetchImpl = vi.fn();
    const provider = new GeminiProvider({
      apiKey: '',
      model: 'gemini-3.8-flash',
      fetchImpl,
    });

    await expect(provider.checkConnection()).resolves.toMatchObject({
      status: 'not_configured',
      configured: false,
      provider: 'gemini',
      model: 'gemini-3.8-flash',
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('checks the configured model without exposing the API key in the URL', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({
      name: 'models/gemini-3.8-flash',
      displayName: 'Gemini 3.8 Flash',
    }));
    const provider = new GeminiProvider({
      apiKey: 'server-secret',
      model: 'gemini-3.8-flash',
      fetchImpl,
    });

    const status = await provider.checkConnection();

    expect(status).toMatchObject({
      status: 'ready',
      configured: true,
      model: 'gemini-3.8-flash',
      displayName: 'Gemini 3.8 Flash',
    });
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash');
    expect(url).not.toContain('server-secret');
    expect(options.headers['x-goog-api-key']).toBe('server-secret');
  });

  it('generates schema-constrained JSON with low thinking on Gemini 3', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({
      candidates: [{
        content: { parts: [{ text: '{"headline":"جاهز للنشر"}' }] },
        finishReason: 'STOP',
      }],
    }));
    const provider = new GeminiProvider({
      apiKey: 'server-secret',
      model: 'gemini-3.8-flash',
      thinkingLevel: 'low',
      fetchImpl,
    });

    const result = await provider.generateJson({
      systemInstruction: 'Return marketing content.',
      prompt: 'Create a headline.',
      responseSchema,
    });

    expect(result).toEqual({ headline: 'جاهز للنشر' });
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toContain('gemini-3.8-flash:generateContent');
    expect(url).not.toContain('server-secret');
    const body = JSON.parse(options.body);
    expect(body.generationConfig).toMatchObject({
      thinkingConfig: { thinkingLevel: 'low' },
      responseFormat: {
        text: {
          mimeType: 'application/json',
          schema: responseSchema,
        },
      },
    });
  });

  it('maps provider authentication failures to a safe server error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({
      error: { message: 'API key not valid. Please pass a valid API key.' },
    }, 403));
    const provider = new GeminiProvider({
      apiKey: 'bad-secret',
      model: 'gemini-3.8-flash',
      fetchImpl,
    });

    await expect(provider.generateJson({
      systemInstruction: 'test',
      prompt: 'test',
      responseSchema,
    })).rejects.toMatchObject({
      status: 503,
      code: 'AI_AUTH_ERROR',
      message: 'AI provider authentication failed',
    });
  });

  it('rejects blocked responses safely', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({
      promptFeedback: { blockReason: 'SAFETY' },
      candidates: [],
    }));
    const provider = new GeminiProvider({
      apiKey: 'server-secret',
      model: 'gemini-3.8-flash',
      fetchImpl,
    });

    await expect(provider.generateJson({
      systemInstruction: 'test',
      prompt: 'test',
      responseSchema,
    })).rejects.toMatchObject({
      status: 422,
      code: 'AI_CONTENT_BLOCKED',
    });
  });
});
