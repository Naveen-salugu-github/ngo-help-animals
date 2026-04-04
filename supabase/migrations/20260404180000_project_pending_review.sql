-- Campaigns: NGOs submit as pending_review; admin sets active (or back to draft).

do $migration$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on e.enumtypid = t.oid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'project_status'
      and e.enumlabel = 'pending_review'
  ) then
    alter type public.project_status add value 'pending_review';
  end if;
end
$migration$;
