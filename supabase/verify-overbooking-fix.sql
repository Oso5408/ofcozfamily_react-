-- =============================================
-- VERIFY: Overbooking Fix for Linked Rooms
-- =============================================
-- This script helps you verify the overbooking issue is fixed

-- 1. Check current check_room_availability function
SELECT
  proname AS function_name,
  prosrc AS source_code
FROM pg_proc
WHERE proname = 'check_room_availability';

-- 2. Run comprehensive verification
DO $$
DECLARE
  test_start TIMESTAMP WITH TIME ZONE := '2025-11-15 14:00:00+00';
  test_end TIMESTAMP WITH TIME ZONE := '2025-11-15 15:00:00+00';
  room_b_available BOOLEAN;
  room_c_available BOOLEAN;
  has_room_b_booking BOOLEAN;
  booking_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'OVERBOOKING FIX VERIFICATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  -- Check if there's already a Room B booking at test time
  SELECT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE room_id = 1
      AND status NOT IN ('cancelled')
      AND tstzrange(start_time, end_time) && tstzrange(test_start, test_end)
  ) INTO has_room_b_booking;

  IF has_room_b_booking THEN
    RAISE NOTICE '📅 Test Scenario: Room B has existing booking at test time';
    RAISE NOTICE '';

    -- Test Room C availability (should be blocked because of linked rooms)
    SELECT check_room_availability(2, test_start, test_end) INTO room_c_available;

    IF room_c_available THEN
      RAISE NOTICE '❌ ISSUE DETECTED: Room C shows as available';
      RAISE NOTICE '   Problem: Room B is booked but Room C appears available';
      RAISE NOTICE '   Solution: Run fix-check-room-availability.sql';
    ELSE
      RAISE NOTICE '✅ WORKING CORRECTLY: Room C is blocked';
      RAISE NOTICE '   Room B booking correctly blocks Room C';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️  No Room B bookings found at test time';
    RAISE NOTICE '   Cannot run linked room conflict test';
    RAISE NOTICE '   Try with an actual booking time';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '--- Recent Bookings (Room B and C) ---';
  RAISE NOTICE '';

  -- Show recent bookings inline
  FOR booking_rec IN (
    SELECT
      b.id,
      b.room_id,
      r.name AS room_name,
      b.start_time::timestamp AS start_time,
      b.end_time::timestamp AS end_time,
      b.status
    FROM public.bookings b
    JOIN public.rooms r ON b.room_id = r.id
    WHERE b.room_id IN (1, 2)
      AND b.status NOT IN ('cancelled')
      AND b.start_time >= NOW() - INTERVAL '7 days'
    ORDER BY b.start_time DESC
    LIMIT 5
  ) LOOP
    RAISE NOTICE 'Booking: % | Room: % (%) | % to %',
      booking_rec.id,
      booking_rec.room_id,
      booking_rec.room_name,
      booking_rec.start_time,
      booking_rec.end_time;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- 3. Summary report
DO $$
DECLARE
  func_exists BOOLEAN;
  func_contains_linked_logic BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Check if function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'check_room_availability'
  ) INTO func_exists;

  IF func_exists THEN
    RAISE NOTICE '✅ check_room_availability function exists';

    -- Check if it contains linked room logic
    SELECT prosrc LIKE '%linked_room_ids%' OR prosrc LIKE '%ARRAY[1, 2]%'
    INTO func_contains_linked_logic
    FROM pg_proc
    WHERE proname = 'check_room_availability';

    IF func_contains_linked_logic THEN
      RAISE NOTICE '✅ Function includes linked room logic';
      RAISE NOTICE '';
      RAISE NOTICE 'Overbooking fix is properly installed!';
    ELSE
      RAISE NOTICE '⚠️  Function does NOT include linked room logic';
      RAISE NOTICE '';
      RAISE NOTICE 'ACTION REQUIRED:';
      RAISE NOTICE '1. Run: supabase/fix-check-room-availability.sql';
      RAISE NOTICE '2. Verify: supabase/verify-overbooking-fix.sql';
    END IF;
  ELSE
    RAISE NOTICE '❌ check_room_availability function NOT FOUND';
    RAISE NOTICE '';
    RAISE NOTICE 'ACTION REQUIRED:';
    RAISE NOTICE '1. Run: supabase/complete-setup.sql';
    RAISE NOTICE '2. Run: supabase/fix-check-room-availability.sql';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
