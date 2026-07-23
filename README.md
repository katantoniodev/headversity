# Headversity Ops

Personal task board, knowledge base, and sales dashboard. Built with Next.js
(App Router), Tailwind CSS, and Supabase (Postgres + Auth).

## Environment variables

Copy `.env.example` to `.env.local` for local development, or set the same
keys in Vercel project settings for deployment.

| Variable | Where it's used | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Supabase anon/public key (safe to expose; protected by RLS) |
| `NEXT_PUBLIC_SITE_URL` | server | Base URL used to build the magic-link redirect, e.g. `https://your-app.vercel.app` |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Not yet used in Phase 0 |
| `ANTHROPIC_API_KEY` | server only | Used starting Phase 2 (transcript parsing) |
| `HUBSPOT_PRIVATE_APP_TOKEN` | server only | Used starting Phase 4 (KPI dashboard) |
| `USER_NAME_ALIASES` | server only | Used starting Phase 2 |

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Auth

Login is a Supabase magic link: enter an email on `/login`, click the link
from your inbox, and you're redirected back to `/auth/callback`, which
exchanges the link for a session. All routes except `/login` and `/auth/*`
require a signed-in session (enforced in `src/middleware.ts`).
