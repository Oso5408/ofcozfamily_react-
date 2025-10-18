-- =============================================
-- Fix Booking Race Condition
-- =============================================
-- This script updates the check_room_availability function
-- to use row-level locking (FOR UPDATE) to prevent race conditions
-- Run this in your Supabase SQL Editor
-- =============================================

-- Updated function with row-level locking
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
  -- Use FOR UPDATE to lock the rows during the check
  -- This prevents other transactions from modifying bookings
  -- for the same room while we're checking availability
  SELECT COUNT(*) INTO conflict_count
  FROM public.bookings
  WHERE room_id = p_room_id
    AND status NOT IN ('cancelled')
    AND (id IS DISTINCT FROM p_exclude_booking_id)
    AND tstzrange(start_time, end_time) && tstzrange(p_start_time, p_end_time)
  FOR UPDATE;

  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- NOTES:
-- =============================================
-- The FOR UPDATE clause locks the selected rows, preventing other transactions
-- from modifying them until the current transaction completes.
--
-- This significantly reduces (but doesn't completely eliminate) race conditions:
-- 1. When two users check availability simultaneously, one will acquire the lock first
-- 2. The second user will wait until the first transaction completes
-- 3. By the time the second user's check runs, the first booking may already exist
--
-- The database exclusion constraint (no_overlapping_bookings) remains
-- as the final safeguard if race conditions still occur.
