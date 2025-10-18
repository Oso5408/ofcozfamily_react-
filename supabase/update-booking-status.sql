-- =============================================
-- Update Booking Status Values
-- =============================================
-- This script updates the booking status constraint
-- New status values: pending, to_be_confirmed, confirmed, cancelled, rescheduled
-- =============================================

-- Step 1: First, check what status values currently exist
-- Run this to see current statuses:
-- SELECT DISTINCT status FROM public.bookings;

-- Step 2: Update ALL existing bookings to match new status values BEFORE adding constraint
-- Map old statuses to new ones
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

-- Step 3: Drop the existing constraint
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Step 4: Add the new constraint with updated status values
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_status_check
CHECK (status IN ('pending', 'to_be_confirmed', 'confirmed', 'cancelled', 'rescheduled'));

-- Step 5: Update the default value to 'pending'
ALTER TABLE public.bookings
ALTER COLUMN status SET DEFAULT 'pending';

-- Step 5: Update the exclusion constraint to exclude cancelled AND rescheduled bookings
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS no_overlapping_bookings;

ALTER TABLE public.bookings
ADD CONSTRAINT no_overlapping_bookings
EXCLUDE USING GIST (
  room_id WITH =,
  tstzrange(start_time, end_time, '[)') WITH &&
) WHERE (status NOT IN ('cancelled', 'rescheduled'));

-- Step 6: Update check_room_availability function to exclude cancelled and rescheduled
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
