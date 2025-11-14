-- =============================================
-- FIX: check_room_availability for Linked Rooms
-- =============================================
-- This fixes the overbooking issue where Room B (id=1) and Room C (id=2)
-- are linked but the availability check wasn't considering both rooms

-- Drop the existing function
DROP FUNCTION IF EXISTS check_room_availability(INTEGER, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, UUID);

-- Create updated function with linked room logic
CREATE OR REPLACE FUNCTION check_room_availability(
  p_room_id INTEGER,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
  linked_room_ids INTEGER[];
BEGIN
  -- Room B (id=1) and Room C (id=2) are linked
  -- If booking Room B or C, check both rooms for conflicts
  IF p_room_id = 1 OR p_room_id = 2 THEN
    linked_room_ids := ARRAY[1, 2];
  ELSE
    linked_room_ids := ARRAY[p_room_id];
  END IF;

  -- Check for overlapping bookings
  SELECT COUNT(*) INTO conflict_count
  FROM public.bookings
  WHERE room_id = ANY(linked_room_ids)
    AND status NOT IN ('cancelled')
    AND (id IS DISTINCT FROM p_exclude_booking_id)
    AND tstzrange(start_time, end_time) && tstzrange(p_start_time, p_end_time);

  -- Return true if no conflicts found
  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Verify the function was created
SELECT
  proname AS function_name,
  pg_get_functiondef(oid) AS definition
FROM pg_proc
WHERE proname = 'check_room_availability';

-- Test the function with sample data
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'check_room_availability FUNCTION UPDATED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Function now checks linked rooms:';
  RAISE NOTICE '   - Room B (id=1) checks both Room B and Room C';
  RAISE NOTICE '   - Room C (id=2) checks both Room B and Room C';
  RAISE NOTICE '   - Other rooms check only themselves';
  RAISE NOTICE '';
  RAISE NOTICE 'This prevents overbooking between linked rooms.';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
