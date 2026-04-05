-- Restrict project-media uploads to each user's impact-updates folder (path used by the app).
drop policy if exists "Authenticated upload project media" on storage.objects;

create policy "impact_media_upload_own_folder"
on storage.objects for insert
with check (
  bucket_id = 'project-media'
  and auth.role() = 'authenticated'
  and name like 'impact-updates/' || auth.uid()::text || '/%'
);
