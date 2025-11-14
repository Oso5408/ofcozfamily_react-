-- =============================================
-- DEBUG: Check for booking conflicts on specific date/time
-- =============================================
-- Use this to find why a booking is being blocked

-- INSTRUCTIONS: Replace these values with your booking details
DO $$
DECLARE
  check_date DATE := '2025-12-04';
  check_start_time TIME := '19:30';
  check_end_time TIME := '21:30';
  check_room_id INTEGER := 2; -- Room C

  check_start_timestamp TIMESTAMP WITH TIME ZONE;
  check_end_timestamp TIMESTAMP WITH TIME ZONE;
  conflict_count INTEGER;
  is_available BOOLEAN;
  booking_rec RECORD;
BEGIN
  -- Build full timestamps
  check_start_timestamp := check_date + check_start_time;
  check_end_timestamp := check_date + check_end_time;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'BOOKING CONFLICT DEBUG';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Checking: Room % | Date: % | Time: % to %',
    check_room_id, check_date, check_start_time, check_end_time;
  RAISE NOTICE '';

  -- Check for conflicts in the same room
  RAISE NOTICE '--- Conflicts in Room % ---', check_room_id;
  FOR booking_rec IN (
    SELECT
      id,
      room_id,
      start_time,
      end_time,
      status,
      payment_status,
      user_id
    FROM public.bookings
    WHERE room_id = check_room_id
      AND status NOT IN ('cancelled')
      AND tstzrange(start_time, end_time) && tstzrange(check_start_timestamp, check_end_timestamp)
  ) LOOP
    RAISE NOTICE 'CONFLICT FOUND:';
    RAISE NOTICE '  Booking ID: %', booking_rec.id;
    RAISE NOTICE '  Time: % to %', booking_rec.start_time, booking_rec.end_time;
    RAISE NOTICE '  Status: %', booking_rec.status;
    RAISE NOTICE '  Payment: %', booking_rec.payment_status;
    RAISE NOTICE '';
  END LOOP;

  -- Check for conflicts in linked rooms (if Room B or C)
  IF check_room_id IN (1, 2) THEN
    RAISE NOTICE '--- Conflicts in Linked Rooms (B & C) ---';
    FOR booking_rec IN (
      SELECT
        id,
        room_id,
        start_time,
        end_time,
        status,
        payment_status
      FROM public.bookings
      WHERE room_id IN (1, 2)
        AND room_id != check_room_id
        AND status NOT IN ('cancelled')
        AND tstzrange(start_time, end_time) && tstzrange(check_start_timestamp, check_end_timestamp)
    ) LOOP
      RAISE NOTICE 'LINKED ROOM CONFLICT:';
      RAISE NOTICE '  Booking ID: %', booking_rec.id;
      RAISE NOTICE '  Room ID: %', booking_rec.room_id;
      RAISE NOTICE '  Time: % to %', booking_rec.start_time, booking_rec.end_time;
      RAISE NOTICE '  Status: %', booking_rec.status;
      RAISE NOTICE '';
    END LOOP;
  END IF;

  -- Test the availability function
  SELECT check_room_availability(
    check_room_id,
    check_start_timestamp,
    check_end_timestamp
  ) INTO is_available;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'RESULT: check_room_availability() = %', is_available;
  RAISE NOTICE '========================================';

  IF is_available THEN
    RAISE NOTICE '✅ Slot is AVAILABLE - booking should succeed';
  ELSE
    RAISE NOTICE '❌ Slot is BLOCKED - booking will fail';
    RAISE NOTICE 'Check the conflicts listed above';
  END IF;

END $$;
