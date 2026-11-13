# StudyHub

## Overview
AI-powered educational marketplace: students upload, buy, and sell study notes,
question papers, and projects, and use AI study tools (semantic search, RAG chat
with purchased notes, summaries, quizzes, flashcards, revision). Built in 5 phases
(foundation → marketplace → admin/trust → AI → launch hardening).

## Tech stack
- Next.js 15 App Router (`^15.1.6`; Vercel has built on 15.5.20), React 19, TypeScript 5.7
- Tailwind CSS 3.4 + shadcn-style components in `components/ui`
- Supabase: Postgres + `pgvector`, Auth (email/password), Storage. Row Level Security on every table.
- Google Gemini REST (no SDK): `gemini-2.0-flash` (text) + `gemini-embedding-001` @ 768 dims (search/RAG)
- Zod validation, Vitest tests, Vercel hosting + Vercel Analytics
- Security model: anon key + RLS only. There is **no** `service_role` key anywhere.

## Setup on a fresh machine
1. Node 18.18+ (Next 15 requirement) and npm. *(exact version unverified — no `engines` field)*
2. `npm install`
3. Copy `.env.example` → `.env.local` and fill values (see Env vars). Only needed to run locally.
4. Supabase: create a project, then in the SQL Editor run the 8 files in `supabase/` **in order**:
   `schema.sql` → `storage.sql` → `seed.sql` → `migration-phase2.sql` → `-phase3` → `-phase4` → `-phase5` → `-phase6`.
5. `npm run dev` → http://localhost:3000

## Commands
- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`   •   Prod start: `npm run start`
- Lint: `npm run lint`
- All tests: `npm run test`   •   Single file: `npx vitest run tests/utils.test.ts`   •   By name: `npx vitest run -t "finalPrice"`
- DB migrations: no CLI — paste `supabase/*.sql` into the Supabase SQL Editor in the order above.
- Deploy: push to `main` on GitHub (`jyotiram7402/studyhub`) → Vercel auto-deploys. Env-var changes require a redeploy.

## Project map
- `app/(auth)/` — login, register, forgot/reset password, `auth/callback`
- `app/(main)/` — public site + dashboard + admin + checkout (shares navbar/footer layout)
- `app/api/` — route handlers (31). `api/admin/*` are admin-only; `api/notes/[id]/*` cover download, process, chat, quiz, etc.
- `app/` root — `layout.tsx`, `error.tsx`, `global-error.tsx`, `not-found.tsx`, `offline/`, `robots.ts`, `sitemap.ts`
- `components/` — `ui/` (primitives), plus `layout/ notes/ reviews/ dashboard/ admin/ ai/ checkout/ landing/ orders/`
- `lib/` — `supabase/` (client/server/middleware), `ai/` (Gemini pipeline, RAG, study tools), `queries/` (server data access),
  `validations/` (zod), `payments/` + `email/` (swappable provider interfaces), `auth.ts`, `rate-limit.ts`, `gamification.ts`, `env.ts`, `constants.ts`, `types.ts`, `utils.ts`
- `supabase/` — schema + 5 phase migrations + storage + seed (8 files)
- `tests/` — Vitest unit tests   •   `docs/` — `DEPLOYMENT.md`, `PROJECT-REFERENCE.md`
- Data flow: Server Component/route → `lib/queries` or RPC → Supabase (RLS enforces access) → render. AI: route → `lib/ai/*` → Gemini.

## Where to start for common tasks
- **New API endpoint** → `app/api/<name>/route.ts`. Pattern: `createClient()` from `lib/supabase/server`, `supabase.auth.getUser()` for auth, validate body with a `lib/validations` schema, return `NextResponse.json({error}, {status})`. Admin routes: guard with `requireAdmin()` from `lib/auth`.
- **New page** → `app/(main)/<route>/page.tsx` (Server Component by default).
- **DB change** → add a new `supabase/migration-phaseN.sql` (never edit applied ones); keep RLS + put money/trust logic in `security definer` functions.
- **New data query** → `lib/queries/*`.
- **Swap payment/email provider** → implement the interface in `lib/payments` / `lib/email`; select via env var.

## Conventions
- Server Components by default; add `"use client"` only for interactivity.
- **All pricing and payment settlement happens server-side in Postgres `security definer` functions** (`create_note_order`, `complete_order_payment`). The client never sends a price. Never change this to trust client amounts.
- RLS on every table; prefer RLS + RPCs over bypassing with elevated keys.
- Auth/role checks: `lib/auth.ts` (`requireUser`, `requireAdmin`, `logAdminAction`).
- Downloads: purchase-checked, then short-lived signed URL from the private `note-files` bucket.
- AI runs **server-side only** via `lib/ai/gemini.ts`; it degrades gracefully (full-text search fallback) when `GEMINI_API_KEY` is absent.
- When you deliver a code fix, also give a ready-to-use git commit message (the owner commits changes manually).

## Env variables & external services
Set in Vercel (prod) and `.env.local` (dev). Values live in Vercel/Supabase/Google — never commit real ones.
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (Settings → API)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key (Settings → API)
- `NEXT_PUBLIC_SITE_URL` — canonical deployed URL (falls back to `VERCEL_URL`, then localhost)
- `PAYMENT_PROVIDER` — `sandbox` (test gateway; real ones register in `lib/payments`)
- `EMAIL_PROVIDER` — `console` (logs instead of sending)
- `GEMINI_API_KEY` — Google AI Studio key; server-only, enables all AI. aistudio.google.com/apikey
Services: GitHub (code) → Vercel (host + analytics) → Supabase (DB/auth/storage) + Gemini (AI).

## Gotchas
- Run **all 8 SQL files in order**. `migration-phase6.sql` is a **P0 security fix** (blocks profile privilege escalation — self-setting `role`/`is_verified`/`status`/`points`); must be applied to any live DB.
- Supabase free tier **pauses after 7 days idle** (site breaks until resumed). Vercel Hobby is non-commercial.
- Gemini free tier ≈ 15 req/min; each upload = ~4–5 calls. Code retries transient 429s; space out testing.
- Keep `GEMINI_API_KEY` server-only (no `NEXT_PUBLIC_` prefix). Never introduce a `service_role` key into app code.
- Payments are **sandbox/test only**; email is a **console placeholder**. Not real yet.
- After changing any Vercel env var you must redeploy.

## Current status
- Deployed: GitHub `jyotiram7402/studyhub` → Vercel, Supabase backend, Gemini AI. Production URL *(unverified — not recorded here)*.
- Whether every migration (esp. `phase6`) is applied to the live DB: **(unverified — confirm in Supabase)**.
- Security: static audit done; P0 profile-escalation fixed in `migration-phase6.sql`; JSON-LD XSS escaped in `app/(main)/notes/[id]/page.tsx`.
- Not done: real payment gateway, real email delivery, and live/Playwright end-to-end QA (never executed).
- Next steps: confirm `phase6` applied to prod; run live QA on the critical path; wire a real payment + email provider before charging real money.

When you change commands, structure, env vars or conventions, update this file in the same commit.
