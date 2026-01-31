-- Migration to make due_date optional for Undated tasks
ALTER TABLE public.todos ALTER COLUMN due_date DROP NOT NULL;
