-- Create todo_completions table
CREATE TABLE IF NOT EXISTS public.todo_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  todo_id UUID REFERENCES public.todos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  completed_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(todo_id, completed_date)
);

-- Enable RLS
ALTER TABLE public.todo_completions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own completions"
  ON public.todo_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completions"
  ON public.todo_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completions"
  ON public.todo_completions FOR DELETE
  USING (auth.uid() = user_id);
