# Debug: Delete Button Not Working

## Problem
The 刪除 (Delete) button appears but doesn't actually delete users.

## Debugging Steps

### Step 1: Check Console Logs (MOST IMPORTANT!)

1. **Open browser console:** Press F12, go to Console tab
2. **Refresh page:** Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
3. **Click Delete button** on the "test test" user
4. **Click "確認刪除"** in the confirmation dialog
5. **Look for console messages:**

**Expected logs:**
```
🗑️ handleDeleteUser called with userToDelete: [some-id]
📞 Calling deleteUser function...
🗑️ Attempting to delete user: [some-id]
✅ User profile deleted successfully
📬 deleteUser result: {success: true, warning: "..."}
✅ Delete successful, updating UI
🧹 Cleaning up, setting userToDelete to null
```

**If you see error logs, note what they say!**

### Step 2: Test Database Permission

Run this in Supabase SQL Editor:
```sql
-- File: supabase/test-delete-permission.sql

-- First, check who you are
SELECT
  id,
  email,
  is_admin
FROM public.users
WHERE id = auth.uid();
```

**Expected result:**
- Your email should appear
- `is_admin` should be `true`

**If is_admin is false:** You're not logged in as admin! Run:
```sql
UPDATE public.users
SET is_admin = TRUE
WHERE email = 'your-email@example.com';
```

Then log out and log back in to the app.

### Step 3: Check DELETE Policy Exists

```sql
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'DELETE';
```

**Expected result:**
```
| policyname              | cmd    |
|-------------------------|--------|
| Admins can delete users | DELETE |
```

**If no rows returned:** The policy wasn't created! Re-run:
```sql
-- File: supabase/add-users-delete-policy.sql
```

### Step 4: Test Delete Permission Logic

```sql
-- Test if the policy logic works
SELECT
  u.id,
  u.email,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.users admin
      WHERE admin.id = auth.uid() AND admin.is_admin = TRUE
    ) THEN 'CAN DELETE ✅'
    ELSE 'CANNOT DELETE ❌'
  END as delete_permission
FROM public.users u
WHERE u.email = 'artisanx@duck.com';
```

**Expected result:**
```
| email              | delete_permission |
|--------------------|-------------------|
| artisanx@duck.com  | CAN DELETE ✅     |
```

**If shows "CANNOT DELETE":** Your admin status isn't being recognized. See Step 2.

### Step 5: Check Foreign Key Constraints

Run this to see if there are related records blocking deletion:
```sql
-- File: supabase/check-foreign-keys.sql
```

**If you see many related records:**
The user has bookings, package history, etc. that might prevent deletion.

**Solution:** Ensure foreign keys have `ON DELETE CASCADE` or `ON DELETE SET NULL`

To fix, run:
```sql
-- Example: Make bookings cascade on user delete
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;

ALTER TABLE bookings
ADD CONSTRAINT bookings_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- Repeat for package_history and token_history
```

### Step 6: Try Manual Delete

Try deleting directly in SQL to see the exact error:
```sql
-- Get the user ID first
SELECT id, email, full_name
FROM users
WHERE email = 'artisanx@duck.com';

-- Copy the ID, then try to delete (replace YOUR-USER-ID)
DELETE FROM public.users
WHERE id = 'YOUR-USER-ID'
RETURNING id, email, 'DELETED' as status;
```

**If this works in SQL but not in the app:** It's a frontend issue
**If this fails in SQL:** It's a database/permission issue

## Common Issues & Solutions

### Issue 1: "Permission denied" or "Policy violation"
**Cause:** DELETE policy not created or admin status not set
**Fix:** Re-run `add-users-delete-policy.sql` and ensure `is_admin = true`

### Issue 2: "Foreign key constraint violation"
**Cause:** User has related records (bookings, etc.)
**Fix:** Add CASCADE to foreign keys (see Step 5)

### Issue 3: Console shows "deleteUser function not available"
**Cause:** AuthContext not properly providing deleteUser
**Fix:** Check that you're logged in and the page refreshed

### Issue 4: Nothing happens, no console logs
**Cause:** JavaScript error before reaching handler
**Fix:** Check console for any RED error messages at page load

### Issue 5: Modal doesn't appear or doesn't confirm
**Cause:** AlertDialog state issue
**Fix:** Check that `userToDelete` state is being set correctly

## Quick Test

To quickly test if permissions work, try this simple query:
```sql
-- This should return the test user if permissions are correct
DELETE FROM users
WHERE email = 'artisanx@duck.com'
AND EXISTS (
  SELECT 1 FROM users
  WHERE id = auth.uid() AND is_admin = TRUE
)
RETURNING email, 'Successfully deleted' as message;
```

**If this works:** Database is fine, check frontend
**If this fails:** Database permission issue

## Next Steps

After completing the steps above, report back with:
1. ✅ or ❌ - What you see in browser console when clicking delete
2. ✅ or ❌ - Whether you're logged in as admin (`is_admin = true`)
3. ✅ or ❌ - Whether DELETE policy exists
4. ✅ or ❌ - Whether test delete in SQL works
5. Any error messages you see (red text in console or SQL)

This will help identify exactly where the problem is!
