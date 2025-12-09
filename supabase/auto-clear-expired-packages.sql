-- =============================================
-- Auto-Clear Expired Package Balances
-- =============================================
-- Automatically sets package balances to 0 when expiry date is reached
-- Applies to BR15, BR30, and DP20 packages
-- =============================================

-- =============================================
-- FUNCTION: Clear expired packages for a specific user
-- =============================================
CREATE OR REPLACE FUNCTION clear_expired_packages(p_user_id UUID)
RETURNS TABLE(
  packages_cleared TEXT[],
  br15_cleared INTEGER,
  br30_cleared INTEGER,
  dp20_cleared INTEGER
) AS $$
DECLARE
  v_br15_balance INTEGER;
  v_br15_expiry TIMESTAMP WITH TIME ZONE;
  v_br30_balance INTEGER;
  v_br30_expiry TIMESTAMP WITH TIME ZONE;
  v_dp20_balance INTEGER;
  v_dp20_expiry TIMESTAMP WITH TIME ZONE;
  v_cleared_packages TEXT[] := ARRAY[]::TEXT[];
  v_br15_cleared INTEGER := 0;
  v_br30_cleared INTEGER := 0;
  v_dp20_cleared INTEGER := 0;
BEGIN
  -- Get current package data
  SELECT
    br15_balance, br15_expiry,
    br30_balance, br30_expiry,
    dp20_balance, dp20_expiry
  INTO
    v_br15_balance, v_br15_expiry,
    v_br30_balance, v_br30_expiry,
    v_dp20_balance, v_dp20_expiry
  FROM public.users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- Check and clear BR15 if expired
  IF v_br15_balance > 0 AND v_br15_expiry IS NOT NULL AND v_br15_expiry <= NOW() THEN
    v_br15_cleared := v_br15_balance;
    v_cleared_packages := array_append(v_cleared_packages, 'BR15');

    UPDATE public.users
    SET br15_balance = 0,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Log to package_history
    INSERT INTO public.package_history (
      user_id,
      package_type,
      br_amount,
      notes,
      reason
    ) VALUES (
      p_user_id,
      'BR15',
      -v_br15_cleared,
      'Auto-cleared: Package expired',
      'Expired on ' || v_br15_expiry::TEXT
    );

    RAISE NOTICE 'Cleared % BR15 credits (expired: %)', v_br15_cleared, v_br15_expiry;
  END IF;

  -- Check and clear BR30 if expired
  IF v_br30_balance > 0 AND v_br30_expiry IS NOT NULL AND v_br30_expiry <= NOW() THEN
    v_br30_cleared := v_br30_balance;
    v_cleared_packages := array_append(v_cleared_packages, 'BR30');

    UPDATE public.users
    SET br30_balance = 0,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Log to package_history
    INSERT INTO public.package_history (
      user_id,
      package_type,
      br_amount,
      notes,
      reason
    ) VALUES (
      p_user_id,
      'BR30',
      -v_br30_cleared,
      'Auto-cleared: Package expired',
      'Expired on ' || v_br30_expiry::TEXT
    );

    RAISE NOTICE 'Cleared % BR30 credits (expired: %)', v_br30_cleared, v_br30_expiry;
  END IF;

  -- Check and clear DP20 if expired
  IF v_dp20_balance > 0 AND v_dp20_expiry IS NOT NULL AND v_dp20_expiry <= NOW() THEN
    v_dp20_cleared := v_dp20_balance;
    v_cleared_packages := array_append(v_cleared_packages, 'DP20');

    UPDATE public.users
    SET dp20_balance = 0,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Log to package_history (DP20 uses dp_amount instead of br_amount)
    INSERT INTO public.package_history (
      user_id,
      package_type,
      br_amount,
      notes,
      reason
    ) VALUES (
      p_user_id,
      'DP20',
      -v_dp20_cleared,
      'Auto-cleared: Package expired',
      'Expired on ' || v_dp20_expiry::TEXT
    );

    RAISE NOTICE 'Cleared % DP20 days (expired: %)', v_dp20_cleared, v_dp20_expiry;
  END IF;

  -- Return results
  RETURN QUERY SELECT v_cleared_packages, v_br15_cleared, v_br30_cleared, v_dp20_cleared;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION clear_expired_packages IS 'Clears expired package balances for a specific user and logs to history';

-- =============================================
-- FUNCTION: Batch clear expired packages for all users
-- =============================================
CREATE OR REPLACE FUNCTION clear_all_expired_packages()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  packages_cleared TEXT[],
  br15_cleared INTEGER,
  br30_cleared INTEGER,
  dp20_cleared INTEGER
) AS $$
DECLARE
  v_user RECORD;
  v_result RECORD;
  v_total_users INTEGER := 0;
  v_total_packages INTEGER := 0;
BEGIN
  -- Find all users with expired packages
  FOR v_user IN
    SELECT id, email
    FROM public.users
    WHERE
      (br15_balance > 0 AND br15_expiry IS NOT NULL AND br15_expiry <= NOW()) OR
      (br30_balance > 0 AND br30_expiry IS NOT NULL AND br30_expiry <= NOW()) OR
      (dp20_balance > 0 AND dp20_expiry IS NOT NULL AND dp20_expiry <= NOW())
  LOOP
    -- Clear expired packages for this user
    SELECT * FROM clear_expired_packages(v_user.id)
    INTO v_result;

    v_total_users := v_total_users + 1;
    v_total_packages := v_total_packages + array_length(v_result.packages_cleared, 1);

    -- Return row for this user
    RETURN QUERY
    SELECT
      v_user.id,
      v_user.email,
      v_result.packages_cleared,
      v_result.br15_cleared,
      v_result.br30_cleared,
      v_result.dp20_cleared;
  END LOOP;

  RAISE NOTICE 'Cleared expired packages for % users (% total packages)', v_total_users, v_total_packages;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION clear_all_expired_packages IS 'Batch process to clear expired packages for all users';

-- =============================================
-- TRIGGER: Auto-clear expired packages on user data access
-- =============================================
CREATE OR REPLACE FUNCTION trigger_clear_expired_packages()
RETURNS TRIGGER AS $$
DECLARE
  v_result RECORD;
BEGIN
  -- Only run on SELECT (when user data is accessed)
  -- Check if any packages are expired
  IF (NEW.br15_balance > 0 AND NEW.br15_expiry IS NOT NULL AND NEW.br15_expiry <= NOW()) OR
     (NEW.br30_balance > 0 AND NEW.br30_expiry IS NOT NULL AND NEW.br30_expiry <= NOW()) OR
     (NEW.dp20_balance > 0 AND NEW.dp20_expiry IS NOT NULL AND NEW.dp20_expiry <= NOW()) THEN

    -- Clear expired packages
    SELECT * FROM clear_expired_packages(NEW.id) INTO v_result;

    -- Return updated row
    SELECT * FROM public.users WHERE id = NEW.id INTO NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on users table (runs BEFORE SELECT queries via view)
-- Note: PostgreSQL doesn't support BEFORE SELECT triggers directly,
-- so we use BEFORE UPDATE trigger as a compromise
DROP TRIGGER IF EXISTS auto_clear_expired_packages_on_update ON public.users;
CREATE TRIGGER auto_clear_expired_packages_on_update
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_clear_expired_packages();

COMMENT ON FUNCTION trigger_clear_expired_packages IS 'Trigger function to auto-clear expired packages when user data is updated';

-- =============================================
-- GRANT PERMISSIONS
-- =============================================
GRANT EXECUTE ON FUNCTION clear_expired_packages TO authenticated;
GRANT EXECUTE ON FUNCTION clear_all_expired_packages TO authenticated;

-- =============================================
-- USAGE EXAMPLES
-- =============================================

-- Example 1: Clear expired packages for a specific user
/*
SELECT * FROM clear_expired_packages('user-uuid-here');
*/

-- Example 2: Clear expired packages for all users (batch process)
/*
SELECT * FROM clear_all_expired_packages();
*/

-- Example 3: Find users with expired packages (before clearing)
/*
SELECT
  id,
  email,
  br15_balance,
  br15_expiry,
  CASE
    WHEN br15_expiry IS NOT NULL AND br15_expiry <= NOW() THEN 'EXPIRED'
    ELSE 'VALID'
  END AS br15_status,
  br30_balance,
  br30_expiry,
  CASE
    WHEN br30_expiry IS NOT NULL AND br30_expiry <= NOW() THEN 'EXPIRED'
    ELSE 'VALID'
  END AS br30_status,
  dp20_balance,
  dp20_expiry,
  CASE
    WHEN dp20_expiry IS NOT NULL AND dp20_expiry <= NOW() THEN 'EXPIRED'
    ELSE 'VALID'
  END AS dp20_status
FROM public.users
WHERE
  (br15_balance > 0 AND br15_expiry IS NOT NULL AND br15_expiry <= NOW()) OR
  (br30_balance > 0 AND br30_expiry IS NOT NULL AND br30_expiry <= NOW()) OR
  (dp20_balance > 0 AND dp20_expiry IS NOT NULL AND dp20_expiry <= NOW());
*/

-- =============================================
-- VERIFICATION
-- =============================================
SELECT
  '✅ Functions created successfully' AS status,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('clear_expired_packages', 'clear_all_expired_packages', 'trigger_clear_expired_packages');

SELECT '🎉 Auto-clear expired packages migration complete!' AS status;
SELECT '⚠️ IMPORTANT: Set up a daily cron job to run clear_all_expired_packages()' AS reminder;
