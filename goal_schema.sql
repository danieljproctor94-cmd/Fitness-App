-- Add weekly_workout_goal to profiles if not exists
alter table public.profiles 
add column if not exists weekly_workout_goal integer default 4;
