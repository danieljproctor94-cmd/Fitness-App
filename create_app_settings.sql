-- Create a table for global app settings key-value pairs
create table if not exists public.app_settings (
    key text primary key,
    value text,
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.app_settings enable row level security;

-- Policies

-- 1. Everyone can read settings (Public)
create policy "Everyone can read app settings"
on public.app_settings for select
using (true);

-- 2. Only Admins can insert/update/delete
create policy "Admins can manage app settings"
on public.app_settings for all
using (
    exists (
        select 1 from public.profiles
        where id = auth.uid()
        and subscription_tier = 'admin'
    )
);

-- Insert default logo if not exists
insert into public.app_settings (key, value)
values ('app_logo', '/logo.png')
on conflict (key) do nothing;
