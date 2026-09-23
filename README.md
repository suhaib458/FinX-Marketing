# FinX — AI Marketing Platform

<div align="center">

### From idea to publish-ready content.

FinX is a bilingual AI-assisted marketing workspace that helps small and growing businesses turn brand context into social posts, ad concepts, content ideas, and structured campaigns — from one responsive web experience.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Open_FinX-E34A9B?style=for-the-badge&logo=vercel&logoColor=white)](https://fin-x-marketing.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-FinX--Marketing-181717?style=for-the-badge&logo=github)](https://github.com/suhaib458/FinX-Marketing)

[![CI](https://github.com/suhaib458/FinX-Marketing/actions/workflows/ci.yml/badge.svg)](https://github.com/suhaib458/FinX-Marketing/actions/workflows/ci.yml)
[![CodeQL](https://github.com/suhaib458/FinX-Marketing/actions/workflows/codeql.yml/badge.svg)](https://github.com/suhaib458/FinX-Marketing/actions/workflows/codeql.yml)
[![Production Smoke](https://github.com/suhaib458/FinX-Marketing/actions/workflows/production-smoke.yml/badge.svg)](https://github.com/suhaib458/FinX-Marketing/actions/workflows/production-smoke.yml)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Storage-FFCA28?logo=firebase&logoColor=black)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-Aiven-4479A1?logo=mysql&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)

</div>

---

<div align="center">
  <img src="./docs/images/finx-hero.webp" alt="FinX landing page — From idea to publish-ready content" width="100%" />
</div>

## Overview

**FinX** is an AI marketing platform built to reduce the time between having an idea and having usable marketing content.

Instead of switching between separate tools for brainstorming, writing, campaign planning, brand context, asset storage, and analytics, FinX brings those workflows together in one product. A business can define its identity, choose a content goal and platform, generate a result, refine it, and keep reusable work in the same environment.

The product currently includes:

- Business onboarding and brand identity capture.
- AI-assisted social post and caption generation.
- Ad copy and design-concept generation.
- Audience-aware content idea generation.
- Structured 7-day marketing campaign generation.
- Generated-result editing and variants.
- Content library and asset workflows.
- Dashboard and analytics surfaces.
- Firebase authentication with Google and email/password flows.
- Arabic and English interfaces with RTL/LTR support.
- Dark/light themes and a responsive, mobile-focused experience.
- Real backend AI mode plus an explicit mock mode for demos and local UI testing.

> **Live application:** https://fin-x-marketing.vercel.app

---

## Product Showcase

### Everything you need to create content

<div align="center">
  <img src="./docs/images/finx-features.webp" alt="FinX features — Post and Caption, Ad Design, Content Ideas and 7-Day Campaign" width="100%" />
</div>

| Tool | What it does |
| --- | --- |
| **Post & Caption** | Produces platform-aware marketing copy based on the business, audience, goal, and selected social platform. |
| **Ad Design** | Generates ad copy and visual/layout concepts that can be refined into campaign-ready creative work. |
| **Content Ideas** | Suggests relevant content directions so teams do not have to start every post from a blank page. |
| **7-Day Campaign** | Builds a structured week of ideas, captions, and campaign direction around a defined goal. |

FinX is designed around a simple principle: **the AI should understand the brand before it generates the content.**

---

## How FinX Works

<div align="center">
  <img src="./docs/images/finx-how-it-works.webp" alt="How FinX works in three steps" width="100%" />
</div>

1. **Tell FinX about your business**  
   Add the business context, audience, positioning, and brand identity that should guide generated content.

2. **Choose your goal and platform**  
   Select what you want to create and where it will be published.

3. **Generate and refine**  
   FinX sends the authenticated request to the backend AI service and returns structured content that can be reviewed, edited, reused, or saved.

---

## Why FinX

<div align="center">
  <img src="./docs/images/finx-why-choose.webp" alt="Why choose FinX" width="100%" />
</div>

FinX is being built around four product priorities:

- **Brand consistency** — preserve business tone, visual direction, and context between workflows.
- **Speed** — compress the path from idea to first usable draft.
- **Reusable output** — keep generated content inside a library instead of treating every generation as disposable.
- **Continuous improvement** — provide dashboard and analytics surfaces that can evolve with real campaign data and external integrations.

---

## Core Product Areas

### AI Marketing Workspace

The generation experience is organized around the user's business rather than around a generic chat box. Requests can carry relevant brand and workflow context so outputs are more consistent and easier to use.

### Brand Onboarding

FinX captures business information and brand identity during onboarding. The backend already includes Brand CRUD APIs, while the product continues moving remaining local-first flows toward fully database-backed persistence.

### Content Library

Generated work can be collected and reused through the Library experience. The architecture supports the ongoing migration from browser-local prototype persistence to backend content records and storage-backed assets.

### Authentication

Authentication uses **Firebase Authentication** with backend token verification through **Firebase Admin**. Supported product flows include:

- Google authentication.
- Email/password registration and login.
- Email verification.
- Password reset.
- Backend application-session provisioning.

### Bilingual Interface

FinX supports both:

- **English — LTR**
- **Arabic — RTL**

The language system is part of the application experience rather than a separate landing-page translation.

### Mobile-First Experience

The responsive UI includes a dedicated mobile application shell, mobile navigation, touch-friendly interactions, launch splash behavior, safe-area handling, and reduced-motion support.

---

## Architecture

```mermaid
flowchart LR
    U[User] --> W[React 19 + Vite 8]
    W --> FA[Firebase Authentication]
    W --> API[Express 5 API /api/v1]
    FA --> API
    API --> SEC[Auth + Helmet + CORS + Rate Limits + Zod]
    SEC --> AI[xKiro AI Gateway]
    AI --> M1[Primary AI Model]
    AI --> M2[Fallback AI Model]
    API --> P[Prisma 7]
    P --> DB[(Aiven MySQL)]
    API --> FS[Firebase Storage]
    API --> VB[Vercel Blob]
    W --> UI[Library / Dashboard / Analytics]
```

### Request flow

```text
Browser
  │
  ├── Firebase Authentication
  │
  └── /api/v1
        │
        ├── Token verification
        ├── Validation & security middleware
        ├── AI generation
        ├── Prisma / MySQL
        └── Asset storage
```

The frontend defaults to a same-origin **`/api/v1`** API path. During local Vite development that path is proxied to the local Express backend.

---

## AI Integration

FinX keeps AI credentials **server-side only**.

The production-oriented AI path is:

```text
React client
   ↓
Authenticated Express endpoint
   ↓
xKiro gateway
   ↓
Configured primary model
   ↓
Configured fallback model when applicable
```

The backend environment currently supports a primary model and a fallback model through xKiro. Model names and provider configuration are environment-driven, which means the frontend does not need secret credentials or provider-specific logic.

### AI modes

| Mode | Purpose |
| --- | --- |
| `VITE_AI_MODE=api` | Uses the authenticated backend and real server-side AI generation. |
| `VITE_AI_MODE=mock` | Uses the frontend mock generator for demos, UI development, or offline-style testing. |

Never place AI keys in a `VITE_*` variable.

---

## Technology Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React 19, Vite 8, React Router 7 |
| **UI** | Custom CSS design system, Lucide React, responsive layouts |
| **Backend** | Node.js 24, Express 5 |
| **Authentication** | Firebase Authentication + Firebase Admin |
| **Database** | Prisma 7 + MySQL/MariaDB |
| **Production DB** | Aiven MySQL |
| **Storage** | Firebase Storage, Vercel Blob support |
| **AI** | Server-side xKiro gateway with environment-configured primary/fallback models |
| **Validation** | Zod |
| **Security** | Helmet, CORS allow-list, rate limiting, token verification |
| **Logging** | Pino + request IDs |
| **Testing** | Vitest, Supertest, Playwright |
| **API Contract** | OpenAPI validation |
| **Deployment** | Vercel |
| **CI / Security Analysis** | GitHub Actions + CodeQL |

---

## Security Design

FinX follows several important security rules:

- AI/API secrets remain on the backend.
- Firebase ID tokens are verified server-side.
- Sensitive `.env` files, service-account JSON, private keys, and credentials are excluded from Git.
- Express uses **Helmet** for security headers.
- CORS is controlled through an allow-list.
- API requests are rate-limited.
- Input is validated with **Zod**.
- Server logs use request identifiers for easier traceability.
- Production secrets are expected to be configured in the deployment environment, not committed to the repository.

> Do not commit `.env`, Firebase Admin credentials, private keys, database passwords, or AI API keys.

---

## Getting Started

### Prerequisites

- **Node.js 24.x**
- npm
- MySQL or MariaDB for local database-backed development
- A Firebase project
- Backend AI credentials for real generation mode

### 1. Clone the repository

```bash
git clone https://github.com/suhaib458/FinX-Marketing.git
cd FinX-Marketing
```

### 2. Install dependencies

```bash
npm ci
npm --prefix backend ci
```

### 3. Configure frontend environment variables

Copy:

```text
.env.example → .env.local
```

Example:

```env
VITE_API_BASE_URL=/api/v1

VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

VITE_MAX_UPLOAD_SIZE_MB=25
VITE_AI_MODE=api
```

### 4. Configure backend environment variables

Copy:

```text
backend/.env.example → backend/.env
```

Configure at least the services required by your local workflow:

```env
NODE_ENV=development
PORT=3001

DATABASE_URL=mysql://user:password@127.0.0.1:3306/finx_dev
SHADOW_DATABASE_URL=mysql://user:password@127.0.0.1:3306/finx_shadow

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app

XKIRO_API_KEY=your-server-side-key
XKIRO_BASE_URL=https://api.xkiro.com/v1
XKIRO_MODEL=your-primary-model
XKIRO_FALLBACK_MODEL=your-fallback-model
```

Use either a local Firebase Admin credentials file or the protected service-account JSON environment variable supported by the backend.

### 5. Prepare Prisma

```bash
npm run db:validate
npm run db:generate
```

When you are working with a configured local database, use the repository's migration and seed commands as appropriate:

```bash
npm run db:migrate
npm run db:seed
```

### 6. Start frontend + backend

```bash
npm run dev:all
```

The Vite frontend uses `/api/v1` and proxies local API traffic to the Express development server.

---

## Useful Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite frontend |
| `npm run dev:backend` | Start the Express backend |
| `npm run dev:all` | Start frontend and backend together |
| `npm run build` | Build the frontend |
| `npm run lint` | Lint frontend source |
| `npm run test:run` | Run frontend tests once |
| `npm run lint:backend` | Lint backend source |
| `npm run test:backend:run` | Run backend tests once |
| `npm run backend:openapi` | Validate the OpenAPI contract |
| `npm run verify:source` | Run the source-level verification pipeline |
| `npm run verify:database` | Run DB/integration verification when infrastructure is configured |
| `npm run ai:check` | Check AI connectivity/configuration |
| `npm run storage:check` | Check storage connectivity/configuration |

---

## Continuous Integration

The repository includes GitHub Actions workflows for:

- Source verification and automated checks.
- Authenticated end-to-end testing.
- CodeQL JavaScript security analysis.
- Production smoke testing.
- Production AI-path verification when the required deployment secrets are available.

The CI setup is intended to catch regressions before changes reach the production experience.

---

## Deployment

The current production architecture uses:

- **Vercel** — frontend and serverless API deployment.
- **Aiven MySQL** — production relational database.
- **Firebase Authentication** — user identity.
- **Firebase Storage** — authenticated media/asset storage.
- **Vercel Blob support** — additional server-side asset storage capability.
- **GitHub Actions** — CI, security checks, and production smoke validation.

Production URL:

**https://fin-x-marketing.vercel.app**

---

## Project Structure

```text
FinX-Marketing/
├── .github/
│   └── workflows/
├── backend/
│   ├── prisma/
│   ├── scripts/
│   ├── src/
│   └── tests/
├── docs/
│   └── images/
├── e2e/
├── public/
├── scripts/
├── src/
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── services/
│   └── styles/
├── .env.example
├── package.json
├── playwright.config.js
├── vercel.json
├── vite.config.js
└── README.md
```

The exact internal folders may evolve as prototype-era services are replaced by backend-backed production flows.

---

## Current Project Status

FinX has moved beyond a static UI prototype: the repository now contains real Firebase authentication, an Express API, database models, storage integration, server-side AI generation, automated tests, CI, production deployment configuration, and production smoke checks.

At the same time, the project is still actively evolving. Some product areas are intentionally described as **in progress** rather than presented as finished infrastructure — especially complete migration of remaining browser-local content flows and real external social/ads performance analytics.

That distinction keeps this README aligned with what the codebase actually implements today.

---

## Roadmap

Near-term directions include:

- Complete backend persistence for remaining generated-content and editing flows.
- Continue connecting brand/profile state directly to backend Brand APIs.
- Expand library persistence and asset management.
- Add richer AI variation/editing workflows.
- Improve production-grade visual generation for ad creative.
- Replace remaining prototype dashboard metrics with database-derived metrics.
- Integrate supported social/ads APIs when real campaign-performance analytics are required.
- Add stronger observability, usage controls, and AI cost monitoring.
- Continue polishing the dedicated mobile experience.

---

## Design Philosophy

FinX uses a dark premium visual identity built around pink, plum, and violet accents, with a strong focus on clarity, fast workflows, and polished mobile behavior.

The interface is designed so that sophisticated AI and backend workflows still feel like a simple sequence:

**Business → Goal → Platform → Generate → Refine → Reuse**

---

## Final Experience

<div align="center">
  <img src="./docs/images/finx-cta.webp" alt="FinX — Your idea deserves better content" width="100%" />
</div>

<div align="center">

### Your idea deserves better content.

**Better content. Bigger results. Less time.**

[Open FinX](https://fin-x-marketing.vercel.app) · [View Repository](https://github.com/suhaib458/FinX-Marketing) · [Report an Issue](https://github.com/suhaib458/FinX-Marketing/issues)

</div>

---

## Contributing

Issues and pull requests are welcome. For substantial changes, open an issue first so the implementation direction can be discussed before code is changed.

Before opening a pull request, run the source verification pipeline:

```bash
npm run verify:source
```

Database/integration checks require the relevant local or CI infrastructure to be configured.

---

## Disclaimer

AI-generated marketing content should be reviewed before publication. FinX assists with ideation and content production; users remain responsible for factual accuracy, brand compliance, platform rules, advertising requirements, and rights to any uploaded or published assets.
