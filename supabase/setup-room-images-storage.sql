-- =============================================
-- SUPABASE STORAGE: ROOM IMAGES BUCKET SETUP
-- =============================================
-- This script creates a storage bucket for room images
-- Run this in your Supabase SQL Editor

-- Create storage bucket for room images
INSERT INTO storage.buckets (id, name, public)
VALUES ('room-images', 'room-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for room-images bucket

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
  (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
);

-- Policy 3: Allow authenticated admin users to update room images
CREATE POLICY "Admins can update room images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'room-images' AND
  (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
);

-- Policy 4: Allow authenticated admin users to delete room images
CREATE POLICY "Admins can delete room images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'room-images' AND
  (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
);

-- Alternative: If admin status is stored in users table instead of JWT
-- You can modify the policies to check the users table:
/*
CREATE POLICY "Admins can upload room images (via users table)"
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
*/

-- Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'room-images';
