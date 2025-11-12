-- =============================================
-- Add DELETE Policy for Users Table
-- =============================================
-- This allows admins to delete user accounts
-- =============================================

-- Step 1: Check existing policies
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

-- Step 2: Drop existing DELETE policy if it exists
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

-- Step 3: Create DELETE policy for admins
CREATE POLICY "Admins can delete users"
  ON public.users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Step 4: Verify the policy was created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'DELETE';

-- Step 5: Test - Show how many users an admin can delete
-- (Should show all users except maybe themselves)
SELECT
  COUNT(*) as deletable_users_count,
  (SELECT email FROM public.users WHERE id = auth.uid()) as admin_email
FROM public.users
WHERE EXISTS (
  SELECT 1 FROM public.users
  WHERE id = auth.uid() AND is_admin = TRUE
);
