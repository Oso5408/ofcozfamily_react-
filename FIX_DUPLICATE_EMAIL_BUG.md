
# Fix: Duplicate Email Registration Bug

## 🐛 Problem Discovered

Users can register with the same email address multiple times, creating duplicate accounts in the database:

**Example from screenshot:**
- Email: `userbuy51@gmail.com`
- Record 1: User ID `6afd244a...`, Display Name: "oso"
- Record 2: User ID `b2740cea...`, Display Name: "admin_test"

This breaks login functionality and violates data integrity rules.

---

## 🔍 Root Causes

### 1. Missing or Dropped UNIQUE Constraint
The `public.users` table should have a UNIQUE constraint on the `email` column, but:
- It may have been dropped during a migration
- The `add-username-field.sql` migration might have interfered
- Manual database changes could have removed it

### 2. Trigger Function Issues
The `handle_new_user()` trigger doesn't check for existing emails before inserting, allowing duplicates when:
- Multiple signup requests happen simultaneously (race condition)
- Constraint is missing or disabled

### 3. Frontend Missing Duplicate Detection
The registration page doesn't properly show user-friendly errors when Supabase returns "email already exists" errors.

---

## ✅ Complete Fix (3 Steps)

### Step 1: Clean Up Existing Duplicates

**Run this in Supabase SQL Editor:**

```sql
-- First, check which emails are duplicated
SELECT
  email,
  COUNT(*) as count,
  ARRAY_AGG(id::text) as user_ids,
  ARRAY_AGG(full_name || ' (' || COALESCE(username, 'no username') || ')') as names
FROM public.users
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY count DESC;
```

**For each duplicate, decide which record to keep:**

Option A: Keep the oldest record (first created)
```sql
-- Delete newer duplicates for userbuy51@gmail.com
DELETE FROM public.users
WHERE id = 'b2740cea-f048-451a-a3d0-041ff59708c0'  -- admin_test (newer)
AND email = 'userbuy51@gmail.com';
```

Option B: Keep the one with more complete data
```sql
-- Manually decide based on which has more info
DELETE FROM public.users
WHERE id = '[ID_TO_DELETE]'
AND email = '[DUPLICATE_EMAIL]';
```

**⚠️ IMPORTANT:** After deleting duplicate `public.users` records, you should also clean up the corresponding `auth.users` records to prevent orphaned auth accounts:

```sql
-- Check for orphaned auth.users (auth users without public.users record)
SELECT
  au.id,
  au.email,
  au.created_at,
  'Orphaned - should be deleted' as status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
  AND au.email = 'userbuy51@gmail.com';

-- Delete orphaned auth.users (BE CAREFUL - verify IDs first!)
-- UNCOMMENT AFTER VERIFYING:
-- DELETE FROM auth.users
-- WHERE id = '[ORPHANED_AUTH_ID]'
-- AND email = 'userbuy51@gmail.com';
```

### Step 2: Install Prevention System

**Run the prevention script:**

```bash
# File: supabase/PREVENT-DUPLICATE-REGISTRATION.sql
```

This script:
1. ✅ Adds UNIQUE constraint on email
2. ✅ Creates trigger to check for duplicates before insert
3. ✅ Updates `handle_new_user()` to handle edge cases
4. ✅ Adds index for faster lookups

**Run in Supabase SQL Editor:**

Just copy the entire content of `PREVENT-DUPLICATE-REGISTRATION.sql` and execute it.

### Step 3: Verify the Fix

```sql
-- Check constraint exists
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND conname = 'users_email_key';

-- Check triggers are active
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('prevent_duplicate_email', 'on_auth_user_created');

-- Verify no duplicates remain
SELECT email, COUNT(*)
FROM public.users
GROUP BY email
HAVING COUNT(*) > 1;
-- Should return 0 rows
```

---

## 🧪 Test the Fix

### Test 1: Try to Register with Existing Email

1. Go to your website
2. Click "Register"
3. Use an email that's already in the system (e.g., `userbuy51@gmail.com`)
4. **Expected Result:**
   ```
   ❌ Registration failed
   ❌ Error: "This email is already registered"
   ```

### Test 2: Try to Register Twice Quickly (Race Condition)

1. Open two browser tabs side-by-side
2. Start filling registration form in both with same email
3. Submit both at nearly the same time
4. **Expected Result:**
   - ✅ First one succeeds
   - ❌ Second one fails with duplicate error

### Test 3: Register with New Email

1. Use a completely new email
2. Fill in all fields correctly
3. Submit
4. **Expected Result:**
   - ✅ Registration succeeds
   - ✅ Only ONE record created
   - ✅ Auto-login works

---

## 📊 Database Health Check

After applying the fix, run these queries to verify everything is healthy:

```sql
-- 1. Check total users vs unique emails (should match)
SELECT
  'Total users' as metric,
  COUNT(*) as count
FROM public.users
UNION ALL
SELECT
  'Unique emails' as metric,
  COUNT(DISTINCT email) as count
FROM public.users;
-- Both numbers should be THE SAME

-- 2. Check for orphaned public.users (no auth record)
SELECT
  u.id,
  u.email,
  u.full_name,
  'Orphaned - no auth.users' as status
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE au.id IS NULL;
-- Should return 0 rows (or clean them up)

-- 3. Check for orphaned auth.users (no public.users)
SELECT
  au.id,
  au.email,
  au.created_at,
  'Orphaned - no public.users' as status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;
-- Should return 0 rows (or clean them up)

-- 4. Verify email uniqueness
SELECT
  CASE
    WHEN COUNT(DISTINCT email) = COUNT(*) THEN 'PASS ✅'
    ELSE 'FAIL ❌'
  END as email_uniqueness_test
FROM public.users;
```

---

## 🚨 Why This Happened

### The Username Migration Issue

When you ran `add-username-field.sql`:

1. It added a `username` column to existing users
2. It updated the `handle_new_user()` trigger
3. **BUT** it didn't ensure the email UNIQUE constraint was preserved

### Possible Scenarios

**Scenario A: Constraint Was Dropped**
```sql
-- Someone might have run:
ALTER TABLE public.users DROP CONSTRAINT users_email_key;
-- And forgot to recreate it
```

**Scenario B: Manual Database Edits**
- Admin manually created user records
- Bypassed normal registration flow
- No validation checks

**Scenario C: Race Condition**
- Two signup requests at exact same time
- Both checked "email doesn't exist"
- Both inserted before constraint could prevent

---

## 🛡️ Prevention Going Forward

### Database Level (Now Fixed ✅)
1. ✅ UNIQUE constraint on email
2. ✅ Trigger to check duplicates before insert
3. ✅ Index for fast email lookups
4. ✅ Updated handle_new_user() function

### Application Level (Already Working)
1. ✅ Client-side email validation
2. ✅ Supabase SDK handles auth.users uniqueness
3. ✅ Error messages display properly

### Process Level
1. ✅ Always test migrations in development first
2. ✅ Check constraints after running migrations
3. ✅ Keep backups before major changes
4. ✅ Document schema changes

---

## 📝 Migration Checklist

Before running ANY database migration:

- [ ] Backup current database
- [ ] Test migration in development environment
- [ ] Check all constraints exist after migration:
  ```sql
  SELECT conname, pg_get_constraintdef(oid)
  FROM pg_constraint
  WHERE conrelid = 'public.users'::regclass;
  ```
- [ ] Verify no data integrity issues
- [ ] Test registration/login functionality
- [ ] Check for duplicate emails
- [ ] Document changes

---

## 🔧 Manual Cleanup Guide

If you need to manually clean up specific duplicates:

```sql
-- Step 1: Find the duplicate
SELECT * FROM public.users
WHERE email = 'userbuy51@gmail.com'
ORDER BY created_at;

-- Step 2: Choose which to keep
-- Usually keep the OLDEST (first created_at)

-- Step 3: Delete the newer one(s)
DELETE FROM public.users
WHERE id = '[NEWER_USER_ID]'
AND email = 'userbuy51@gmail.com';

-- Step 4: Also delete from auth.users if needed
DELETE FROM auth.users
WHERE id = '[SAME_USER_ID]';
```

---

## ✅ Summary

**Files Created:**
1. `supabase/FIX-DUPLICATE-EMAILS.sql` - Diagnostic queries
2. `supabase/PREVENT-DUPLICATE-REGISTRATION.sql` - Complete fix

**What Gets Fixed:**
- ✅ Duplicate emails blocked
- ✅ UNIQUE constraint restored
- ✅ Race conditions prevented
- ✅ Better error handling
- ✅ Database integrity maintained

**Next Steps:**
1. Clean up existing duplicates manually
2. Run PREVENT-DUPLICATE-REGISTRATION.sql
3. Test registration with existing email
4. Verify constraints are active
5. Check database health

---

## 🆘 If You Need Help

**Check Current Status:**
```sql
-- Are there still duplicates?
SELECT email, COUNT(*) FROM public.users GROUP BY email HAVING COUNT(*) > 1;

-- Is constraint active?
SELECT conname FROM pg_constraint WHERE conrelid = 'public.users'::regclass AND conname = 'users_email_key';
```

**Common Issues:**
1. Can't add UNIQUE constraint → Duplicates still exist, clean them first
2. Trigger not working → Check if it's enabled: `SELECT * FROM pg_trigger WHERE tgname = 'prevent_duplicate_email';`
3. Still getting duplicates → Check if constraint is actually active

