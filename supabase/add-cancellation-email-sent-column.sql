-- Add column to track whether cancellation email has been sent to user
-- This prevents duplicate email sending after page refresh

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS cancellation_email_sent BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN public.bookings.cancellation_email_sent IS 'Tracks whether admin has sent cancellation notification email to user';

-- For existing cancelled bookings, assume email was already sent if cancelled_at exists
UPDATE public.bookings
SET cancellation_email_sent = TRUE
WHERE status = 'cancelled'
  AND cancelled_at IS NOT NULL
  AND cancellation_email_sent IS FALSE;

-- Verification query (optional - comment out if not needed)
-- SELECT id, status, cancelled_at, cancellation_email_sent
-- FROM public.bookings
-- WHERE status = 'cancelled'
-- ORDER BY cancelled_at DESC
-- LIMIT 10;
