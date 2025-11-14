-- =============================================
-- VERIFY ADMIN NOTES BACKEND SETUP
-- =============================================
-- Run this script to verify that admin_notes feature is properly configured

-- 1. Check if admin_notes column exists in bookings table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
  AND column_name = 'admin_notes';

-- Expected: Should return one row showing admin_notes column exists with data_type = 'text'

-- 2. Check RLS policies for bookings table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE
    WHEN policyname ILIKE '%admin%update%' THEN '✅ Admin UPDATE policy found'
    WHEN policyname ILIKE '%users%update%' THEN 'User UPDATE policy found'
    ELSE 'Other policy'
  END as policy_type
FROM pg_policies
WHERE tablename = 'bookings'
  AND cmd = 'UPDATE'
ORDER BY policyname;

-- Expected: Should show "Admins can update any booking" policy

-- 3. Test if you have admin access (replace with your user ID)
-- First, find your user ID:
SELECT
  id,
  email,
  is_admin,
  CASE
    WHEN is_admin = true THEN '✅ You are an admin'
    ELSE '❌ You are not an admin'
  END as admin_status
FROM public.users
WHERE email = auth.email();  -- Your current logged-in email

-- 4. Check sample booking with admin_notes
SELECT
  id,
  user_id,
  room_id,
  status,
  admin_notes,
  CASE
    WHEN admin_notes IS NOT NULL THEN '✅ Has admin notes'
    ELSE 'No admin notes'
  END as notes_status
FROM public.bookings
ORDER BY created_at DESC
LIMIT 5;

-- 5. Summary report
DO $$
DECLARE
  has_column BOOLEAN;
  has_update_policy BOOLEAN;
  admin_count INTEGER;
BEGIN
  -- Check column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name = 'admin_notes'
  ) INTO has_column;

  -- Check admin update policy exists
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bookings'
      AND cmd = 'UPDATE'
      AND policyname ILIKE '%admin%'
  ) INTO has_update_policy;

  -- Count admins
  SELECT COUNT(*) INTO admin_count
  FROM public.users
  WHERE is_admin = true;

  -- Print report
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ADMIN NOTES BACKEND VERIFICATION REPORT';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  IF has_column THEN
    RAISE NOTICE '✅ admin_notes column exists in bookings table';
  ELSE
    RAISE NOTICE '❌ admin_notes column MISSING - Run: supabase/booking-payment-fields.sql';
  END IF;

  IF has_update_policy THEN
    RAISE NOTICE '✅ Admin UPDATE policy exists for bookings';
  ELSE
    RAISE NOTICE '❌ Admin UPDATE policy MISSING - Run: supabase/add-admin-booking-update-policy.sql';
  END IF;

  RAISE NOTICE 'ℹ️  Total admin users in database: %', admin_count;

  IF admin_count = 0 THEN
    RAISE NOTICE '⚠️  WARNING: No admin users found. Grant admin access with:';
    RAISE NOTICE '   UPDATE users SET is_admin = true WHERE email = ''your-email@example.com'';';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';

  IF has_column AND has_update_policy AND admin_count > 0 THEN
    RAISE NOTICE '✅ BACKEND SETUP COMPLETE - Ready to use admin notes!';
  ELSE
    RAISE NOTICE '⚠️  SETUP INCOMPLETE - Follow the messages above';
  END IF;

  RAISE NOTICE '========================================';
END $$;
