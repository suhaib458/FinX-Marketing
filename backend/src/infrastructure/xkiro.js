import { AppError } from '../common/errors.js';

const DEFAULT_BASE_URL = 'https://api.xkiro.com/v1';
const DEFAULT_RETRIES = 2;
const FREE_FALLBACK_CANDIDATES = [
  'qwen/qwen3.8-max:free',
  'qwen/qwen3.7-plus:free',
  'qwen/qwen3.5-flash:free',
  'minimax/minimax-m3:free',
  'sensenova/sensenova-6.8-flash-lite',
];

function parseJsonText(text) {
  if (!text) throw new AppError(502, 'AI_EMPTY_RESPONSE', 'AI provider returned an empty response');

  const normalized = String(text)
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(normalized);
  } catch {
    throw new AppError(502, 'AI_INVALID_RESPONSE', 'AI provider returned invalid JSON');
  }
}

function extractAssistantText(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;

  if (Array.isArray(content)) {
    return content
      .map((part) => typeof part === 'string' ? part : part?.text)
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  return '';
}

function providerMetadata(payload) {
  const error = payload?.error && typeof payload.error === 'object' ? payload.error : {};
  return {
    providerType: typeof error.type === 'string' ? error.type : null,
    providerCode: typeof error.code === 'string' ? error.code : null,
  };
}

function providerError(status, payload) {
  const metadata = providerMetadata(payload);

  if (status === 401 || metadata.providerCode === 'authentication_error') {
    return new AppError(503, 'AI_AUTH_ERROR', 'AI provider authentication failed', metadata);
  }
  if (status === 402 || metadata.providerCode === 'insufficient_quota') {
    return new AppError(503, 'AI_QUOTA_EXHAUSTED', 'AI provider quota is exhausted', metadata);
  }
  if (status === 403 || metadata.providerCode === 'permission_denied') {
    return new AppError(503, 'AI_MODEL_ACCESS_DENIED', 'AI model is not available on this account', metadata);
  }
  if (status === 404 || metadata.providerCode === 'not_found') {
    return new AppError(503, 'AI_MODEL_NOT_FOUND', 'Configured AI model is unavailable', metadata);
  }
  if (status === 408 || metadata.providerCode === 'timeout') {
    return new AppError(504, 'AI_TIMEOUT', 'AI generation timed out', metadata);
  }
  if (status === 429 || metadata.providerCode === 'rate_limit_exceeded') {
    return new AppError(503, 'AI_RATE_LIMITED', 'AI provider is temporarily rate limited', metadata);
  }
  if (status === 400 || status === 422 || metadata.providerCode === 'invalid_request') {
    return new AppError(502, 'AI_REQUEST_REJECTED', 'AI provider rejected the request', metadata);
  }
  return new AppError(502, 'AI_PROVIDER_ERROR', 'AI provider rejected the generation request', metadata);
}

function isRetryable(status) {
  return [429, 500, 502, 503].includes(status);
}

function retryDelay(response, attempt) {
  const retryAfter = Number(response?.headers?.get?.('retry-after'));
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Math.min(retryAfter * 1000, 10_000);
  }
  return Math.min(500 * (2 ** attempt), 4_000);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class XKiroProvider {
  constructor({
    apiKey,
    model,
    baseUrl = DEFAULT_BASE_URL,
    timeoutMs = 75_000,
    reasoningEffort = 'none',
    fallbackModel,
    fetchImpl = fetch,
    logger,
  }) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = String(baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
    this.timeoutMs = timeoutMs;
    this.reasoningEffort = reasoningEffort;
    this.fallbackModel = fallbackModel;
    this.fetchImpl = fetchImpl;
    this.logger = logger;
    this.resolvedModel = null;
  }

  get configured() {
    return Boolean(this.apiKey && this.model);
  }

  authHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: 'application/json',
    };
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

  async listModels() {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/models`, {
      headers: { Accept: 'application/json' },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw providerError(response.status, payload);
    return Array.isArray(payload?.data) ? payload.data : [];
  }

  async getUsage() {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/usage`, {
      headers: this.authHeaders(),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw providerError(response.status, payload);
    return payload;
  }

  hasPaidAccess(usage) {
    const hasPlan = typeof usage?.plan === 'string' && usage.plan.trim().length > 0;
    const walletBalance = Number.parseFloat(usage?.wallet?.balance_usd || '0');
    return hasPlan || (Number.isFinite(walletBalance) && walletBalance > 0);
  }

  chooseFreeFallback(models) {
    const preferredFree = this.fallbackModel
      ? models.find((entry) => entry?.id === this.fallbackModel && entry?.access_tier === 'free')
      : null;
    if (preferredFree) return preferredFree;

    for (const id of FREE_FALLBACK_CANDIDATES) {
      const candidate = models.find((entry) => entry?.id === id && entry?.access_tier === 'free');
      if (candidate) return candidate;
    }

    return models.find((entry) => entry?.access_tier === 'free') || null;
  }

  async resolveModel({ forceFree = false } = {}) {
    if (this.resolvedModel && (!forceFree || this.resolvedModel.accessTier === 'free')) {
      return this.resolvedModel;
    }

    const [usage, models] = await Promise.all([this.getUsage(), this.listModels()]);
    const configured = models.find((entry) => entry?.id === this.model) || null;
    const paidAccess = this.hasPaidAccess(usage);

    let selected = configured;
    if (
      forceFree
      || !configured
      || (configured.access_tier === 'paid' && !paidAccess)
      || (configured.access_tier === 'premium' && !paidAccess)
    ) {
      selected = this.chooseFreeFallback(models);
    }

    if (!selected) {
      throw new AppError(503, 'AI_MODEL_NOT_FOUND', 'No usable AI model is available for this account');
    }

    this.resolvedModel = {
      id: selected.id,
      displayName: selected.display_name || selected.name || null,
      accessTier: selected.access_tier || null,
      configuredModel: this.model,
      fallbackUsed: selected.id !== this.model,
    };
    return this.resolvedModel;
  }

  async checkConnection() {
    if (!this.configured) {
      return {
        status: 'not_configured',
        configured: false,
        provider: 'xkiro',
        model: this.model || null,
      };
    }

    try {
      const selected = await this.resolveModel();

      return {
        status: 'ready',
        configured: true,
        provider: 'xkiro',
        model: selected.id,
        configuredModel: selected.configuredModel,
        displayName: selected.displayName,
        accessTier: selected.accessTier,
        fallbackUsed: selected.fallbackUsed,
      };
    } catch (error) {
      return {
        status: error?.name === 'AbortError' ? 'timeout' : 'unavailable',
        configured: true,
        provider: 'xkiro',
        model: this.model,
        code: error?.name === 'AbortError' ? 'AI_TIMEOUT' : (error?.code || 'AI_PROVIDER_ERROR'),
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

    const schemaInstruction = [
      systemInstruction,
      '',
      'The response must be valid JSON matching this JSON Schema exactly:',
      JSON.stringify(responseSchema),
      'Do not include Markdown fences or any text outside the JSON object.',
    ].join('\n');

    const url = `${this.baseUrl}/chat/completions`;
    let selected = await this.resolveModel();
    let lastError;
    let accessFallbackAttempted = false;

    for (let attempt = 0; attempt <= DEFAULT_RETRIES; attempt += 1) {
      const body = JSON.stringify({
        model: selected.id,
        messages: [
          { role: 'system', content: schemaInstruction },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        reasoning_effort: this.reasoningEffort,
        max_tokens: 8192,
        stream: false,
      });
      try {
        const response = await this.fetchWithTimeout(url, {
          method: 'POST',
          headers: {
            ...this.authHeaders(),
            'Content-Type': 'application/json',
          },
          body,
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          lastError = providerError(response.status, payload);
          this.logger?.warn?.({
            provider: 'xkiro',
            model: selected.id,
            statusCode: response.status,
            code: lastError.code,
            attempt: attempt + 1,
          }, 'AI provider request failed');

          if (
            response.status === 403
            && selected.accessTier !== 'free'
            && !accessFallbackAttempted
          ) {
            accessFallbackAttempted = true;
            this.resolvedModel = null;
            selected = await this.resolveModel({ forceFree: true });
            continue;
          }

          if (attempt < DEFAULT_RETRIES && isRetryable(response.status)) {
            await sleep(retryDelay(response, attempt));
            continue;
          }
          throw lastError;
        }

        const finishReason = payload?.choices?.[0]?.finish_reason;
        if (finishReason === 'length') {
          throw new AppError(502, 'AI_TRUNCATED_RESPONSE', 'AI provider response was truncated');
        }

        return parseJsonText(extractAssistantText(payload));
      } catch (error) {
        if (error?.name === 'AbortError') {
          throw new AppError(504, 'AI_TIMEOUT', 'AI generation timed out');
        }
        if (error instanceof AppError) throw error;

        lastError = new AppError(502, 'AI_PROVIDER_ERROR', 'Unable to reach the AI provider');
        if (attempt < DEFAULT_RETRIES) {
          await sleep(500 * (2 ** attempt));
          continue;
        }
        throw lastError;
      }
    }

    throw lastError || new AppError(502, 'AI_PROVIDER_ERROR', 'Unable to reach the AI provider');
  }
}

export function createXKiroProvider(config, logger) {
  return new XKiroProvider({
    apiKey: config.xkiroApiKey,
    model: config.xkiroModel,
    baseUrl: config.xkiroBaseUrl,
    timeoutMs: config.aiRequestTimeoutMs,
    reasoningEffort: config.aiReasoningEffort,
    fallbackModel: config.xkiroFallbackModel,
    logger,
  });
}
