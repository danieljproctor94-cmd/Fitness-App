-- Add notify_before column to todos
alter table public.todos 
add column if not exists notify_before text;
