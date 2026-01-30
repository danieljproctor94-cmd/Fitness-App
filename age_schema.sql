-- Add age column to profiles
alter table public.profiles 
add column if not exists age integer;
