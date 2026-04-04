-- Event scheduling + volunteer contact details for confirmations

alter table public.projects
  add column if not exists event_start_at timestamptz,
  add column if not exists event_end_at timestamptz,
  add column if not exists event_venue_detail text;

comment on column public.projects.event_venue_detail is 'Optional extra venue line (building, landmark); location still used for city/area.';

alter table public.volunteers
  add column if not exists phone text,
  add column if not exists contact_email text;

comment on column public.volunteers.contact_email is 'Email for registration confirmations (may match auth email).';
