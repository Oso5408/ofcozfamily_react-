-- =============================================
-- Add Receipt Upload Functionality
-- =============================================
-- This script adds receipt upload fields and storage setup
-- =============================================

-- Step 1: Add receipt columns to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS receipt_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Step 2: Create storage bucket for receipts (run in Supabase Dashboard > Storage)
-- Bucket name: booking-receipts
-- Public: false (only authenticated users with proper RLS can access)
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, application/pdf

-- To create the bucket, run this in the Supabase SQL Editor:
INSERT INTO storage.buckets (id, name, public)
VALUES ('booking-receipts', 'booking-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Set up RLS policies for storage bucket
-- Policy 1: Users can upload receipts for their own bookings
CREATE POLICY "Users can upload their booking receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'booking-receipts'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.bookings WHERE user_id = auth.uid()
  )
);

-- Policy 2: Users can view their own receipts
CREATE POLICY "Users can view their own receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'booking-receipts'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.bookings WHERE user_id = auth.uid()
  )
);

-- Policy 3: Admins can view all receipts
CREATE POLICY "Admins can view all receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'booking-receipts'
  AND EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true
  )
);

-- Policy 4: Admins can delete receipts
CREATE POLICY "Admins can delete receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'booking-receipts'
  AND EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true
  )
);

-- Step 4: Add index for faster receipt queries
CREATE INDEX IF NOT EXISTS idx_bookings_receipt_url ON public.bookings(receipt_url) WHERE receipt_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_receipt_uploaded_at ON public.bookings(receipt_uploaded_at);

-- Step 5: Create function to update booking status after receipt upload
CREATE OR REPLACE FUNCTION update_booking_status_on_receipt_upload()
RETURNS TRIGGER AS $$
BEGIN
  -- When receipt_url is set and status is 'pending', automatically change to 'to_be_confirmed'
  IF NEW.receipt_url IS NOT NULL AND NEW.receipt_url != '' AND OLD.receipt_url IS NULL AND NEW.status = 'pending' THEN
    NEW.status := 'to_be_confirmed';
    NEW.receipt_uploaded_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger for automatic status update
DROP TRIGGER IF EXISTS trigger_update_status_on_receipt ON public.bookings;
CREATE TRIGGER trigger_update_status_on_receipt
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_status_on_receipt_upload();

-- Step 7: Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings' AND column_name IN ('receipt_url', 'receipt_uploaded_at');

-- Check storage policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects' AND policyname LIKE '%receipt%';
