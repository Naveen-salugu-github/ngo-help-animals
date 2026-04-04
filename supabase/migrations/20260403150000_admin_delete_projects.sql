-- Admins can list every project (including drafts) and delete campaigns.

create policy projects_admin_select on public.projects for select using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
);

create policy projects_admin_delete on public.projects for delete using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
);
