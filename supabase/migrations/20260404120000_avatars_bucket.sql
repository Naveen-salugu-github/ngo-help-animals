-- Public avatars: users upload only under folder named with their auth uid

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar public read"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "Avatar insert own folder"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "Avatar update own folder"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "Avatar delete own folder"
on storage.objects for delete
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);
