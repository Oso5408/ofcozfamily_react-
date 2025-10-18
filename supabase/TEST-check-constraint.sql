-- =============================================
-- TEST: Check if constraint was updated
-- =============================================
-- Run this to verify the constraint accepts new status values
-- =============================================

-- Check what the constraint currently allows
SELECT pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.bookings'::regclass
AND conname = 'bookings_status_check';

-- Try to insert a test booking with new status
-- This should SUCCEED if constraint is updated correctly
-- This should FAIL if constraint is still old
INSERT INTO public.bookings (
  user_id,
  room_id,
  start_time,
  end_time,
  booking_type,
  payment_method,
  payment_status,
  total_cost,
  status,
  notes
) VALUES (
  (SELECT id FROM public.users LIMIT 1), -- Use any existing user
  1, -- Room 1
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '1 day' + INTERVAL '1 hour',
  'hourly',
  'cash',
  'pending',
  100.00,
  'pending', -- NEW STATUS VALUE
  '{"test": true}'
) RETURNING id, status;

-- If successful, delete the test booking
DELETE FROM public.bookings WHERE notes = '{"test": true}';
