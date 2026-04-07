-- Historical / showcase campaigns: no volunteering, map pins, or event flows.
alter table public.projects
  add column if not exists is_past_campaign boolean not null default false;

comment on column public.projects.is_past_campaign is 'Past or archival campaign: no volunteer sign-up; not shown on volunteer map.';
