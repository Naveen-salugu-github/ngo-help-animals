-- Campaign covers upload to campaign-covers/{auth.uid()}/... (see campaign-cover-image.ts).
-- Previous policy only allowed impact-updates/{auth.uid()}/..., so cover uploads failed with RLS.

drop policy if exists "impact_media_upload_own_folder" on storage.objects;

create policy "project_media_upload_own_folders"
on storage.objects for insert
with check (
  bucket_id = 'project-media'
  and auth.role() = 'authenticated'
  and (
    name like 'impact-updates/' || auth.uid()::text || '/%'
    or name like 'campaign-covers/' || auth.uid()::text || '/%'
  )
);
