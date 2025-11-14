-- =============================================
-- QUICK FIX: Stop Overbooking for Linked Rooms
-- =============================================
-- Just run this script to fix the issue

-- Drop the old function
DROP FUNCTION IF EXISTS check_room_availability(INTEGER, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, UUID);

-- Create the fixed function
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

  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Done! Test it by trying to double-book Room B and Room C.
