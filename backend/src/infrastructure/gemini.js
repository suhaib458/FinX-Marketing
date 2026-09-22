import { AppError } from '../common/errors.js';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_RETRIES = 2;

function extractText(payload) {
  return payload?.candidates?.[0]?.content?.parts
    ?.filter((part) => !part?.thought)
    .map((part) => part?.text)
    .filter(Boolean)
    .join('\n')
    .trim();
}

function parseJsonText(text) {
  if (!text) throw new AppError(502, 'AI_EMPTY_RESPONSE', 'AI provider returned an empty response');
  const normalized = text
    .replace(/^\`\`\`(?:json)?\s*/i, '')
    .replace(/\s*\`\`\`$/i, '')
    .trim();
  try {
    return JSON.parse(normalized);
  } catch {
    throw new AppError(502, 'AI_INVALID_RESPONSE', 'AI provider returned invalid JSON');
  }
}

function providerError(status) {
  if (status === 400) return new AppError(502, 'AI_REQUEST_REJECTED', 'AI provider rejected the request');
  if (status === 401 || status === 403) return new AppError(503, 'AI_AUTH_ERROR', 'AI provider authentication failed');
  if (status === 404) return new AppError(503, 'AI_MODEL_NOT_FOUND', 'Configured AI model is unavailable');
  if (status === 429) return new AppError(503, 'AI_RATE_LIMITED', 'AI provider is temporarily rate limited');
  return new AppError(502, 'AI_PROVIDER_ERROR', 'AI provider rejected the generation request');
}

function isRetryable(status) {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function blockedResponse(payload) {
  const promptBlock = payload?.promptFeedback?.blockReason;
  const finishReason = payload?.candidates?.[0]?.finishReason;
  if (promptBlock) return true;
  return ['SAFETY', 'BLOCKLIST', 'PROHIBITED_CONTENT', 'IMAGE_SAFETY'].includes(finishReason);
}

function retryDelay(attempt) {
  return 350 * (2 ** attempt);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class GeminiProvider {
  constructor({
    apiKey,
    model,
    timeoutMs = 60_000,
    thinkingLevel = 'low',
    fetchImpl = fetch,
    logger,
  }) {
    this.apiKey = apiKey;
    this.model = model;
    this.timeoutMs = timeoutMs;
    this.thinkingLevel = thinkingLevel;
    this.fetchImpl = fetchImpl;
    this.logger = logger;
  }

  get configured() {
    return Boolean(this.apiKey && this.model);
  }

  generationConfig(responseSchema) {
    const config = {
      responseFormat: {
        text: {
          mimeType: 'application/json',
          schema: responseSchema,
        },
      },
      temperature: 0.7,
      maxOutputTokens: 8192,
    };

    if (/^gemini-3/i.test(this.model)) {
      config.thinkingConfig = { thinkingLevel: this.thinkingLevel };
    }
    return config;
  }

  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await this.fetchImpl(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  async checkConnection() {
    if (!this.configured) {
      return {
        status: 'not_configured',
        configured: false,
        provider: 'gemini',
        model: this.model || null,
      };
    }

    try {
      const response = await this.fetchWithTimeout(
        `${GEMINI_BASE_URL}/${encodeURIComponent(this.model)}`,
        { headers: { 'x-goog-api-key': this.apiKey } },
      );

      if (response.ok) {
        const payload = await response.json().catch(() => ({}));
        return {
          status: 'ready',
          configured: true,
          provider: 'gemini',
          model: this.model,
          displayName: payload?.displayName || null,
        };
      }

      const error = providerError(response.status);
      return {
        status: error.code === 'AI_AUTH_ERROR' ? 'invalid_key' : 'unavailable',
        configured: true,
        provider: 'gemini',
        model: this.model,
        code: error.code,
      };
    } catch (error) {
      return {
        status: error?.name === 'AbortError' ? 'timeout' : 'unavailable',
        configured: true,
        provider: 'gemini',
        model: this.model,
        code: error?.name === 'AbortError' ? 'AI_TIMEOUT' : 'AI_PROVIDER_ERROR',
      };
    }
  }

  async generateJson({ systemInstruction, prompt, responseSchema }) {
    if (!this.configured) {
      throw new AppError(503, 'AI_NOT_CONFIGURED', 'AI generation is not configured');
    }
    if (!responseSchema) {
      throw new AppError(500, 'AI_SCHEMA_NOT_FOUND', 'Generation schema is not configured');
    }

    const url = `${GEMINI_BASE_URL}/${encodeURIComponent(this.model)}:generateContent`;
    const body = JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [{
        role: 'user',
        parts: [{ text: prompt }],
      }],
      generationConfig: this.generationConfig(responseSchema),
    });

    let lastError;
    for (let attempt = 0; attempt <= DEFAULT_RETRIES; attempt += 1) {
      try {
        const response = await this.fetchWithTimeout(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey,
          },
          body,
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          lastError = providerError(response.status);
          this.logger?.warn?.({
            provider: 'gemini',
            model: this.model,
            statusCode: response.status,
            code: lastError.code,
            attempt: attempt + 1,
          }, 'AI provider request failed');

          if (attempt < DEFAULT_RETRIES && isRetryable(response.status)) {
            await sleep(retryDelay(attempt));
            continue;
          }
          throw lastError;
        }

        if (blockedResponse(payload)) {
          throw new AppError(422, 'AI_CONTENT_BLOCKED', 'The AI provider blocked this generation request');
        }

        return parseJsonText(extractText(payload));
      } catch (error) {
        if (error?.name === 'AbortError') {
          lastError = new AppError(504, 'AI_TIMEOUT', 'AI generation timed out');
          if (attempt < DEFAULT_RETRIES) {
            await sleep(retryDelay(attempt));
            continue;
          }
          throw lastError;
        }
        if (error instanceof AppError) throw error;
        lastError = new AppError(502, 'AI_PROVIDER_ERROR', 'Unable to reach the AI provider');
        if (attempt < DEFAULT_RETRIES) {
          await sleep(retryDelay(attempt));
          continue;
        }
        throw lastError;
      }
    }

    throw lastError || new AppError(502, 'AI_PROVIDER_ERROR', 'Unable to reach the AI provider');
  }
}

export function createGeminiProvider(config, logger) {
  return new GeminiProvider({
    apiKey: config.geminiApiKey,
    model: config.geminiModel,
    timeoutMs: config.aiRequestTimeoutMs,
    thinkingLevel: config.geminiThinkingLevel,
    logger,
  });
}
