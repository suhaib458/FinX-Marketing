# FinX — AI Marketing Platform

FinX is an AI-assisted marketing workspace for small and growing businesses. It combines brand onboarding, content generation, campaign planning and reusable marketing assets in one Arabic/English web experience.

## Stack

- React + Vite
- Express API
- Firebase Authentication + Firebase Admin
- Firebase Storage
- Prisma + MySQL/MariaDB
- Gemini API for real content generation

## Local setup

1. Install frontend and backend dependencies:

   `npm ci`

   `npm --prefix backend ci`

2. Copy the example environment files and fill in your own values:

   `.env.example` -> `.env.local`

   `backend/.env.example` -> `backend/.env`

3. Configure Firebase Authentication providers and the Firebase Admin service-account path.

4. Configure MySQL/MariaDB and run the Prisma migration/generation commands.

5. Add `GEMINI_API_KEY` to `backend/.env` for real AI generation. Keep it server-side only.

6. Start both frontend and backend together:

   `npm run dev:all`

The frontend defaults to `/api/v1`; Vite proxies that path to `http://localhost:3001` during local development.

## AI mode

`VITE_AI_MODE=api` uses the authenticated backend and Gemini.

`VITE_AI_MODE=mock` keeps the original frontend-only prototype generator for demos/offline UI testing.

## Mobile splash

Mobile screens up to 820px show `public/finx-splash-mobile.mp4` once per browser session when the app launches.

## Security

Never commit `.env` files, Firebase Admin JSON, service-account files, or private keys. The repository `.gitignore` already excludes these files.

See `PROJECT_AUDIT.md` for the current migration status and remaining production work.
