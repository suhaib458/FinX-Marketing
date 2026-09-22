# FinX AI integration — xKiro

FinX routes AI generation through the xKiro API from the Express backend only. The browser never receives the provider API key.

## Why xKiro

xKiro exposes an OpenAI-compatible API at `https://api.xkiro.com/v1` and supports model IDs in `vendor/model` form. FinX currently defaults to the Google Gemini family through xKiro.

## Local configuration

Add these values to `backend/.env`:

```env
XKIRO_API_KEY=sk-xt-your-key
XKIRO_BASE_URL=https://api.xkiro.com/v1
XKIRO_MODEL=google/gemini-3.7-flash
AI_REASONING_EFFORT=low
AI_REQUEST_TIMEOUT_MS=75000
```

Do not prefix the key with `VITE_` and do not place it in the frontend `.env.local`.

For migration only, FinX temporarily accepts an xKiro key stored under the old `GEMINI_API_KEY` variable. New environments should use `XKIRO_API_KEY`.

## Verify the provider

From the repository root:

```powershell
npm run ai:check
```

A healthy configuration returns a result similar to:

```json
{
  "status": "ready",
  "configured": true,
  "provider": "xkiro",
  "model": "google/gemini-3.7-flash"
}
```

The check validates the xKiro key using the account usage endpoint, then confirms the configured model exists in the live xKiro model catalog. The API key is never printed.

When the backend is running, the same safe probe is available at:

```text
GET /api/v1/health/ai
```

## Runtime behavior

- Provider: xKiro.
- Default model: `google/gemini-3.7-flash`.
- Protocol: OpenAI-compatible `POST /v1/chat/completions`.
- JSON mode is requested with `response_format: { "type": "json_object" }`.
- FinX still validates every generated object with Zod before persistence.
- Credits are reserved atomically before generation and automatically refunded when generation fails.
- FinX idempotency prevents duplicate internal credit charges.
- Retryable xKiro 429/5xx responses use bounded backoff.
- Provider credentials and raw provider error messages are never returned to the browser.

## Supported FinX tools

- Social post
- Ad copy/design direction
- Five content ideas
- Seven-day campaign
- Variations of previously generated content

The Ad Design tool currently generates advertising copy and art direction. Native AI image generation is a separate capability.
