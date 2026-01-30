-- Run this script in the Supabase SQL Editor to fix the "Bucket not found" error.
-- NOTE: We have removed the 'ENABLE ROW LEVEL SECURITY' line to avoid permission errors.
-- It is enabled by default on Supabase Storage.

-- 1. Create the 'avatars' storage bucket if it is missing
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2. Create policies to allow public access and authenticated uploads
-- (We drop existing policies first to ensure a clean update)

drop policy if exists "Public Avatars are viewable by everyone" on storage.objects;
create policy "Public Avatars are viewable by everyone"
on storage.objects for select
using ( bucket_id = 'avatars' );

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
on storage.objects for insert
with check (
  bucket_id = 'avatars' and
  auth.role() = 'authenticated'
);

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
on storage.objects for update
using (
  bucket_id = 'avatars' and
  auth.role() = 'authenticated'
);

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
on storage.objects for delete
using (
  bucket_id = 'avatars' and
  auth.role() = 'authenticated'
);
