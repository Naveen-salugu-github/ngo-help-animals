-- Post-event feedback (donors) + organizer inquiries

create table public.project_feedback (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  rating int check (rating is null or (rating >= 1 and rating <= 5)),
  comment text not null,
  created_at timestamptz not null default now(),
  unique (user_id, project_id)
);

create table public.organizer_inquiries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  from_user_id uuid not null references public.users (id) on delete cascade,
  from_email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index idx_project_feedback_project on public.project_feedback (project_id);
create index idx_organizer_inquiries_project on public.organizer_inquiries (project_id);

alter table public.project_feedback enable row level security;
alter table public.organizer_inquiries enable row level security;

-- Feedback: users insert/read own; NGO reads feedback on their projects
create policy project_feedback_select_own on public.project_feedback for select using (auth.uid() = user_id);

create policy project_feedback_select_ngo on public.project_feedback for select using (
  exists (
    select 1 from public.projects p
    join public.ngos n on n.id = p.ngo_id
    where p.id = project_id and n.user_id = auth.uid()
  )
);

create policy project_feedback_insert on public.project_feedback for insert with check (auth.uid() = user_id);

create policy project_feedback_update_own on public.project_feedback for update using (auth.uid() = user_id);

-- Inquiries: insert as self; NGO reads for their projects
create policy organizer_inquiries_insert on public.organizer_inquiries for insert with check (auth.uid() = from_user_id);

create policy organizer_inquiries_select_ngo on public.organizer_inquiries for select using (
  exists (
    select 1 from public.projects p
    join public.ngos n on n.id = p.ngo_id
    where p.id = project_id and n.user_id = auth.uid()
  )
);

create policy organizer_inquiries_select_own on public.organizer_inquiries for select using (auth.uid() = from_user_id);
