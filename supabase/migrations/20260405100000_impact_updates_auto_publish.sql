-- Impact posts go live without admin moderation.
update public.impact_updates
set moderation_status = 'approved'
where moderation_status = 'pending';

alter table public.impact_updates
  alter column moderation_status set default 'approved';
