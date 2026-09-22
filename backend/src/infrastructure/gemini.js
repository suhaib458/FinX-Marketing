import { AppError } from '../common/errors.js';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

function extractText(payload) {
  return payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text)
    .filter(Boolean)
    .join('\n')
    .trim();
}

function parseJsonText(text) {
  if (!text) throw new AppError(502, 'AI_EMPTY_RESPONSE', 'AI provider returned an empty response');
  const normalized = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(normalized);
  } catch {
    throw new AppError(502, 'AI_INVALID_RESPONSE', 'AI provider returned invalid JSON');
  }
}

export class GeminiProvider {
  constructor({ apiKey, model, timeoutMs = 45_000, fetchImpl = fetch }) {
    this.apiKey = apiKey;
    this.model = model;
    this.timeoutMs = timeoutMs;
    this.fetchImpl = fetchImpl;
  }

  get configured() {
    return Boolean(this.apiKey && this.model);
  }

  async generateJson({ systemInstruction, prompt }) {
    if (!this.configured) {
      throw new AppError(503, 'AI_NOT_CONFIGURED', 'AI generation is not configured');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(
        `${GEMINI_BASE_URL}/${encodeURIComponent(this.model)}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey,
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
            contents: [{
              role: 'user',
              parts: [{ text: prompt }],
            }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.75,
              maxOutputTokens: 8192,
            },
          }),
          signal: controller.signal,
        },
      );

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new AppError(502, 'AI_PROVIDER_ERROR', 'AI provider rejected the generation request');
      }

      return parseJsonText(extractText(payload));
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new AppError(504, 'AI_TIMEOUT', 'AI generation timed out');
      }
      if (error instanceof AppError) throw error;
      throw new AppError(502, 'AI_PROVIDER_ERROR', 'Unable to reach the AI provider');
    } finally {
      clearTimeout(timer);
    }
  }
}

export function createGeminiProvider(config) {
  return new GeminiProvider({
    apiKey: config.geminiApiKey,
    model: config.geminiModel,
    timeoutMs: config.aiRequestTimeoutMs,
  });
}
