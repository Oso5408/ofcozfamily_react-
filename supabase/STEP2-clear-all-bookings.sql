-- =============================================
-- STEP 2: Clear All Test Bookings
-- =============================================
-- Run this to delete all bookings (fresh start)
-- =============================================

-- Delete all bookings
DELETE FROM public.bookings;

-- Delete all token history
DELETE FROM public.token_history;

-- Verify they're empty
SELECT 'bookings' as table_name, COUNT(*) as count FROM public.bookings
UNION ALL
SELECT 'token_history', COUNT(*) FROM public.token_history;
