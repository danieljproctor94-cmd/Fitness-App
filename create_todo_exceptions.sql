-- Create todo_exceptions table to track deleted recurring instances
CREATE TABLE IF NOT EXISTS public.todo_exceptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  todo_id UUID REFERENCES public.todos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  exception_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(todo_id, exception_date)
);

-- Enable RLS
ALTER TABLE public.todo_exceptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own exceptions"
  ON public.todo_exceptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exceptions"
  ON public.todo_exceptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exceptions"
  ON public.todo_exceptions FOR DELETE
  USING (auth.uid() = user_id);
