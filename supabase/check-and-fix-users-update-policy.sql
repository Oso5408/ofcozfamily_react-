-- =============================================
-- Check and Fix Users Table UPDATE Policy
-- =============================================
-- This script checks if the UPDATE policy exists
-- and creates it if missing
-- =============================================

-- Step 1: Check existing policies on users table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- Step 2: Drop and recreate the admin UPDATE policy
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

CREATE POLICY "Admins can update all users"
  ON public.users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Step 3: Also ensure users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 4: Verify all policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- Step 5: Test query to check if admin can update
-- (This will show the number of users an admin can potentially update)
SELECT COUNT(*) as updatable_users_count
FROM public.users
WHERE EXISTS (
  SELECT 1 FROM public.users
  WHERE id = auth.uid() AND is_admin = TRUE
);
