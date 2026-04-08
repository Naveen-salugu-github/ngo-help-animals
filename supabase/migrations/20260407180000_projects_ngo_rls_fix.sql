-- Project INSERT checks NGO ownership via EXISTS on public.ngos; that subquery uses RLS on ngos.
-- If ngos rows are not visible to the caller, the check fails with RLS on projects.
-- SECURITY DEFINER reads ngos without RLS; ownership still uses auth.uid().

create or replace function public.projects_ngo_owned_by_caller(p_ngo_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $fn$
  select exists (
    select 1 from public.ngos n
    where n.id = p_ngo_id and n.user_id = auth.uid()
  );
$fn$;

revoke all on function public.projects_ngo_owned_by_caller(uuid) from public;
grant execute on function public.projects_ngo_owned_by_caller(uuid) to authenticated;

drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects for insert
  with check (public.projects_ngo_owned_by_caller(ngo_id));

drop policy if exists projects_update_own on public.projects;
create policy projects_update_own on public.projects for update
  using (public.projects_ngo_owned_by_caller(ngo_id));
