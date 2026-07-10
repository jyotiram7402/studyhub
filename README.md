# StudyHub

A marketplace where students upload, discover, and share study material — handwritten notes, question papers, assignments, lab manuals, presentations, and projects — across every university, board, and exam stream.

Built with Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, and Supabase (Postgres, Auth, Storage). Deploys to Vercel with zero local setup.

## Features

- **Authentication** — register, login, logout, forgot/reset password, protected routes via middleware
- **Upload & sell** — PDF, DOC/DOCX, PPT/PPTX, ZIP, and images up to 50 MB with thumbnail, tags, course metadata, price, discount, version/edition, and public/private visibility
- **Marketplace** — Buy Now checkout with order summary, tax line, and terms; a sandbox payment gateway behind a provider abstraction (Stripe/Razorpay/PayPal slot in via `lib/payments`)
- **Buyer library** — purchased items with lifetime re-download, order history with payment status, recently viewed
- **Seller dashboard** — revenue, wallet balance, sales, product and download counts, pending/completed orders, recent purchases, monthly earnings reports, buyer list
- **Secure delivery** — files live in a private bucket; downloads require login (and a purchase for paid items) and are served through short-lived signed URLs
- **Discovery** — full-text search (Postgres `tsvector`), filters for category/university/course/subject/semester/language/file type/price/price range, sorting by newest, most downloaded, most viewed, best sellers, highest rated
- **Reviews & ratings** — 5-star reviews from verified buyers/downloaders, helpful votes, per-note rating distribution, seller ratings
- **Trust & safety** — content reporting (spam, copyright, broken files, and more), seller verification with badge, account suspension, full admin and user audit logs
- **Admin console** — dashboard with revenue/user/content stats, user management, seller verification queue, listing moderation (approve/hide/remove/restore/feature/Editor's Choice), report review, review moderation, taxonomy management, daily analytics charts, platform settings (branding, commission %, upload limits, maintenance mode)
- **Notifications** — in-app notification center fed by database triggers (purchases, sales, reviews, moderation decisions, report outcomes)
- **AI platform (Gemini free tier + pgvector)** — semantic natural-language search ("3rd semester DBMS notes"), automatic document processing on upload (text extraction with OCR for scanned/handwritten PDFs and images, chunking, embeddings), AI summaries with key topics/difficulty/reading time, quality scores, duplicate detection with similarity warnings, embedding-based related notes and personalised recommendations
- **AI study tools** — chat with any note you own (RAG, grounded strictly in the document), a library-wide study assistant, explanations in four styles, quiz generation (MCQ, short/long, true-false, fill-in-the-blank), saved flashcard decks with practice mode, and 1-minute/5-minute/exam/night-before revision notes
- **Design** — light/dark mode, responsive layouts, loading skeletons, empty states
- **Launch hardening** — PWA (installable, offline fallback, service worker), full SEO (sitemap, robots, OpenGraph/Twitter cards, JSON-LD product schema, canonical URLs, breadcrumbs), strict security headers with CSP, per-user rate limiting on sensitive APIs, environment validation at boot, global error boundaries, Vercel Analytics
- **Search UX** — instant suggestions while typing, recent searches, trending and popular queries
- **Community** — contribution points and levels, achievements, public leaderboard, social sharing (WhatsApp, LinkedIn, X, copy link, QR code), notification center
- **Business-ready** — legal pages (terms, privacy, copyright, refunds, guidelines, cookies), monetization groundwork (plans, subscriptions, coupons, referrals), admin system-health dashboard with storage/AI/search metrics and cleanup jobs, unit test suite (Vitest)

## Deploy (no local tooling required)

### 1. Create the Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a new project (free tier).
2. Open **SQL Editor** and run the seven files from the `supabase/` folder **in this order**:
   1. `supabase/schema.sql` — tables, triggers, functions, row-level security
   2. `supabase/storage.sql` — storage buckets and access policies
   3. `supabase/seed.sql` — categories and starter reference data
   4. `supabase/migration-phase2.sql` — marketplace tables (orders, payments, purchases, wallets, reports), moderation, and their policies
   5. `supabase/migration-phase3.sql` — reviews & ratings, reports, seller verification, audit/activity logs, notifications, daily analytics, platform settings
   6. `supabase/migration-phase4.sql` — pgvector, embeddings, document chunks, AI chat, flashcards, quizzes, recommendations, and vector search functions
   7. `supabase/migration-phase5.sql` — gamification points and leaderboard, search analytics, monetization groundwork, cleanup functions

For the full launch checklist, backups, and free-tier scaling notes, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
3. In **Authentication → URL Configuration**, set the **Site URL** to your Vercel domain (you can update this after the first deploy) and add `https://<your-domain>/auth/callback` to the redirect allow list.

### 2. Push this repository to GitHub

Upload the project folder as-is (for example with GitHub's *Add file → Upload files* web UI). Do **not** upload a `.env` file.

### 3. Deploy on Vercel

1. Import the GitHub repository at [vercel.com/new](https://vercel.com/new). Vercel detects Next.js automatically and installs dependencies during the build.
2. Add these environment variables (from Supabase **Project Settings → API**):

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon/public key |
   | `NEXT_PUBLIC_SITE_URL` | your deployed URL, e.g. `https://studyhub.vercel.app` |
   | `PAYMENT_PROVIDER` | `sandbox` (test-mode gateway; real providers register in `lib/payments`) |
   | `EMAIL_PROVIDER` | `console` (logs transactional emails instead of sending) |
   | `GEMINI_API_KEY` | free key from [Google AI Studio](https://aistudio.google.com/apikey) — enables all AI features |

3. Deploy. Then go back to Supabase and set the Site URL / redirect URLs to the deployed domain so auth emails link correctly.

## Project structure

```
app/
  (auth)/            login, register, forgot-password, reset-password
  (main)/            navbar+footer shell: landing, browse, notes, upload,
                     profile, dashboard (with sidebar sub-layout)
  api/               route handlers: notes CRUD, bookmark, download, view, profile
  auth/callback/     OAuth/email confirmation code exchange
components/
  auth/              form components
  dashboard/         sidebar, stat cards, upload rows, settings form
  landing/           hero, features, categories, FAQ, testimonials, CTA
  layout/            navbar, footer, menus, search, theme toggle
  notes/             cards, filters, pagination, upload form, buttons
  ui/                shadcn/ui primitives
lib/
  queries/           server-side data access
  supabase/          browser / server / middleware clients
  validations/       zod schemas shared by forms and API routes
supabase/            schema.sql, storage.sql, seed.sql
```

### 4. Promote an admin (optional)

After creating your account, run this in the Supabase SQL editor to unlock the admin console at `/admin`:

```sql
update public.profiles set role = 'admin' where username = 'your_username';
```

## Payments (test mode)

Checkout runs against a sandbox gateway: card `4242 4242 4242 4242` approves, `4000 0000 0000 0002` declines, and no real money moves. Order creation and fulfilment happen in `security definer` Postgres functions (`create_note_order`, `complete_order_payment`) so prices, wallets, and purchase records can't be tampered with from the client. To go live, implement the `PaymentProvider` interface for Stripe/Razorpay/PayPal in `lib/payments/` and switch `PAYMENT_PROVIDER`.

## AI architecture

All AI calls go through `lib/ai/gemini.ts`, a dependency-free typed client for the Gemini REST API (`gemini-2.0-flash` for generation, `text-embedding-004` for 768-dimension embeddings). Uploads are processed by `lib/ai/processing.ts`: text is extracted via Gemini's multimodal input (which OCRs scanned and handwritten PDFs/images), chunked with overlap, embedded into pgvector (`embeddings` for search, `document_chunks` for RAG), then analysed once for the summary, topics, difficulty, auto-tags, detected course metadata, and quality score. Search embeds the query and ranks listings by cosine similarity with a full-text fallback when no key is configured — every AI feature degrades gracefully.

RAG answers are grounded: retrieval runs through `security definer` SQL functions (`match_note_chunks`, `match_library_chunks`) that re-check content access on every call, so the assistant can only ever read notes the user uploaded, purchased, or that are free and public. Chat history, flashcards, quizzes, and recommendations are all RLS-scoped to their owner.

## Security model

- Row-level security on every table: published notes are public, drafts and bookmarks are owner-only, and all writes are scoped to `auth.uid()`.
- Note files live in a **private** bucket; downloads require login and go through `/api/notes/[id]/download`, which returns a short-lived signed URL and records the download.
- Thumbnails live in a public bucket, scoped to per-user folders for writes.
- Every API route validates input with zod and re-checks the session server-side; upload paths are verified to belong to the caller.
- View/download counters update through `security definer` functions so counts can't be tampered with directly.

## Roadmap

Payments, purchases, seller payouts, notifications, and recommendations are intentionally out of scope for Phase 1. The schema already stores prices so listings carry over when selling launches.
