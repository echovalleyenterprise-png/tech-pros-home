# Vercel Environment Variables — Tech Pros Home

Set these in Vercel → your project → Settings → Environment Variables.
All should be set for **Production**, **Preview**, and **Development**.

---

## Required Variables

| Variable | Where to get it | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Starts with `https://` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | Public anon/browser key |
| `SUPABASE_SERVICE_KEY` | Supabase → Project Settings → API → service_role | Keep secret — server only |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys | Same key as Tech Pros |
| `NEXT_PUBLIC_BASE_URL` | Your Vercel URL | e.g. `https://tech-pros-home.vercel.app` (no trailing slash) |

---

## Steps

1. Go to https://vercel.com → open **tech-pros-home** project
2. Click **Settings** → **Environment Variables**
3. Add each variable above
4. Click **Deployments** → find the latest deployment → **Redeploy** (to pick up new env vars)

---

## Supabase Setup

After setting env vars, you also need to:

1. **Run the migration** — go to Supabase → SQL Editor → paste contents of `supabase/migrations/001_initial.sql` → Run
2. **Set Site URL** — Supabase → Authentication → URL Configuration:
   - Site URL: `https://tech-pros-home.vercel.app`
   - Redirect URLs: `https://tech-pros-home.vercel.app/auth/callback`
3. **Enable email confirmations** — Supabase → Authentication → Providers → Email → toggle on "Confirm email"

---

## Test checklist after deploying

- [ ] Visit `/signup` — create a homeowner account
- [ ] Check email, click verification link
- [ ] Should land on `/home` — dashboard loads, shows question count
- [ ] Click "Ask your tech question" — chat works, AI responds
- [ ] Visit `/signup` → choose Partner → create partner account
- [ ] Verify partner lands on `/partner` dashboard
- [ ] Copy affiliate link → open in incognito → sign up → check referral appears in partner dashboard
- [ ] Submit a callback request from homeowner account → check it appears on partner dashboard
