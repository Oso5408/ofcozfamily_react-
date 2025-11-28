-- =============================================
-- Add BR15 and BR30 Expiry Columns
-- =============================================
-- Adds expiry date tracking for BR15 and BR30 packages
-- Matches the existing DP20 expiry system
-- =============================================

-- Add BR15 expiry column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS br15_expiry TIMESTAMP WITH TIME ZONE;

-- Add BR30 expiry column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS br30_expiry TIMESTAMP WITH TIME ZONE;

-- Create indexes for faster expiry queries
CREATE INDEX IF NOT EXISTS idx_users_br15_expiry
ON public.users(br15_expiry)
WHERE br15_expiry IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_br30_expiry
ON public.users(br30_expiry)
WHERE br30_expiry IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.users.br15_expiry IS 'Expiry date for BR15 package (typically 180 days from assignment)';
COMMENT ON COLUMN public.users.br30_expiry IS 'Expiry date for BR30 package (typically 180 days from assignment)';

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check new columns exist
SELECT
  '✅ BR expiry columns added' AS status,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('br15_expiry', 'br30_expiry');

-- Check indexes created
SELECT
  '✅ Indexes created' AS status,
  indexname
FROM pg_indexes
WHERE tablename = 'users'
AND indexname IN ('idx_users_br15_expiry', 'idx_users_br30_expiry');

-- Show sample user data with all package expiries
SELECT
  '📊 Sample User Package Data' AS info,
  id,
  email,
  br15_balance,
  br15_expiry,
  br30_balance,
  br30_expiry,
  dp20_balance,
  dp20_expiry
FROM public.users
WHERE br15_balance > 0 OR br30_balance > 0 OR dp20_balance > 0
LIMIT 5;

-- =============================================
-- HELPER FUNCTION: Check if BR15 is valid
-- =============================================
CREATE OR REPLACE FUNCTION check_br15_valid(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_br15_balance INTEGER;
  user_br15_expiry TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT br15_balance, br15_expiry
  INTO user_br15_balance, user_br15_expiry
  FROM public.users
  WHERE id = user_id;

  -- Valid if has balance and not expired (or no expiry set)
  RETURN user_br15_balance > 0
    AND (user_br15_expiry IS NULL OR user_br15_expiry > NOW());
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_br15_valid IS 'Check if user has valid BR15 balance (>0 and not expired)';

-- =============================================
-- HELPER FUNCTION: Check if BR30 is valid
-- =============================================
CREATE OR REPLACE FUNCTION check_br30_valid(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_br30_balance INTEGER;
  user_br30_expiry TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT br30_balance, br30_expiry
  INTO user_br30_balance, user_br30_expiry
  FROM public.users
  WHERE id = user_id;

  -- Valid if has balance and not expired (or no expiry set)
  RETURN user_br30_balance > 0
    AND (user_br30_expiry IS NULL OR user_br30_expiry > NOW());
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_br30_valid IS 'Check if user has valid BR30 balance (>0 and not expired)';

-- =============================================
-- USAGE EXAMPLES
-- =============================================

-- Example: Assign BR15 package with 180-day expiry
/*
UPDATE public.users
SET
  br15_balance = br15_balance + 15,
  br15_expiry = NOW() + INTERVAL '180 days'
WHERE id = 'user-uuid-here';
*/

-- Example: Assign BR30 package with 180-day expiry
/*
UPDATE public.users
SET
  br30_balance = br30_balance + 30,
  br30_expiry = NOW() + INTERVAL '180 days'
WHERE id = 'user-uuid-here';
*/

-- Example: Find users with expiring BR15 packages (next 7 days)
/*
SELECT
  email,
  br15_balance,
  br15_expiry,
  (br15_expiry - NOW())::TEXT AS time_remaining
FROM public.users
WHERE br15_expiry BETWEEN NOW() AND NOW() + INTERVAL '7 days'
AND br15_balance > 0
ORDER BY br15_expiry ASC;
*/

-- Example: Find users with expiring BR30 packages (next 7 days)
/*
SELECT
  email,
  br30_balance,
  br30_expiry,
  (br30_expiry - NOW())::TEXT AS time_remaining
FROM public.users
WHERE br30_expiry BETWEEN NOW() AND NOW() + INTERVAL '7 days'
AND br30_balance > 0
ORDER BY br30_expiry ASC;
*/

SELECT '🎉 BR15 and BR30 expiry columns migration complete!' AS status;
