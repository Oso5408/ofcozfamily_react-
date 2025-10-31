-- Add RLS policy to allow admins to update room visibility
-- This is needed for the room visibility toggle feature in admin panel

-- Check existing policies first
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'rooms'
ORDER BY policyname;

-- Drop the old policy if it exists (it might be too restrictive)
DROP POLICY IF EXISTS "Authenticated users can manage rooms" ON public.rooms;

-- Create new admin-only update policy
CREATE POLICY "Admins can update rooms"
ON public.rooms

FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_admin = true
  )
);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'rooms'
ORDER BY policyname;
