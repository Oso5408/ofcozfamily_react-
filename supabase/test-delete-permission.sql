-- =============================================
-- Test DELETE Permission
-- =============================================
-- This script tests if the admin can delete users
-- =============================================

-- Step 1: Check who you are logged in as
SELECT
  id,
  email,
  is_admin,
  'You are logged in as this user' as note
FROM public.users
WHERE id = auth.uid();

-- Step 2: Check if the DELETE policy exists
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'DELETE';

-- Step 3: Test if you can see users (should work)
SELECT
  id,
  email,
  full_name,
  is_admin,
  created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- Step 4: Try to delete a specific user (REPLACE THIS ID WITH A TEST USER!)
-- ⚠️ DANGER: This will actually delete the user!
-- Uncomment and replace 'test-user-id-here' with actual test user ID

-- DELETE FROM public.users
-- WHERE id = 'test-user-id-here'
-- RETURNING id, email, 'DELETED' as status;

-- Step 5: Check RLS is enabled on users table
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'users';

-- Step 6: Test the DELETE policy logic directly
-- This simulates what happens when you try to delete
SELECT
  u.id,
  u.email,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.users admin
      WHERE admin.id = auth.uid() AND admin.is_admin = TRUE
    ) THEN 'CAN DELETE'
    ELSE 'CANNOT DELETE'
  END as delete_permission
FROM public.users u
LIMIT 10;
