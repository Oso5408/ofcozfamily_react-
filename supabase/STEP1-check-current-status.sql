-- =============================================
-- STEP 1: Check Current Status
-- =============================================
-- Run this first to see what's in your database
-- =============================================

-- Check existing booking statuses
SELECT DISTINCT status, COUNT(*) as count
FROM public.bookings
GROUP BY status
ORDER BY count DESC;

-- Check current constraints
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.bookings'::regclass
AND contype = 'c'
AND conname LIKE '%status%';
