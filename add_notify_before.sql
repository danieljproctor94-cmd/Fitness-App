
-- Add notify_before column to todos if it doesn't exist
alter table public.todos 
add column if not exists notify_before text check (notify_before in ('10_min', '1_hour', '1_day'));
