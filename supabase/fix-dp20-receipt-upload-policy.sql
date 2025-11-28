-- =============================================
-- Fix DP20 Receipt Upload Policy
-- =============================================
-- Allows users to upload receipts for DP20 package purchases
-- without requiring a booking ID
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload DP20 receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view DP20 receipts" ON storage.objects;

-- Policy: Users can upload DP20 receipts (folder starts with "dp20_")
CREATE POLICY "Users can upload DP20 receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'booking-receipts'
  AND (
    -- Allow if folder name starts with "dp20_"
    (storage.foldername(name))[1] LIKE 'dp20_%'
    OR
    -- Allow existing booking receipt uploads
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.bookings WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Users can view their DP20 receipts
CREATE POLICY "Users can view DP20 receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'booking-receipts'
  AND (
    -- Allow if folder name starts with "dp20_"
    (storage.foldername(name))[1] LIKE 'dp20_%'
    OR
    -- Allow viewing own booking receipts
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.bookings WHERE user_id = auth.uid()
    )
  )
);

-- Drop and recreate the existing upload policy to merge with new one
DROP POLICY IF EXISTS "Users can upload their booking receipts" ON storage.objects;

CREATE POLICY "Users can upload their booking receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'booking-receipts'
  AND (
    -- Allow DP20 package receipts
    (storage.foldername(name))[1] LIKE 'dp20_%'
    OR
    -- Allow booking receipts
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.bookings WHERE user_id = auth.uid()
    )
  )
);

-- Drop and recreate the view policy
DROP POLICY IF EXISTS "Users can view their own receipts" ON storage.objects;

CREATE POLICY "Users can view their own receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'booking-receipts'
  AND (
    -- Allow DP20 receipts
    (storage.foldername(name))[1] LIKE 'dp20_%'
    OR
    -- Allow own booking receipts
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.bookings WHERE user_id = auth.uid()
    )
  )
);

-- Verification
SELECT
  '✅ Storage policies updated' AS status,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage';

SELECT '🎉 DP20 receipt upload enabled!' AS status;
