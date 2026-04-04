# Deploying ImpactBridge

ImpactBridge is a **Next.js 14** app on the App Router, backed by **Supabase** (Postgres, Auth, Storage) and ready for **Vercel**.

## 1. Supabase

1. Create a project at [https://supabase.com](https://supabase.com).
2. Open **SQL Editor** and run migrations in order:
   - `supabase/migrations/20260403000000_impactbridge.sql`
   - `supabase/migrations/20260403120000_volunteer_event_enhancements.sql` (event times + volunteer phone/email)
   - `supabase/migrations/20260403150000_admin_delete_projects.sql` (admin list/delete campaigns)
3. If bucket creation fails in SQL (permissions), create buckets manually in **Storage**:
   - `project-media` — public read, authenticated upload.
   - `ngo-docs` — private, authenticated read/write for verification PDFs.
   - `brand-assets` — public read, authenticated upload for logos.
4. **Authentication → URL configuration** (required so email confirmation does not send users to localhost):
   - **Site URL:** your production app root, e.g. `https://your-app.vercel.app` (or your custom domain).
   - **Redirect URLs:** add both:
     - `https://your-app.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback` (local dev)
   Sign-up uses `emailRedirectTo` → `/auth/callback`; Supabase must allow that exact URL.
5. Set **`NEXT_PUBLIC_APP_URL`** on Vercel to the same public URL as Site URL (e.g. `https://your-app.vercel.app`). If omitted, the register form falls back to the **current browser origin**, which is correct when users sign up from production.
6. (Optional) Run `supabase/seed.sql` after creating demo users in **Authentication** and assigning roles on `public.users` (see comments at top of seed file).

## 2. Razorpay

1. Create keys in the Razorpay dashboard.
2. Set `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (and duplicate `RAZORPAY_KEY_ID` if you prefer server-only separation).
3. Use test keys in development. Webhook hardening (signature verification on a dedicated webhook route) can be added for production.

## 3. Resend (volunteer confirmation emails)

1. Create an API key at [https://resend.com](https://resend.com).
2. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` on Vercel (use a verified domain in production).

## 4. Groq

1. Create an API key at [https://console.groq.com](https://console.groq.com).
2. Set `GROQ_API_KEY` in Vercel environment variables (server-only).

## 5. Vercel

1. Import the Git repository into Vercel.
2. Framework preset: **Next.js**.
3. Add all variables from `.env.example` in **Project → Settings → Environment Variables**.
4. Deploy. Set `NEXT_PUBLIC_APP_URL` to your production URL (e.g. `https://impactbridge.vercel.app`).

## 6. Mobile / external API clients

Versioned JSON routes live under `/api/v1/*`. Authenticated calls should send:

```http
Authorization: Bearer <supabase_access_token>
```

Examples:

- `GET /api/v1/projects`
- `GET /api/v1/projects/:id`
- `GET /api/v1/feed`
- `POST /api/v1/payments/razorpay/order`
- `POST /api/v1/payments/razorpay/verify`
- `POST /api/v1/volunteers` with body `{ "projectId": "uuid" }`

## 7. Admin user

After your first signup, promote an account in SQL:

```sql
update public.users set role = 'admin' where email = 'you@company.com';
```

## 8. Production checklist

- [ ] RLS policies reviewed for your threat model.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` only on server (Vercel env, never in client).
- [ ] Razorpay webhook + idempotency for payment events (recommended).
- [ ] Rate limiting on public AI routes (recommended).
- [ ] Custom domain and HTTPS enforced on Vercel.
