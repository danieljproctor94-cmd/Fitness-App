-- Reset RLS for profiles table
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Everyone can view everyone (simplest for directory features)
-- OR restrict to authenticated if you prefer
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- 2. Users can insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 3. Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 4. Admins can update everyone (optional, for managing users)
CREATE POLICY "Admins can update any profile" 
ON public.profiles FOR UPDATE 
USING (
  (SELECT subscription_tier FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- 5. Admins can delete users
CREATE POLICY "Admins can delete any profile" 
ON public.profiles FOR DELETE 
USING (
  (SELECT subscription_tier FROM profiles WHERE id = auth.uid()) = 'admin'
);
