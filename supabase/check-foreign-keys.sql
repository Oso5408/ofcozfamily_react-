-- =============================================
-- Check Foreign Key Constraints on Users Table
-- =============================================
-- This shows what tables reference the users table
-- and might prevent deletion
-- =============================================

-- Check all foreign keys pointing TO the users table
SELECT
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule,
  rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'users'
ORDER BY tc.table_name;

-- Check if there are any bookings for the test user
SELECT
  'bookings' as table_name,
  COUNT(*) as related_records,
  user_id
FROM bookings
WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%' OR full_name LIKE '%test%')
GROUP BY user_id;

-- Check if there are any package_history records
SELECT
  'package_history' as table_name,
  COUNT(*) as related_records,
  user_id
FROM package_history
WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%' OR full_name LIKE '%test%')
GROUP BY user_id;

-- Check if there are any token_history records
SELECT
  'token_history' as table_name,
  COUNT(*) as related_records,
  user_id
FROM token_history
WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%' OR full_name LIKE '%test%')
GROUP BY user_id;
