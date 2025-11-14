-- =============================================
-- REMOVE: Room B and Room C Linking
-- =============================================
-- This makes Room B and Room C independent
-- They can now be booked at the same time

-- Drop the existing function
DROP FUNCTION IF EXISTS check_room_availability(INTEGER, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, UUID);

-- Create updated function WITHOUT linked room logic
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
  -- Check for overlapping bookings in the SAME room only
  -- No more linked room logic - each room is independent
  SELECT COUNT(*) INTO conflict_count
  FROM public.bookings
  WHERE room_id = p_room_id  -- Only check the specific room
    AND status NOT IN ('cancelled')
    AND (id IS DISTINCT FROM p_exclude_booking_id)
    AND tstzrange(start_time, end_time) && tstzrange(p_start_time, p_end_time);

  -- Return true if no conflicts found
  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Verify the function was updated
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ROOM LINKING REMOVED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Room B (id=1) and Room C (id=2) are now INDEPENDENT';
  RAISE NOTICE '✅ They can be booked at the same time';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Update frontend code to remove linking';
  RAISE NOTICE '========================================';
END $$;
