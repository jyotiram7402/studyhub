# StudyHub — Personal Reference Card

A one-page cheat sheet for the whole project: what it's built with, and how it goes live.

---

## 1. Tech stack (what powers each part)

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript | UI + pages |
| Styling | Tailwind CSS + shadcn/ui-style components | in `components/ui` |
| Backend | Next.js API Routes | in `app/api` — same app, no separate server |
| Database | Supabase PostgreSQL (+ pgvector) | tables, RLS security, AI vectors |
| Auth | Supabase Auth | login, signup, sessions |
| File storage | Supabase Storage | note files (private) + thumbnails (public) |
| AI | Google Gemini | `gemini-2.0-flash` (text) + `gemini-embedding-001` (search) |
| Hosting | Vercel | auto-deploys from GitHub |
| Analytics | Vercel Analytics | traffic + web vitals |
| Payments | Sandbox (test mode) | swap to Razorpay/Stripe later |
| Email | Console (placeholder) | swap to Resend later |

**Everything runs inside ONE Next.js app** — frontend and backend are the same project. Supabase and Gemini are external services connected by keys.

---

## 2. Accounts you need (all have free tiers)

| Service | Where | Used for |
|---|---|---|
| GitHub | github.com | stores the code |
| Vercel | vercel.com | hosts/runs the site |
| Supabase | supabase.com | database, auth, storage |
| Google AI Studio | aistudio.google.com/apikey | Gemini API key (AI) |
| Domain (optional) | cloudflare.com / namecheap.com | custom web address |

---

## 3. How it all connects

```
   Code lives in GitHub
          │  (Vercel watches the repo)
          ▼
   Vercel builds & hosts the site  ──────► users open the website
          │
          │  (connected by environment variables)
          ▼
   Supabase (database + auth + files)   Gemini (AI)
```

Push code to GitHub → Vercel automatically rebuilds and redeploys. Vercel talks to Supabase and Gemini using the environment variables below.

---

## 4. Deployment steps (start to end)

1. **GitHub** — create a repo, upload the `studyhub` folder contents (so `package.json` is at the root).
2. **Supabase** — create a project. In SQL Editor, run the 7 files from `supabase/` **in this exact order**:
   1. `schema.sql`
   2. `storage.sql`
   3. `seed.sql`
   4. `migration-phase2.sql`
   5. `migration-phase3.sql`
   6. `migration-phase4.sql`
   7. `migration-phase5.sql`
3. **Gemini** — create an API key at aistudio.google.com/apikey.
4. **Vercel** — import the GitHub repo, add the environment variables (section 5), click Deploy.
5. **Supabase auth** — Authentication → URL Configuration:
   - Site URL = your Vercel URL
   - Redirect URLs = add `https://YOUR-URL/auth/callback`
6. **Make yourself admin** — Supabase SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where username = 'YOUR_USERNAME';
   ```
7. **Test** — sign up, upload a note, buy it from a 2nd account with test card `4242 4242 4242 4242`.

Any code change = commit on GitHub = Vercel redeploys automatically.

---

## 5. Environment variables (set in Vercel → Settings)

| Name | Value / where to find |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public key |
| `NEXT_PUBLIC_SITE_URL` | your live Vercel URL |
| `PAYMENT_PROVIDER` | `sandbox` |
| `EMAIL_PROVIDER` | `console` |
| `GEMINI_API_KEY` | from Google AI Studio |

Note: after changing any env var, you must **redeploy** for it to take effect.

---

## 6. Rough running cost

- **Launch / testing:** ~$0–1/month (free tiers; only a domain if you want one ~$12/yr).
- **Real commercial site:** ~$45–65/month (Vercel Pro $20 + Supabase Pro $25 + AI ~$5–15).
- **Payments:** ~2–3% per sale, no fixed fee.
- Turn on Gemini billing (with a $10 budget cap) only if free-tier rate limits get annoying.

---

## 7. Gotchas to remember

- **Supabase free pauses after 7 days idle** — go Supabase Pro for an always-on site.
- **Vercel free is non-commercial** — Pro plan once it's a real business.
- **Gemini free tier is rate-limited (~15/min)** — test one AI action at a time, or enable billing.
- Env var changes need a **redeploy**.

---

## 8. Where things live in the code

```
app/            pages + API routes
  (auth)/       login, register, password
  (main)/       public site, dashboard, admin, checkout
  api/          backend endpoints
components/     UI building blocks
lib/            core logic (supabase, ai, payments, queries, validations)
supabase/       the 7 SQL files
docs/           deployment guide + this reference
```
