-- Add email and last_sign_in_at to profiles if not exists
alter table public.profiles 
add column if not exists email text,
add column if not exists last_sign_in_at timestamp with time zone;

-- Function to handle new user creation sync
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email, last_sign_in_at, subscription_tier)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    new.last_sign_in_at,
    'free_user' -- Default tier
  )
  on conflict (id) do update set
    email = excluded.email,
    last_sign_in_at = excluded.last_sign_in_at;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new users (ensure it exists and replaces old one if needed)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to handle login sync (last_sign_in_at)
create or replace function public.handle_user_login()
returns trigger as $$
begin
  update public.profiles
  set last_sign_in_at = new.last_sign_in_at,
      email = new.email -- Sync email in case it changes
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for login updates
drop trigger if exists on_auth_user_login on auth.users;
create trigger on_auth_user_login
  after update of last_sign_in_at on auth.users
  for each row execute procedure public.handle_user_login();

---------------------------------------------------------
-- FIX: Secure Function to check Admin status (Avoids RLS recursion)
---------------------------------------------------------
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and subscription_tier = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Admin Policies (Using is_admin() to prevent infinite recursion)

-- 1. Drop old policies to ensure clean state
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;
drop policy if exists "Admins can delete profiles" on public.profiles;

-- 2. Create new policies
create policy "Admins can view all profiles"
  on public.profiles for select
  using ( public.is_admin() );

create policy "Admins can update all profiles"
  on public.profiles for update
  using ( public.is_admin() );
  
create policy "Admins can delete profiles"
  on public.profiles for delete
  using ( public.is_admin() );
