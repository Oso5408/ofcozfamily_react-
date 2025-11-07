-- =============================================
-- GRANT ADMIN PRIVILEGES TO A USER
-- =============================================
-- This script grants admin privileges to a specific user
-- Replace 'user@example.com' with the actual user's email

-- Method 1: Grant admin by email
UPDATE public.users
SET is_admin = true
WHERE email = 'user@example.com';

-- Method 2: Grant admin by user ID
-- UPDATE public.users
-- SET is_admin = true
-- WHERE id = 'user-uuid-here';

-- Verify the change
SELECT id, email, username, is_admin, created_at
FROM public.users
WHERE is_admin = true
ORDER BY created_at DESC;

-- =============================================
-- REVOKE ADMIN PRIVILEGES (if needed)
-- =============================================
-- Uncomment and modify to remove admin access

-- UPDATE public.users
-- SET is_admin = false
-- WHERE email = 'user@example.com';
