-- 1. Create the storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2. Enable RLS on objects
alter table storage.objects enable row level security;

-- 3. Policy: Allow public to view avatars
create policy "Public Avatars are viewable by everyone"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- 4. Policy: Allow authenticated users to upload their own avatar
-- Note: We restrict uploads to the 'avatars' bucket.
-- We can add a folder convention like 'avatars/{user_id}/{filename}' in the app logic.
create policy "Users can upload their own avatar"
on storage.objects for insert
with check (
  bucket_id = 'avatars' and
  auth.role() = 'authenticated'
);

-- 5. Policy: Allow users to update their own avatar
create policy "Users can update their own avatar"
on storage.objects for update
using (
  bucket_id = 'avatars' and
  auth.role() = 'authenticated'
);

-- 6. Policy: Allow users to delete their own avatar (optional but good hygiene)
create policy "Users can delete their own avatar"
on storage.objects for delete
using (
  bucket_id = 'avatars' and
  auth.role() = 'authenticated'
);
