-- Drop existing policy if it exists to avoid conflicts (optional, but safer to assume we want to enable full access)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create the policy
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  (SELECT subscription_tier FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
