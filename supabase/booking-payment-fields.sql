-- =============================================
-- ADD PAYMENT CONFIRMATION FIELDS TO BOOKINGS
-- =============================================
-- This script adds fields for admin payment confirmation tracking

-- Add admin_notes column for payment notes
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add timestamp for when payment was confirmed
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Add reference to which admin confirmed the payment
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS payment_confirmed_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Add index for faster querying of pending payments
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);

-- Add index for payment confirmation tracking
CREATE INDEX IF NOT EXISTS idx_bookings_payment_confirmed_by ON public.bookings(payment_confirmed_by);

-- Update booking status enum to include 'pending_payment' status
-- Note: This uses a check constraint approach since Postgres doesn't have ALTER TYPE for enums easily

-- Drop existing check constraint if it exists
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Add new check constraint with 'pending_payment' status
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_status_check
CHECK (status IN ('pending_payment', 'confirmed', 'cancelled', 'completed', 'no-show'));

-- Comment on new columns for documentation
COMMENT ON COLUMN public.bookings.admin_notes IS 'Admin notes about payment confirmation (e.g., cash received, payment method)';
COMMENT ON COLUMN public.bookings.payment_confirmed_at IS 'Timestamp when admin confirmed payment was received';
COMMENT ON COLUMN public.bookings.payment_confirmed_by IS 'Reference to admin user who confirmed the payment';

-- Verify the changes
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name IN ('admin_notes', 'payment_confirmed_at', 'payment_confirmed_by')
ORDER BY column_name;

-- Show current booking statuses for reference
DO $$
BEGIN
  RAISE NOTICE 'Bookings table updated successfully';
  RAISE NOTICE 'New booking statuses available: pending_payment, confirmed, cancelled, completed, no-show';
  RAISE NOTICE 'Payment confirmation fields added: admin_notes, payment_confirmed_at, payment_confirmed_by';
END $$;
