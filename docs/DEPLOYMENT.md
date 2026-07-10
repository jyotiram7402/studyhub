# Deployment guide

StudyHub deploys from GitHub to Vercel with Supabase as the backend. No local
tooling is required — Vercel installs dependencies and builds on every push.

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com) (free tier).
2. In **SQL Editor**, run the files from `supabase/` in order:
   `schema.sql` → `storage.sql` → `seed.sql` → `migration-phase2.sql` →
   `migration-phase3.sql` → `migration-phase4.sql` → `migration-phase5.sql`.
3. In **Authentication → URL Configuration**, set the Site URL to the production
   domain and add `https://<domain>/auth/callback` to the redirect allow list.

## 2. Environment variables (Vercel → Project → Settings)

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon/public key |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical production URL |
| `PAYMENT_PROVIDER` | No | `sandbox` (default) |
| `EMAIL_PROVIDER` | No | `console` (default) |
| `GEMINI_API_KEY` | No | Enables all AI features |

The app validates these at boot (`lib/env.ts`) and fails fast with a readable
error if anything is missing or malformed.

## 3. Deploy

1. Push the repository to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new); the framework is
   auto-detected. Deploy.
3. Update the Supabase auth URLs with the final domain if it changed.

## 4. Post-deploy checklist

- [ ] Register an account, confirm the email flow works
- [ ] Promote your account to admin:
      `update public.profiles set role = 'admin' where username = '...';`
- [ ] Upload a test PDF and confirm AI indexing completes (uploads page badge)
- [ ] Buy the test upload from a second account with card `4242 4242 4242 4242`
- [ ] Confirm the download works for the buyer and is blocked for others
- [ ] Check `/admin/system` for storage and AI pipeline health
- [ ] Verify `/sitemap.xml`, `/robots.txt`, and the PWA install prompt
- [ ] Enable Vercel Analytics in the Vercel dashboard (free)

## 5. Backups and maintenance

- **Database** — Supabase free tier keeps daily automatic backups with 7-day
  retention. Take a manual dump (Database → Backups, or `pg_dump` via the
  connection string) before every migration.
- **Storage** — files are only removed through the app. Run **Clean orphaned
  files** from `/admin/system` monthly to drop objects whose listings were
  deleted, and **Cancel stale orders** to clear abandoned checkouts.
- **Monitoring** — `/admin/system` tracks storage against the 1 GB free tier;
  Vercel Analytics tracks traffic and Web Vitals.

## 6. Scaling within free tiers

| Limit | Free tier | Mitigation |
| --- | --- | --- |
| Supabase DB 500 MB | Rows are small; chunks dominate | Cap of 60 chunks per document is enforced |
| Supabase storage 1 GB | 50 MB max upload | Monitor in `/admin/system`, clean orphans |
| Vercel function 60 s | AI processing | `maxDuration = 60` on AI routes; failures mark `ai_status = failed` and can be retried |
| Gemini free quota | Rate-limited per key | AI degrades gracefully; search falls back to full-text |
