-- Stripe Checkout alongside Razorpay
alter table public.donations
  add column if not exists payment_provider text not null default 'razorpay';

alter table public.donations
  add column if not exists stripe_checkout_session_id text;

alter table public.donations
  add column if not exists stripe_payment_intent_id text;

create unique index if not exists donations_stripe_checkout_session_id_key
  on public.donations (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

comment on column public.donations.payment_provider is 'razorpay | stripe';
comment on column public.donations.stripe_checkout_session_id is 'Stripe Checkout Session id (cs_...)';
comment on column public.donations.stripe_payment_intent_id is 'Stripe PaymentIntent id after successful payment';
