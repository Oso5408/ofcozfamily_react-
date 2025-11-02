-- =============================================
-- DP20 Day Pass Package System Migration
-- =============================================
-- Adds DP20 (Day Pass 20 visits) package system for Lobby Seat
-- Similar to BR packages but with per-visit counting and expiry
-- =============================================

-- Add DP20 balance and expiry columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS dp20_balance INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS dp20_expiry TIMESTAMP WITH TIME ZONE;

-- Update package_history table to support DP20
-- First, drop the existing constraint
ALTER TABLE public.package_history
DROP CONSTRAINT IF EXISTS package_history_package_type_check;

-- Add new constraint that includes DP20
ALTER TABLE public.package_history
ADD CONSTRAINT package_history_package_type_check
CHECK (package_type IN ('BR15', 'BR30', 'DP20'));

-- Comment on new columns
COMMENT ON COLUMN public.users.dp20_balance IS 'Day Pass balance - number of remaining visits (max 20)';
COMMENT ON COLUMN public.users.dp20_expiry IS 'Expiry date for DP20 package (90 days from assignment)';

-- Create index for faster expiry queries
CREATE INDEX IF NOT EXISTS idx_users_dp20_expiry ON public.users(dp20_expiry) WHERE dp20_expiry IS NOT NULL;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check new columns exist
SELECT
  '✅ DP20 columns added' AS status,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('dp20_balance', 'dp20_expiry');

-- Check updated constraint
SELECT
  '✅ Package types updated' AS status,
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'package_history_package_type_check';

-- Show sample user data
SELECT
  '📊 Sample User DP20 Data' AS info,
  id,
  email,
  dp20_balance,
  dp20_expiry,
  CASE
    WHEN dp20_expiry IS NULL THEN 'No package'
    WHEN dp20_expiry < NOW() THEN 'Expired'
    ELSE 'Valid'
  END AS status
FROM public.users
LIMIT 5;

-- =============================================
-- HELPER FUNCTION: Check if DP20 is valid
-- =============================================
CREATE OR REPLACE FUNCTION check_dp20_valid(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_dp20_balance INTEGER;
  user_dp20_expiry TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT dp20_balance, dp20_expiry
  INTO user_dp20_balance, user_dp20_expiry
  FROM public.users
  WHERE id = user_id;

  -- Valid if has balance and not expired
  RETURN user_dp20_balance > 0
    AND (user_dp20_expiry IS NULL OR user_dp20_expiry > NOW());
END;
$$ LANGUAGE plpgsql;

-- Comment on function
COMMENT ON FUNCTION check_dp20_valid IS 'Check if user has valid DP20 balance (>0 and not expired)';

-- =============================================
-- USAGE EXAMPLES
-- =============================================

-- Example: Assign DP20 package to a user
/*
UPDATE public.users
SET
  dp20_balance = 20,
  dp20_expiry = NOW() + INTERVAL '90 days'
WHERE email = 'user@example.com';

INSERT INTO public.package_history (user_id, package_type, br_amount, assigned_by, reason)
VALUES (
  (SELECT id FROM public.users WHERE email = 'user@example.com'),
  'DP20',
  20,
  (SELECT id FROM public.users WHERE is_admin = true LIMIT 1),
  'Initial DP20 package purchase'
);
*/

-- Example: Deduct one visit from DP20 balance
/*
UPDATE public.users
SET dp20_balance = GREATEST(dp20_balance - 1, 0)
WHERE id = 'user-uuid-here'
AND check_dp20_valid(id) = true;
*/

-- Example: Find users with expiring DP20 packages (next 7 days)
/*
SELECT
  email,
  dp20_balance,
  dp20_expiry,
  (dp20_expiry - NOW())::TEXT AS time_remaining
FROM public.users
WHERE dp20_expiry BETWEEN NOW() AND NOW() + INTERVAL '7 days'
AND dp20_balance > 0
ORDER BY dp20_expiry ASC;
*/

SELECT '🎉 DP20 Package System migration complete!' AS status;
