-- =============================================
-- Token and Package Refund Functions
-- =============================================
-- Creates functions to refund tokens and packages when admin cancels bookings
-- =============================================

-- =============================================
-- FUNCTION: Add tokens to user account
-- =============================================
CREATE OR REPLACE FUNCTION add_tokens(
  p_user_id UUID,
  p_amount INTEGER,
  p_booking_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT 'Token refund'
)
RETURNS VOID AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get current token balance
  SELECT tokens INTO v_current_balance
  FROM public.users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance + p_amount;

  -- Update user's token balance
  UPDATE public.users
  SET tokens = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Log to token_history
  INSERT INTO public.token_history (
    user_id,
    change,
    new_balance,
    transaction_type,
    booking_id,
    notes
  ) VALUES (
    p_user_id,
    p_amount,
    v_new_balance,
    'refund',
    p_booking_id,
    p_description
  );

  RAISE NOTICE 'Added % tokens to user %. New balance: %', p_amount, p_user_id, v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCTION: Refund BR15 package hours
-- =============================================
CREATE OR REPLACE FUNCTION refund_br15_hours(
  p_user_id UUID,
  p_hours INTEGER,
  p_booking_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get current BR15 balance
  SELECT br15_balance INTO v_current_balance
  FROM public.users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance + p_hours;

  -- Update user's BR15 balance
  UPDATE public.users
  SET br15_balance = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Log to package_history
  INSERT INTO public.package_history (
    user_id,
    package_type,
    br_amount,
    notes
  ) VALUES (
    p_user_id,
    'BR15',
    p_hours,
    CONCAT('Refund from cancelled booking #', COALESCE(p_booking_id::TEXT, 'N/A'))
  );

  RAISE NOTICE 'Refunded % BR15 hours to user %. New balance: %', p_hours, p_user_id, v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCTION: Refund BR30 package hours
-- =============================================
CREATE OR REPLACE FUNCTION refund_br30_hours(
  p_user_id UUID,
  p_hours INTEGER,
  p_booking_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get current BR30 balance
  SELECT br30_balance INTO v_current_balance
  FROM public.users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance + p_hours;

  -- Update user's BR30 balance
  UPDATE public.users
  SET br30_balance = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Log to package_history
  INSERT INTO public.package_history (
    user_id,
    package_type,
    br_amount,
    notes
  ) VALUES (
    p_user_id,
    'BR30',
    p_hours,
    CONCAT('Refund from cancelled booking #', COALESCE(p_booking_id::TEXT, 'N/A'))
  );

  RAISE NOTICE 'Refunded % BR30 hours to user %. New balance: %', p_hours, p_user_id, v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCTION: Refund DP20 package days
-- =============================================
CREATE OR REPLACE FUNCTION refund_dp20_days(
  p_user_id UUID,
  p_days INTEGER,
  p_booking_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get current DP20 balance
  SELECT dp20_balance INTO v_current_balance
  FROM public.users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- Calculate new balance (max 20 for DP20)
  v_new_balance := LEAST(v_current_balance + p_days, 20);

  -- Update user's DP20 balance
  UPDATE public.users
  SET dp20_balance = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Log to package_history (if table supports DP20)
  BEGIN
    INSERT INTO public.package_history (
      user_id,
      package_type,
      br_amount,
      notes
    ) VALUES (
      p_user_id,
      'DP20',
      p_days,
      CONCAT('Refund from cancelled booking #', COALESCE(p_booking_id::TEXT, 'N/A'))
    );
  EXCEPTION WHEN OTHERS THEN
    -- Ignore if package_history doesn't support DP20 yet
    RAISE NOTICE 'Could not log to package_history (table may not support DP20)';
  END;

  RAISE NOTICE 'Refunded % DP20 day(s) to user %. New balance: %', p_days, p_user_id, v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Grant EXECUTE permissions
-- =============================================
GRANT EXECUTE ON FUNCTION add_tokens TO authenticated;
GRANT EXECUTE ON FUNCTION refund_br15_hours TO authenticated;
GRANT EXECUTE ON FUNCTION refund_br30_hours TO authenticated;
GRANT EXECUTE ON FUNCTION refund_dp20_days TO authenticated;

-- =============================================
-- VERIFICATION
-- =============================================
SELECT '✅ Token and package refund functions created successfully!' AS status;

-- List all functions
SELECT
  '📋 Function List' AS info,
  routine_name AS function_name,
  routine_type AS type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('add_tokens', 'refund_br15_hours', 'refund_br30_hours', 'refund_dp20_days');
