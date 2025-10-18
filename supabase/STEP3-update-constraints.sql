-- =============================================
-- STEP 3: Update Status Constraint
-- =============================================
-- Run this AFTER clearing all bookings
-- =============================================

-- Drop the old status constraint
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Add the NEW status constraint
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_status_check
CHECK (status IN ('pending', 'to_be_confirmed', 'confirmed', 'cancelled', 'rescheduled'));

-- Update the default value
ALTER TABLE public.bookings
ALTER COLUMN status SET DEFAULT 'pending';

-- Update the exclusion constraint to exclude cancelled AND rescheduled
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

-- Verify the new constraint
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.bookings'::regclass
AND contype = 'c'
AND conname = 'bookings_status_check';
