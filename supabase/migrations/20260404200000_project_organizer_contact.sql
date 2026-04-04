-- Campaign-level contact shown to supporters (contact organizer, event registration context).
alter table public.projects
  add column if not exists organizer_contact_phone text,
  add column if not exists organizer_contact_email text;

comment on column public.projects.organizer_contact_phone is 'Phone for this campaign (shown in Contact organizer).';
comment on column public.projects.organizer_contact_email is 'Email for this campaign; contact-organizer notifications prefer this address when set.';
