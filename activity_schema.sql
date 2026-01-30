-- Add activity_level column
alter table public.profiles 
add column if not exists activity_level text default 'sedentary';
