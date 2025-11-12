-- Add UPDATE policy for package_history table
-- This allows admins to edit expiry dates and other package history fields

-- First, ensure the expiry_date column exists (from previous migration)
ALTER TABLE public.package_history
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE;

-- Drop existing UPDATE policy if it exists
DROP POLICY IF EXISTS "Admins can update package history" ON public.package_history;

-- Create UPDATE policy for admins
CREATE POLICY "Admins can update package history"
  ON public.package_history
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
WHERE tablename = 'package_history';
