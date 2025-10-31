-- =============================================
-- Fix Negative Token Balance
-- =============================================
-- Reset negative token balances to 0
-- (caused by the double-deduction bug)
-- =============================================

-- 1. Check current balances
SELECT
  email,
  tokens,
  br15_balance,
  br30_balance
FROM public.users
WHERE tokens < 0
ORDER BY tokens;

-- 2. Reset negative token balances to 0
UPDATE public.users
SET tokens = 0
WHERE tokens < 0;

-- 3. Verify fix
SELECT
  email,
  tokens,
  br15_balance,
  br30_balance
FROM public.users
ORDER BY email;

SELECT 'Negative balances fixed!' as status;
