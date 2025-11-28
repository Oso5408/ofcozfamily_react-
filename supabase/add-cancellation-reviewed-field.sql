-- =============================================
-- Add Cancellation Reviewed Tracking
-- =============================================
-- Adds a boolean field to track whether admin has reviewed/acknowledged
-- a cancelled booking, enabling the "待確認取消" statistics card
-- =============================================

-- Add cancellation_reviewed column to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS cancellation_reviewed BOOLEAN DEFAULT FALSE;

-- Set existing cancelled bookings as unreviewed
UPDATE public.bookings
SET cancellation_reviewed = FALSE
WHERE status = 'cancelled' AND cancellation_reviewed IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.bookings.cancellation_reviewed IS 'Whether admin has reviewed/acknowledged this cancellation (for admin notification tracking)';

-- Create index for faster queries on unreviewed cancellations
CREATE INDEX IF NOT EXISTS idx_bookings_cancellation_reviewed
ON public.bookings(cancellation_reviewed)
WHERE status = 'cancelled';

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check column exists
SELECT
  '✅ cancellation_reviewed column added' AS status,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings'
AND column_name = 'cancellation_reviewed';

-- Check index created
SELECT
  '✅ Index created' AS status,
  indexname
FROM pg_indexes
WHERE tablename = 'bookings'
AND indexname = 'idx_bookings_cancellation_reviewed';

-- Show count of unreviewed cancellations
SELECT
  '📊 Unreviewed Cancellations Count' AS info,
  COUNT(*) AS unreviewed_count
FROM public.bookings
WHERE status = 'cancelled' AND cancellation_reviewed = FALSE;

-- Show sample unreviewed cancellations
SELECT
  '📋 Sample Unreviewed Cancellations' AS info,
  id,
  receipt_number,
  cancelled_at,
  cancellation_reviewed
FROM public.bookings
WHERE status = 'cancelled' AND cancellation_reviewed = FALSE
LIMIT 5;

SELECT '🎉 Cancellation reviewed tracking enabled!' AS status;
