-- Per-campaign: when false, NGOs skip funding fields; public UI hides donate and funding progress.
alter table public.projects
  add column if not exists funding_needed boolean not null default true;

comment on column public.projects.funding_needed is 'When false, campaign does not collect online donations (goal may be 0).';
