-- Create notifications table
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  message text not null,
  read boolean default false,
  type text check (type in ('info', 'success', 'warning', 'error')) default 'info',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Policies
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications (mark as read)"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Admins can insert notifications for anyone (requires admin check or service role,
-- strictly speaking RLS applies to the user performing the query.
-- If the dashboard uses the admin's auth, we need a policy allowing insert)

-- Allow authenticated users to insert (e.g. system events triggered by user actions)
-- OR if only admin broadcasting, restrict this.
-- For now, let's allow inserts if the user is authenticated, to be safe for "system" triggers from client.
create policy "Users can insert notifications"
  on public.notifications for insert
  with check (auth.role() = 'authenticated');
