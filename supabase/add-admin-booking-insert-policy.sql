-- Add RLS policy to allow admins to CREATE bookings for any user
-- This is needed for the admin booking creation feature

-- First, drop the existing restrictive policy if it exists
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;

-- Create a new policy that allows users to create their own bookings
CREATE POLICY "Users can create their own bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add new policy to allow admins to create bookings for ANY user
CREATE POLICY "Admins can create bookings for any user"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_admin = true
  )
);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'bookings'
AND cmd = 'INSERT'
ORDER BY policyname;
