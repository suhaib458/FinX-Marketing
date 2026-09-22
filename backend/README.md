# FinX Backend — Phase 5C

This package is the backend foundation for FinX. The Vite/React frontend now uses it for Firebase-authenticated session synchronization and application identity. Content, credits UI, Library, generation, and brand persistence remain on the approved temporary frontend mocks until their later phases.

## Architecture

The backend is one modular Express 5 application using JavaScript ESM. `src/app.js` composes middleware and routes without opening a network port; `src/server.js` owns listening and graceful shutdown. Controllers call services, services enforce application rules, repositories are the only Prisma data-access layer, and Zod schemas validate environment, parameters, queries, and mutation bodies.

Prisma 7 uses `@prisma/adapter-mariadb`, a single reusable client, and a bounded driver pool. The schema targets MySQL only. It is compatible with Arabic and emoji when the MySQL database and connection use `utf8mb4`; create the local database with an appropriate modern `utf8mb4` collation such as `utf8mb4_0900_ai_ci` on MySQL 8.0/8.4.

## Prerequisites

- Node.js 24 LTS (`>=24 <25`)
- npm 11 or a compatible npm version
- MySQL 8.0 or 8.4 for migrations, seed, and integration verification. MySQL 8.0.46 was verified for Phase 5B.
- A Firebase project with Email/Password and Google providers enabled.
- Firebase Admin Application Default Credentials supplied outside this repository.

Docker remains unavailable, so no unverified Compose definition was added. Local MySQL 8.0.46 is used directly. SQLite is not supported or used.

Create dedicated databases and an application user with an administrative MySQL account outside the application. Replace every placeholder and adjust the local host scope as needed:

```sql
CREATE DATABASE finx_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE finx_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'finx_app'@'localhost' IDENTIFIED BY '<strong-local-password>';
GRANT ALL PRIVILEGES ON finx_dev.* TO 'finx_app'@'localhost';
GRANT ALL PRIVILEGES ON finx_shadow.* TO 'finx_app'@'localhost';
```

Do not run the application or Prisma as MySQL `root`.

## Local setup

1. Run `npm install` in the project root.
2. Run `npm install` in `backend/` (or `npm run backend:install` at the root).
3. Copy `.env.example` to `.env` inside `backend/` and replace only the local development placeholders. Point `GOOGLE_APPLICATION_CREDENTIALS` to a service-account JSON outside the repository.
4. Create or confirm dedicated, non-production `finx_dev` and `finx_shadow` databases using `utf8mb4`, plus a separate application user.
5. Run `npm run db:validate` and `npm run db:generate` at the root.
6. Run `npm run db:check` and confirm that it reports only the intended development database.
7. After confirming the target, run `npm run db:migrate` and `npm run db:seed`.
8. Run `npm run test:mysql`, `npm run smoke:backend`, and `npm run verify` from the root.
9. Run `npm run dev:backend` from the root for normal development.

Never point migration or seed commands at production or an unknown database. Never accept a Prisma reset prompt without explicit authorization.

## Environment variables

| Variable | Purpose | Default/requirement |
| --- | --- | --- |
| `NODE_ENV` | Runtime mode | `development` |
| `PORT` | HTTP port | `3001` |
| `APP_VERSION` | Safe version response/log field | `0.1.0` |
| `DATABASE_URL` | Dedicated MySQL connection URL | Required in production and for DB-backed endpoints |
| `SHADOW_DATABASE_URL` | Dedicated Prisma development shadow database | Required for `prisma migrate dev` |
| `FIREBASE_PROJECT_ID` | Firebase Admin project/audience | Required in production |
| `GOOGLE_APPLICATION_CREDENTIALS` | ADC service-account path | Local runtime setting; never committed |
| `CORS_ORIGINS` | Comma-separated explicit origins | `http://localhost:5173`; non-empty in production |
| `LOG_LEVEL` | Pino level | `info` |
| `ALLOW_DEV_AUTH` | Enables the isolated dev header adapter | `false`; production rejects `true` |
| `TRUST_PROXY` | Express trust-proxy switch | `false` |
| `RATE_LIMIT_WINDOW_MS` | Rate-limit window | `60000` |
| `RATE_LIMIT_MAX` | Requests per window | `120` |
| `JSON_BODY_LIMIT` | JSON and URL-encoded limit | `100kb` |

The application never logs a complete database URL, authorization header, cookie, password, token, secret, or full request body.

## Database workflow

- Validate schema: `npm run db:validate`
- Generate client: `npm run db:generate`
- Confirm the safe database identity/version/encoding: `npm run db:check`
- Create/apply migrations after confirming the target: `npm run db:migrate`
- Inspect migration state: `npm run db:status`
- Seed development fixtures: `npm run db:seed`
- Verify seed counts and cleanup: `npm run db:verify-seed`

The idempotent development seed creates User A and User B, exactly one wallet for each, and one protected initial 100-credit entry for each. It refuses production. Re-running it does not duplicate those records.

The initial migration is `prisma/migrations/20260814185523_init_phase_5b/migration.sql`. Phase 5C adds `prisma/migrations/20260815003000_add_firebase_auth/migration.sql`, preserving the former external identity column as unique `firebaseUid` and adding verification/profile timestamps. Both migrations are applied and current. Do not edit an applied migration.

## Authentication

Normal authentication requires `Authorization: Bearer <Firebase ID token>`. Firebase Admin validates signature, issuer, audience, and expiry. Revocation is intentionally not checked remotely on every Phase 5C request; short-lived ID-token expiry and forced client refresh on the first 401 are used. Tokens, passwords, authorization headers, and credentials are never logged or returned.

`POST /auth/session` accepts no client identity. A verified token provisions exactly one normalized user, wallet, and 100-credit ledger grant in a MySQL transaction. Unverified email accounts are rejected before provisioning. Existing-email conflicts return a safe 409 and are never auto-linked.

For local development/tests only, set `ALLOW_DEV_AUTH=true` and send a seeded user UUID in `x-finx-dev-user-id`. The adapter loads the user from MySQL and rejects missing, suspended, deleted, or unknown users. It never accepts email or role headers. Production startup fails if development auth is enabled, and `/auth/session` always requires a real bearer token.

Seed user IDs:

- User A: `00000000-0000-4000-8000-00000000000a`
- User B: `00000000-0000-4000-8000-00000000000b`

## API

All endpoints use `/api/v1`:

- Public: `GET /health/live`, `GET /health/ready`, `GET /version`
- Firebase session: `POST /auth/session`
- Protected with Firebase bearer or explicitly enabled non-production dev auth: `GET /me`
- Brands: `GET|POST /brands`, `GET|PATCH|DELETE /brands/:brandId`
- Read-only credits: `GET /credits`, `GET /credits/ledger`
- Read-only content: `GET /contents`, `GET /contents/:contentId`

Brand and collection queries enforce the authenticated `userId` in the repository query. Brand deletion is soft deletion. There is no public balance mutation or content creation endpoint. Brand-plan limits remain deferred until plan rules are finalized.

The complete contract and envelopes are in `openapi.yaml`; validate it with `npm run openapi:validate`.

## Testing and scripts

- `npm run lint`
- `npm run test` (watch mode)
- `npm run test:run`
- `npm run test:mysql`
- `npm run smoke:api`
- `npm run openapi:validate`
- `npm run audit`

The normal API tests use Vitest, Supertest, and injected in-memory repositories. The separate opt-in MySQL suite uses the real `finx_dev` database and cleans only its fixed test records. `smoke:api` starts Express on HTTP, exercises the real database-backed endpoints, verifies CORS/rate limiting, and removes its fixtures. Root `npm run verify` runs source checks plus the real MySQL suite, smoke test, migration status, and final seed-cleanliness proof.

## Troubleshooting

- `GET /health/live` can return 200 without MySQL by design.
- `GET /health/ready` returns 503 until `DATABASE_URL` points to a reachable MySQL instance.
- A startup environment error names the invalid variable but does not print its value.
- If Prisma proposes a reset, cancel it and verify the target database.
- If Arabic/emoji round trips fail, verify the database, tables, and connection use `utf8mb4`.

## Phase 5C verification status

The Phase 5C source includes real Firebase Web/Auth and Admin integration plus isolated Firebase-token tests that do not call the live service. The MySQL migration and provisioning tests run against local MySQL 8.0.46. Live Email/Password, email delivery/action links, and Google popup acceptance remain manual checks and are not claimed by automated tests.

Local `.env` files and the external service-account JSON are ignored/untracked and must never be committed.

Object storage/uploads (5D), Gemini and job processing (5E), transactional credit operations (5F), payments (5H), analytics processing (5I), administration (5J), and deployment are explicitly deferred.
