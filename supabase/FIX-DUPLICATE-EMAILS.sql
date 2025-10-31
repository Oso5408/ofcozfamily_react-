-- =============================================
-- FIX DUPLICATE EMAIL ISSUE
-- =============================================
-- This script fixes the duplicate email problem where
-- multiple users have the same email address
-- =============================================

-- Step 1: Check current duplicate emails
-- Run this first to see which emails are duplicated
SELECT
  email,
  COUNT(*) as count,
  ARRAY_AGG(id::text) as user_ids,
  ARRAY_AGG(full_name) as names
FROM public.users
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Step 2: Clean up duplicate records
-- IMPORTANT: Decide which record to keep!
-- Option A: Keep the OLDEST record (first created)
-- Option B: Keep the one with more data filled in
-- Option C: Manually delete specific ones

-- Example: For userbuy51@gmail.com, keeping the one with display_name 'oso'
-- and deleting 'admin_test'

-- UNCOMMENT AND MODIFY THESE LINES AFTER REVIEWING:
-- DELETE FROM public.users
-- WHERE id = 'b2740cea-f048-451a-a3d0-041ff59708c0'  -- admin_test record
-- AND email = 'userbuy51@gmail.com';

-- OR keep newest, delete oldest:
-- DELETE FROM public.users
-- WHERE id IN (
--   SELECT id FROM public.users
--   WHERE email = 'userbuy51@gmail.com'
--   ORDER BY created_at ASC
--   LIMIT 1  -- Delete oldest
-- );

-- Step 3: Ensure UNIQUE constraint exists on email
-- First, check if constraint exists
SELECT
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND contype = 'u'  -- unique constraint
  AND conkey = (
    SELECT ARRAY[attnum]
    FROM pg_attribute
    WHERE attrelid = 'public.users'::regclass
      AND attname = 'email'
  );

-- If no unique constraint found, add it:
-- IMPORTANT: Can only add this AFTER cleaning up duplicates!
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.users'::regclass
      AND conname = 'users_email_key'
  ) THEN
    -- Only add if no duplicates exist
    IF (SELECT COUNT(*) FROM (
      SELECT email FROM public.users GROUP BY email HAVING COUNT(*) > 1
    ) AS dupes) = 0 THEN
      ALTER TABLE public.users
      ADD CONSTRAINT users_email_key UNIQUE (email);
      RAISE NOTICE 'Added UNIQUE constraint on email';
    ELSE
      RAISE EXCEPTION 'Cannot add UNIQUE constraint: duplicate emails still exist!';
    END IF;
  ELSE
    RAISE NOTICE 'UNIQUE constraint on email already exists';
  END IF;
END $$;

-- Step 4: Verify Supabase auth.users also has unique emails
-- This should always be true in Supabase, but let's check
SELECT
  email,
  COUNT(*) as count
FROM auth.users
GROUP BY email
HAVING COUNT(*) > 1;

-- If duplicates found in auth.users, this is a serious Supabase issue!
-- Contact Supabase support

-- Step 5: Check for orphaned records
-- These are users in public.users without corresponding auth.users
SELECT
  u.id,
  u.email,
  u.full_name,
  'Orphaned - no auth record' as status
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE au.id IS NULL;

-- Step 6: Verify data integrity
-- After cleanup, verify everything is correct
SELECT
  'Total users' as metric,
  COUNT(*) as count
FROM public.users
UNION ALL
SELECT
  'Unique emails' as metric,
  COUNT(DISTINCT email) as count
FROM public.users
UNION ALL
SELECT
  'Users with auth records' as metric,
  COUNT(*) as count
FROM public.users u
INNER JOIN auth.users au ON u.id = au.id;

-- Step 7: Check trigger function
-- Verify the handle_new_user trigger is correct
SELECT
  tgname as trigger_name,
  proname as function_name,
  prosrc as function_code
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'auth.users'::regclass
  AND t.tgname = 'on_auth_user_created';
