# FinX Gemini integration

FinX uses the Gemini API only from the Express backend. The browser never receives the Gemini API key.

## Local configuration

Add these values to `backend/.env`:

```env
GEMINI_API_KEY=replace-with-your-key
GEMINI_MODEL=gemini-3.8-flash
GEMINI_THINKING_LEVEL=low
AI_REQUEST_TIMEOUT_MS=60000
```

Do **not** prefix the key with `VITE_` and do not place it in the root frontend `.env.local`.

The repository `.gitignore` excludes `.env` files and local credentials.

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
  "provider": "gemini",
  "model": "gemini-3.8-flash"
}
```

When the backend is running, the same safe probe is available at:

```text
GET /api/v1/health/ai
```

The endpoint never returns the API key.

## Runtime behavior

- Model: Gemini 3.8 Flash by default.
- Thinking level: `low` for lower latency and cost on marketing generation.
- Structured JSON schemas are supplied to Gemini for all FinX generation tools.
- Generated content is validated again on the backend before persistence.
- Credits are reserved atomically before generation and automatically refunded when generation fails.
- Idempotency prevents duplicate charges for repeated requests.
- Transient Gemini 429/5xx failures are retried server-side.
- Provider credentials and provider error details are never returned to the browser.

## Supported FinX tools

- Social post
- Ad copy/design direction
- Five content ideas
- Seven-day campaign
- Variations of previously generated content

The current Ad Design tool produces AI-generated advertising copy and visual direction, then FinX renders the existing design preview. Native AI image generation is a separate capability and is not enabled by this integration.
