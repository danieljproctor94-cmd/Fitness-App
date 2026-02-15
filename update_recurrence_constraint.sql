-- Drop the existing constraint
ALTER TABLE public.todos DROP CONSTRAINT IF EXISTS todos_recurrence_check;

-- Add the new constraint including 'yearly'
ALTER TABLE public.todos ADD CONSTRAINT todos_recurrence_check 
CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly', 'yearly'));
