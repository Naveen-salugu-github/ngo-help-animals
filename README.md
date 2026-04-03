# ImpactBridge

Social impact marketplace connecting **NGOs**, **donors**, **volunteers**, and **brands**. Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, and **Supabase** (Postgres, Auth, Storage). Payments via **Razorpay**; AI helpers via **Groq**.

## Quick start

```bash
npm install
cp .env.example .env.local
# Fill Supabase, Razorpay, and optional Groq keys
npm run dev
```

Apply the database migration in `supabase/migrations/20260403000000_impactbridge.sql` using the Supabase SQL editor (or CLI), then optionally run `supabase/seed.sql` after creating demo auth users (see comments in the seed file).

## Docs

- **[DEPLOY.md](./DEPLOY.md)** — Vercel deployment, env vars, API notes for mobile clients.

## API (mobile-ready)

JSON routes under `/api/v1/*` accept `Authorization: Bearer <supabase_access_token>` for authenticated operations.

## Roles

| Role   | Area |
|--------|------|
| Donor  | Donate, volunteer RSVP, impact feed |
| NGO    | Organization profile, projects, field updates (moderated) |
| Brand  | Sponsorships, CSR analytics, AI CSR narrative |
| Admin  | NGO verification, impact moderation, platform stats |

Promote an admin in SQL: `update public.users set role = 'admin' where email = '…';`
