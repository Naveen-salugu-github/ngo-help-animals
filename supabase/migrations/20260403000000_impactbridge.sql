-- Soul Space schema — Postgres + Supabase Auth
-- Run via Supabase CLI: supabase db push, or paste in SQL editor

-- Roles
create type public.user_role as enum ('donor', 'ngo', 'brand', 'admin');
create type public.verification_status as enum ('pending', 'verified', 'rejected');
create type public.project_status as enum ('draft', 'active', 'funded', 'closed');
create type public.payment_status as enum ('pending', 'completed', 'failed', 'refunded');
create type public.volunteer_status as enum ('rsvp', 'confirmed', 'checked_in', 'cancelled');
create type public.media_type as enum ('image', 'video');
create type public.impact_moderation as enum ('pending', 'approved', 'rejected');

-- Profiles (app "users" table; id = auth.users.id)
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null,
  role public.user_role not null default 'donor',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ngos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  organization_name text not null,
  registration_number text,
  "80g_status" text,
  "12a_status" text,
  pan_number text,
  address text,
  verification_status public.verification_status not null default 'pending',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table public.ngo_documents (
  id uuid primary key default gen_random_uuid(),
  ngo_id uuid not null references public.ngos (id) on delete cascade,
  doc_type text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  ngo_id uuid not null references public.ngos (id) on delete cascade,
  title text not null,
  description text not null,
  location text not null,
  latitude double precision,
  longitude double precision,
  goal_amount numeric(14, 2) not null check (goal_amount >= 0),
  funds_raised numeric(14, 2) not null default 0 check (funds_raised >= 0),
  micro_donation_units jsonb not null default '[]'::jsonb,
  timeline_start date,
  timeline_end date,
  status public.project_status not null default 'draft',
  cover_image_url text,
  impact_metrics jsonb not null default '{}'::jsonb,
  volunteer_slots int not null default 0 check (volunteer_slots >= 0),
  volunteer_count int not null default 0 check (volunteer_count >= 0),
  donor_count int not null default 0 check (donor_count >= 0),
  beneficiaries_impacted int not null default 0 check (beneficiaries_impacted >= 0),
  volunteer_category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.impact_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  media_url text not null,
  media_type public.media_type not null default 'image',
  caption text not null default '',
  moderation_status public.impact_moderation not null default 'pending',
  like_count int not null default 0 check (like_count >= 0),
  share_count int not null default 0 check (share_count >= 0),
  created_at timestamptz not null default now()
);

create table public.impact_likes (
  user_id uuid not null references public.users (id) on delete cascade,
  impact_update_id uuid not null references public.impact_updates (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, impact_update_id)
);

create table public.donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  project_id uuid not null references public.projects (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'INR',
  payment_status public.payment_status not null default 'pending',
  razorpay_order_id text,
  razorpay_payment_id text,
  micro_unit_label text,
  receipt_url text,
  created_at timestamptz not null default now()
);

create table public.volunteers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  status public.volunteer_status not null default 'rsvp',
  created_at timestamptz not null default now(),
  unique (user_id, project_id)
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  company_name text not null,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table public.sponsorships (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  amount numeric(14, 2) not null check (amount >= 0),
  campaign_title text,
  created_at timestamptz not null default now(),
  unique (brand_id, project_id)
);

-- Indexes
create index idx_projects_ngo on public.projects (ngo_id);
create index idx_projects_status on public.projects (status);
create index idx_impact_updates_project on public.impact_updates (project_id);
create index idx_impact_updates_moderation on public.impact_updates (moderation_status);
create index idx_donations_project on public.donations (project_id);
create index idx_volunteers_project on public.volunteers (project_id);
create index idx_projects_geo on public.projects (latitude, longitude) where latitude is not null and longitude is not null;

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated before update on public.users
  for each row execute function public.set_updated_at();
create trigger ngos_updated before update on public.ngos
  for each row execute function public.set_updated_at();
create trigger projects_updated before update on public.projects
  for each row execute function public.set_updated_at();
create trigger brands_updated before update on public.brands
  for each row execute function public.set_updated_at();

-- New auth user → profile row
create or replace function public.handle_new_user()
returns trigger as $$
declare
  r public.user_role;
begin
  begin
    r := (new.raw_user_meta_data->>'role')::public.user_role;
  exception when others then
    r := 'donor';
  end;
  insert into public.users (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(r, 'donor')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Like count sync
create or replace function public.sync_impact_like_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.impact_updates set like_count = like_count + 1 where id = new.impact_update_id;
  elsif tg_op = 'DELETE' then
    update public.impact_updates set like_count = greatest(0, like_count - 1) where id = old.impact_update_id;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql security definer set search_path = public;

create trigger impact_like_ins after insert on public.impact_likes
  for each row execute function public.sync_impact_like_count();
create trigger impact_like_del after delete on public.impact_likes
  for each row execute function public.sync_impact_like_count();

-- RLS
alter table public.users enable row level security;
alter table public.ngos enable row level security;
alter table public.ngo_documents enable row level security;
alter table public.projects enable row level security;
alter table public.impact_updates enable row level security;
alter table public.impact_likes enable row level security;
alter table public.donations enable row level security;
alter table public.volunteers enable row level security;
alter table public.brands enable row level security;
alter table public.sponsorships enable row level security;

-- Users: read profiles; update own
create policy users_select on public.users for select using (true);
create policy users_update_own on public.users for update using (auth.uid() = id);

-- NGOs
create policy ngos_select on public.ngos for select using (true);
create policy ngos_insert on public.ngos for insert with check (auth.uid() = user_id);
create policy ngos_update_own on public.ngos for update using (auth.uid() = user_id);

-- NGO documents: NGO owner + admin (admin via service role in API)
create policy ngo_docs_select on public.ngo_documents for select using (
  exists (select 1 from public.ngos n where n.id = ngo_id and n.user_id = auth.uid())
);
create policy ngo_docs_insert on public.ngo_documents for insert with check (
  exists (select 1 from public.ngos n where n.id = ngo_id and n.user_id = auth.uid())
);

-- Projects: public sees active; NGO sees all own
create policy projects_public_select on public.projects for select using (
  status = 'active'
  or exists (select 1 from public.ngos n where n.id = ngo_id and n.user_id = auth.uid())
);
create policy projects_insert on public.projects for insert with check (
  exists (select 1 from public.ngos n where n.id = ngo_id and n.user_id = auth.uid())
);
create policy projects_update_own on public.projects for update using (
  exists (select 1 from public.ngos n where n.id = ngo_id and n.user_id = auth.uid())
);

-- Impact updates: approved public; NGO sees own project updates
create policy impact_select on public.impact_updates for select using (
  moderation_status = 'approved'
  or exists (
    select 1 from public.projects p
    join public.ngos n on n.id = p.ngo_id
    where p.id = project_id and n.user_id = auth.uid()
  )
);
create policy impact_insert on public.impact_updates for insert with check (
  exists (
    select 1 from public.projects p
    join public.ngos n on n.id = p.ngo_id
    where p.id = project_id and n.user_id = auth.uid()
  )
);
create policy impact_update_own on public.impact_updates for update using (
  exists (
    select 1 from public.projects p
    join public.ngos n on n.id = p.ngo_id
    where p.id = project_id and n.user_id = auth.uid()
  )
);

-- Likes
create policy likes_select on public.impact_likes for select using (true);
create policy likes_insert on public.impact_likes for insert with check (auth.uid() = user_id);
create policy likes_delete on public.impact_likes for delete using (auth.uid() = user_id);

-- Donations
create policy donations_select on public.donations for select using (
  user_id = auth.uid()
  or exists (
    select 1 from public.projects p
    join public.ngos n on n.id = p.ngo_id
    where p.id = project_id and n.user_id = auth.uid()
  )
);
create policy donations_insert on public.donations for insert with check (user_id = auth.uid());

-- Volunteers
create policy volunteers_select on public.volunteers for select using (
  user_id = auth.uid()
  or exists (
    select 1 from public.projects p
    join public.ngos n on n.id = p.ngo_id
    where p.id = project_id and n.user_id = auth.uid()
  )
);
create policy volunteers_insert on public.volunteers for insert with check (auth.uid() = user_id);
create policy volunteers_update_own on public.volunteers for update using (auth.uid() = user_id);

-- Brands
create policy brands_select on public.brands for select using (true);
create policy brands_insert on public.brands for insert with check (auth.uid() = user_id);
create policy brands_update_own on public.brands for update using (auth.uid() = user_id);

-- Sponsorships
create policy sponsorships_select on public.sponsorships for select using (true);
create policy sponsorships_insert on public.sponsorships for insert with check (
  exists (select 1 from public.brands b where b.id = brand_id and b.user_id = auth.uid())
);

-- Admin (platform moderation & verification)
create policy users_admin_update on public.users for update using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
);

create policy ngos_admin_update on public.ngos for update using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
);

create policy impact_admin_update on public.impact_updates for update using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
);

create policy projects_admin_update on public.projects for update using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
);

-- Storage buckets (create in dashboard or SQL — policies below assume buckets exist)
insert into storage.buckets (id, name, public)
values
  ('project-media', 'project-media', true),
  ('ngo-docs', 'ngo-docs', false),
  ('brand-assets', 'brand-assets', true)
on conflict (id) do nothing;

create policy "Public read project media"
on storage.objects for select using (bucket_id = 'project-media');

create policy "Authenticated upload project media"
on storage.objects for insert with check (
  bucket_id = 'project-media' and auth.role() = 'authenticated'
);

create policy "NGO docs read own"
on storage.objects for select using (
  bucket_id = 'ngo-docs' and auth.uid() is not null
);

create policy "NGO docs upload own path"
on storage.objects for insert with check (
  bucket_id = 'ngo-docs' and auth.role() = 'authenticated'
);

create policy "Public read brand assets"
on storage.objects for select using (bucket_id = 'brand-assets');

create policy "Brand upload assets"
on storage.objects for insert with check (
  bucket_id = 'brand-assets' and auth.role() = 'authenticated'
);
