-- =============================================
-- DISABLE Automatic Token Deduction Trigger
-- =============================================
-- This trigger was automatically deducting regular tokens
-- when bookings were created. Now that we have BR packages,
-- the app handles all token/BR deductions manually.
-- =============================================

-- Drop the trigger (safe to run multiple times)
DROP TRIGGER IF EXISTS deduct_tokens_on_booking ON public.bookings;

-- Verify the trigger is gone
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'deduct_tokens_on_booking'
  AND event_object_table = 'bookings';

-- Should return empty (no rows) if successfully removed

-- Optional: Keep the function but disable the trigger
-- If you want to re-enable it later, you can recreate the trigger with:
/*
CREATE TRIGGER deduct_tokens_on_booking AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION deduct_tokens_for_booking();
*/

SELECT 'Trigger disabled successfully!' as status;
