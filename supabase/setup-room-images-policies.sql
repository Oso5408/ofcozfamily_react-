-- =============================================
-- ROOM IMAGES STORAGE: RLS POLICIES
-- =============================================
-- This script sets up RLS policies for the room-images bucket
-- Uses the users.is_admin field to verify admin status

-- Drop existing policies if they exist (to allow re-running)
DROP POLICY IF EXISTS "Public can view room images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload room images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update room images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete room images" ON storage.objects;

-- Policy 1: Allow public to view/download room images
CREATE POLICY "Public can view room images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'room-images');

-- Policy 2: Allow authenticated admin users to upload room images
CREATE POLICY "Admins can upload room images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'room-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND is_admin = true
  )
);

-- Policy 3: Allow authenticated admin users to update room images
CREATE POLICY "Admins can update room images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'room-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND is_admin = true
  )
);

-- Policy 4: Allow authenticated admin users to delete room images
CREATE POLICY "Admins can delete room images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'room-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND is_admin = true
  )
);

-- Verify policies were created
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND policyname LIKE '%room images%';
