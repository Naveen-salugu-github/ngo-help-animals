-- Allow users to remove their own volunteer registration (de-register from event).
create policy volunteers_delete_own on public.volunteers for delete using (auth.uid() = user_id);
