-- =============================================
-- Add Admin UPDATE Policy for Users Table
-- =============================================
-- This allows admins to update ANY user's data
-- including BR balances, tokens, etc.
-- =============================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

-- Create policy for admins to update any user
CREATE POLICY "Admins can update all users"
  ON public.users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Verify the policy was created
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
  AND policyname = 'Admins can update all users';
