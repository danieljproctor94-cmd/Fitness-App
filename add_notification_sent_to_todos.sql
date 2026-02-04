
-- Add notification_sent column to todos to prevent duplicate alerts
alter table public.todos 
add column if not exists notification_sent boolean default false;
