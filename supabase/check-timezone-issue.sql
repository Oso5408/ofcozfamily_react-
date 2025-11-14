-- =============================================
-- CHECK: Timezone Issues in Bookings
-- =============================================
-- Sometimes bookings fail because of timezone mismatches

SELECT
  id,
  room_id,
  start_time,
  end_time,
  start_time::timestamp AS start_local,
  end_time::timestamp AS end_local,
  DATE(start_time) AS booking_date,
  TO_CHAR(start_time, 'HH24:MI') AS start_time_only,
  TO_CHAR(end_time, 'HH24:MI') AS end_time_only,
  status,
  created_at
FROM public.bookings
WHERE DATE(start_time) = '2025-12-04'
  AND room_id IN (1, 2)
  AND status NOT IN ('cancelled')
ORDER BY start_time;

-- Check what timezone the database is using
SHOW timezone;

-- Check for bookings around the target time
SELECT
  'Checking conflicts for Room C on 2025-12-04 19:30-21:30' AS info;

SELECT
  id,
  room_id,
  start_time,
  end_time,
  status,
  CASE
    WHEN tstzrange(start_time, end_time) && tstzrange('2025-12-04 19:30:00+00', '2025-12-04 21:30:00+00')
    THEN '⚠️ OVERLAPS'
    ELSE 'OK'
  END AS conflict_status
FROM public.bookings
WHERE room_id IN (1, 2)  -- Check both linked rooms
  AND status NOT IN ('cancelled')
  AND DATE(start_time) = '2025-12-04'
ORDER BY start_time;
