-- =============================================
-- DEBUG: Check User BR Balance
-- =============================================
-- Run this to see what's in your database
-- =============================================

-- 1. Check if BR columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name LIKE '%balance%'
ORDER BY column_name;

-- 2. Check all users and their balances
SELECT
  id,
  email,
  full_name,
  tokens,
  br15_balance,
  br30_balance,
  is_admin,
  created_at
FROM public.users
ORDER BY created_at DESC;

-- 3. Check if package_history table exists and has data
SELECT
  ph.id,
  u.email as user_email,
  ph.package_type,
  ph.br_amount,
  admin.email as assigned_by_email,
  ph.created_at
FROM public.package_history ph
LEFT JOIN public.users u ON ph.user_id = u.id
LEFT JOIN public.users admin ON ph.assigned_by = admin.id
ORDER BY ph.created_at DESC
LIMIT 20;

-- 4. Check recent bookings with BR payments
SELECT
  b.id,
  u.email,
  b.payment_method,
  b.booking_type,
  b.total_cost,
  b.status,
  b.created_at
FROM public.bookings b
LEFT JOIN public.users u ON b.user_id = u.id
WHERE b.payment_method = 'token'
ORDER BY b.created_at DESC
LIMIT 10;

-- 5. Get detailed info for a specific user (replace the email)
-- Uncomment and replace with your test user's email:
/*
SELECT
  id,
  email,
  full_name,
  tokens,
  br15_balance,
  br30_balance,
  is_admin,
  created_at,
  updated_at
FROM public.users
WHERE email = 'YOUR_TEST_USER_EMAIL@example.com';
*/

-- 6. Check RLS policies on users table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
