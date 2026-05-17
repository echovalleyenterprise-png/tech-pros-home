# Tech Pros Home — Project Context

## What Is This

**Tech Pros Home** is the standalone consumer product in the Tech Pros family.

It serves two audiences:
1. **Homeowners** — post-install support, DIY help, any home tech question
2. **DIY older adults** — patient, plain-English, voice-first help for people who want to figure things out themselves

It is a **separate product** from Tech Pros Pro (the technician field tool at tech-pros.vercel.app).

## Brand Architecture

```
Tech Pros (master brand)
├── Tech Pros Pro      → technician field tool (tech-pros.vercel.app)
├── Tech Pros Home     → homeowner app (this repo)
└── Tech Pros Partner  → installer dashboard + affiliate program
```

## Revenue Model

| Audience      | Product          | Price         |
|---------------|------------------|---------------|
| Homeowners    | Free tier        | $0 (5 q/mo)  |
| Homeowners    | Home plan        | $9.99/mo      |
| Homeowners    | Family plan      | $14.99/mo     |
| Installers    | Partner program  | Free to join  |
| Installer     | Referral income  | $4/mo per user|

## Tech Stack

| Layer      | Choice               | Notes                              |
|------------|----------------------|------------------------------------|
| Framework  | Next.js 14 (App Router) | Same as Tech Pros Pro            |
| Styling    | Tailwind CSS         | Mobile-first always                |
| AI         | Anthropic API        | claude-sonnet-4-6                  |
| Auth       | Supabase Auth        | Separate Supabase project          |
| Payments   | Stripe               | Subscription billing               |
| Hosting    | Vercel               | Auto-deploy from main              |

## What Needs to Be Built (in order)

1. ✅ Landing page
2. Signup flow (homeowner path + partner/installer path)
3. Affiliate link tracking system
4. Customer chat (port from Tech Pros Pro customer portal)
5. Partner dashboard (referrals, earnings, callback tickets)
6. Stripe subscription billing
7. Job context — tech logs install details, loads into customer account
8. Callback request flow

## Conventions

- TypeScript everywhere
- App Router only (no Pages Router)
- Tailwind only (no CSS files)
- Supabase queries through /app/lib/supabase.ts only
- System prompts in /app/lib/prompts.ts
