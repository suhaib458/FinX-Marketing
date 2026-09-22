# FinX Marketing — Production Hardening Phase 2

## Implemented

- Backend-authoritative AI generation credits.
- Atomic credit reservation before AI generation.
- Automatic credit refund if the AI provider fails.
- Idempotency keys to prevent duplicate charging.
- Persistent `GenerationJob` and `GeneratedContent` records.
- Content save/unsave and soft-delete backend endpoints.
- Backend-generated content variations.
- Authenticated frontend API client with token refresh and timeouts.
- Brand profile create/update synchronization with the backend.
- Library reads saved content from the backend with local cache fallback.
- Result pages read/update persisted content from the backend.
- Frontend credit cache is synchronized from backend balances.
- Google/email auth continues to use the `/api/v1` backend session flow.

## Backend endpoints added/extended

- `POST /api/v1/ai/generate`
- `POST /api/v1/contents/:contentId/variations`
- `PATCH /api/v1/contents/:contentId`
- `DELETE /api/v1/contents/:contentId`
- Existing `/api/v1/brands`, `/api/v1/credits`, and `/api/v1/contents` are now used by the frontend migration.

## Safety / consistency behavior

- AI generation never exposes the Gemini key to the browser.
- Credits are deducted server-side only in API mode.
- A failed provider call triggers an automatic refund ledger entry.
- Duplicate idempotency keys return the existing completed result instead of charging again.
- Brand IDs are ownership-checked before being attached to generated content.

## Validation performed in this environment

- Node syntax checks passed for all changed backend and service-layer JavaScript files.
- Full npm/Vitest execution was not possible in the isolated runtime because dependencies are not installed and network package installation is unavailable.
