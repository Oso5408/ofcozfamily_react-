-- =============================================
-- Add DP20, BR15, BR30 to Payment Method Constraint
-- =============================================
-- This adds support for package payment methods (dp20, br15, br30)
-- in addition to the existing token and cash methods
-- =============================================

-- Drop the old constraint
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_payment_method_check;

-- Add the new constraint with all payment methods
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_payment_method_check
CHECK (payment_method IN ('token', 'cash', 'dp20', 'br15', 'br30'));

-- Verify the change
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.bookings'::regclass
AND conname = 'bookings_payment_method_check';
x`c