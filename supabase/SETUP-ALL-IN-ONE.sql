-- =============================================
-- ALL-IN-ONE SETUP FOR MULTI-IMAGE FEATURE
-- =============================================
-- This script combines all necessary setup steps
-- Run this ONCE in your Supabase SQL Editor
--
-- Steps included:
-- 1. Create storage bucket
-- 2. Add images column to rooms table
-- 3. Migrate existing images
-- 4. Create sync trigger
-- 5. Set up RLS policies
-- =============================================

-- =============================================
-- STEP 1: CREATE STORAGE BUCKET
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('room-images', 'room-images', true)
ON CONFLICT (id) DO NOTHING;

-- Verify bucket created
SELECT '✅ Storage bucket created' AS status, * FROM storage.buckets WHERE id = 'room-images';

-- =============================================
-- STEP 2: ADD IMAGES COLUMN
-- =============================================
ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Verify column created
SELECT '✅ Images column added' AS status, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'rooms' AND column_name = 'images';

-- =============================================
-- STEP 3: MIGRATE EXISTING IMAGES
-- =============================================
UPDATE public.rooms
SET images = CASE
  WHEN image_url IS NOT NULL AND image_url != '' THEN
    jsonb_build_array(
      jsonb_build_object(
        'url', image_url,
        'visible', true,
        'order', 1
      )
    )
  ELSE '[]'::jsonb
END
WHERE images = '[]'::jsonb;

-- Show migrated rooms
SELECT '✅ Existing images migrated' AS status, id, name,
       CASE
         WHEN images = '[]'::jsonb THEN 'No images'
         ELSE jsonb_array_length(images)::text || ' image(s)'
       END AS image_count
FROM public.rooms;

-- =============================================
-- STEP 4: CREATE SYNC TRIGGER
-- =============================================

-- Create function to sync image_url with first visible image
CREATE OR REPLACE FUNCTION sync_room_image_url()
RETURNS TRIGGER AS $$
BEGIN
  -- Set image_url to the first visible image's URL
  NEW.image_url := (
    SELECT (elem->>'url')
    FROM jsonb_array_elements(NEW.images) AS elem
    WHERE (elem->>'visible')::boolean = true
    ORDER BY (elem->>'order')::int
    LIMIT 1
  );

  -- If no visible images, set to NULL
  IF NEW.image_url IS NULL OR NEW.image_url = '' THEN
    NEW.image_url := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS sync_room_image_url_trigger ON public.rooms;
CREATE TRIGGER sync_room_image_url_trigger
  BEFORE INSERT OR UPDATE OF images ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION sync_room_image_url();

-- Verify trigger created
SELECT '✅ Trigger created' AS status, trigger_name, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'rooms'
AND trigger_name = 'sync_room_image_url_trigger';

-- =============================================
-- STEP 5: SET UP RLS POLICIES
-- =============================================

-- Drop existing policies if they exist
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

-- Verify policies created
SELECT '✅ RLS policies created' AS status, policyname, cmd
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND policyname LIKE '%room images%';

-- =============================================
-- FINAL VERIFICATION
-- =============================================

SELECT '🎉 SETUP COMPLETE!' AS status;

SELECT '
=============================================
✅ Multi-Image Feature Setup Complete!
=============================================

Next steps:
1. Log in to your app as an admin user
2. Go to Admin Panel → Rooms tab
3. Click "Edit Room" on any room
4. Upload 1-3 images
5. Test visibility toggle and reorder
6. View the room on the Rooms page

Troubleshooting:
- If upload fails, verify your user has is_admin = true
- Check browser console for errors
- View storage policies above

For detailed documentation, see:
- SETUP-MULTI-IMAGE-FEATURE.md
- MULTI-IMAGE-IMPLEMENTATION.md
=============================================
' AS instructions;

-- Show current room image status
SELECT
  id,
  name,
  CASE
    WHEN images = '[]'::jsonb THEN 'No images'
    ELSE jsonb_array_length(images)::text || ' image(s)'
  END AS image_count,
  CASE
    WHEN image_url IS NOT NULL THEN 'Has image_url'
    ELSE 'No image_url'
  END AS legacy_status
FROM public.rooms
ORDER BY id;
