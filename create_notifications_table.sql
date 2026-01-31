-- Create Notifications Table
create table if not exists public.notifications (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    message text not null,
    type text default 'info',
    read boolean default false,
    link text
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Policies
-- 1. Users can view their own notifications
create policy "Users can view their own notifications"
on public.notifications for select
using (auth.uid() = user_id);

-- 2. Users can update their own notifications (mark as read)
create policy "Users can update their own notifications"
on public.notifications for update
using (auth.uid() = user_id);

-- 3. Admins can insert notifications for anyone
create policy "Admins can insert notifications"
on public.notifications for insert
with check (
    exists (
        select 1 from public.profiles
        where id = auth.uid()
        and subscription_tier = 'admin'
    )
);
