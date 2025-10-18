-- =============================================
-- Fix Booking Status Constraints
-- =============================================
-- Run this to completely fix the booking status issue
-- =============================================

-- First, let's see what constraints exist
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.bookings'::regclass
AND contype = 'c';

-- Drop ALL check constraints on bookings table
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.bookings'::regclass
        AND contype = 'c'
    LOOP
        EXECUTE 'ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- Update ALL existing bookings to use new status values
UPDATE public.bookings
SET status = CASE
  WHEN status = 'completed' THEN 'confirmed'
  WHEN status = 'no-show' THEN 'confirmed'
  WHEN status = 'modified' THEN 'to_be_confirmed'
  WHEN status = 'paid' THEN 'to_be_confirmed'
  WHEN status = 'pending_payment' THEN 'pending'
  WHEN status = 'processing' THEN 'pending'
  WHEN status NOT IN ('pending', 'to_be_confirmed', 'confirmed', 'cancelled', 'rescheduled') THEN 'pending'
  ELSE status
END;

-- Add the new status constraint
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_status_check
CHECK (status IN ('pending', 'to_be_confirmed', 'confirmed', 'cancelled', 'rescheduled'));

-- Add other constraints back
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_booking_type_check
CHECK (booking_type IN ('hourly', 'daily', 'monthly'));

ALTER TABLE public.bookings
ADD CONSTRAINT bookings_payment_method_check
CHECK (payment_method IN ('token', 'cash'));

ALTER TABLE public.bookings
ADD CONSTRAINT bookings_payment_status_check
CHECK (payment_status IN ('pending', 'completed', 'cancelled', 'refunded'));

-- Update the default value
ALTER TABLE public.bookings
ALTER COLUMN status SET DEFAULT 'pending';

-- Update the exclusion constraint
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS no_overlapping_bookings;

ALTER TABLE public.bookings
ADD CONSTRAINT no_overlapping_bookings
EXCLUDE USING GIST (
  room_id WITH =,
  tstzrange(start_time, end_time, '[)') WITH &&
) WHERE (status NOT IN ('cancelled', 'rescheduled'));

-- Update check_room_availability function
CREATE OR REPLACE FUNCTION check_room_availability(
  p_room_id INTEGER,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO conflict_count
  FROM public.bookings
  WHERE room_id = p_room_id
    AND status NOT IN ('cancelled', 'rescheduled')
    AND (id IS DISTINCT FROM p_exclude_booking_id)
    AND tstzrange(start_time, end_time) && tstzrange(p_start_time, p_end_time);

  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Verify the changes
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.bookings'::regclass
AND contype = 'c';
