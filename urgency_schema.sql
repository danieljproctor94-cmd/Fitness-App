-- Add urgency column to todos
alter table public.todos 
add column if not exists urgency text default 'medium';
