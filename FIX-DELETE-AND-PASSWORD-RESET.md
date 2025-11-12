# Fix: Delete User & Reset Password Not Working

## Problem
In the admin user management page:
1. **刪除 (Delete)** button doesn't work - users are not deleted
2. **重設密碼 (Reset Password)** button doesn't work properly

## Root Causes

### 1. Delete User Issue
**Missing RLS Policy:** The `users` table has NO DELETE policy for admins.

Without a DELETE policy, admins cannot remove users from the database due to Row Level Security (RLS).

### 2. Reset Password Issue
**Wrong Implementation:** The code was trying to generate a random password locally, but Supabase requires sending a password reset email instead.

## Solutions

### Fix 1: Add DELETE Policy (Required)

**Step 1: Run SQL Migration**

Go to Supabase Dashboard → SQL Editor and run:
```sql
-- Copy entire contents from: supabase/add-users-delete-policy.sql
```

This creates a DELETE policy that allows admins to delete user profiles.

**Step 2: Verify Policy Created**

After running, you should see:
```
| policyname            | cmd    |
|-----------------------|--------|
| Admins can delete users | DELETE |
```

### Fix 2: Password Reset (Already Fixed in Code)

**How It Works Now:**
1. Admin clicks "重設密碼" (Reset Password)
2. System sends a password reset email to the user's email address
3. User receives email with a secure reset link
4. User clicks link and sets a new password

**Success Message:**
```
✅ 郵件已發送
密碼重設郵件已發送到 [user@email.com]
```

## Testing Steps

### Test Delete Functionality

1. **Run the SQL migration first** (`add-users-delete-policy.sql`)
2. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
3. Go to Admin page → 用戶列表
4. Find a test user
5. Click **刪除** (Delete) button
6. Confirm deletion in the dialog
7. Should see success message: "用戶已刪除"
8. User should disappear from the list

**Console Logs to Check:**
```
🗑️ Attempting to delete user: [userId]
✅ User profile deleted successfully
```

**If It Fails:**
- Check console for error: "Missing DELETE permission"
- Error means SQL migration wasn't run successfully
- Re-run the SQL migration

### Test Password Reset

1. Go to Admin page → 用戶列表
2. Find a test user (must have valid email)
3. Click **重設密碼** (Reset Password) button
4. Should see: "✅ 郵件已發送"
5. Check the user's email inbox
6. Email should arrive from Supabase with reset link
7. Click link and user can set new password

**Console Logs to Check:**
```
Password reset email sent to: [email]
```

**If It Fails:**
- Check console for error message
- Ensure user has valid email in database
- Check Supabase email settings (Auth → Email Templates)

## Important Notes

### About Delete User

⚠️ **Limitation:**
The delete function only removes the user profile from the database. It does NOT delete the Supabase authentication user.

**Why?**
- Deleting auth users requires `service_role` key
- This key should NEVER be exposed to the frontend (security risk)
- Auth deletion must be done via:
  - Supabase Dashboard (Authentication → Users → Delete)
  - Backend API with service_role key

**Recommendation:**
For production, you should:
1. Create a backend API endpoint to handle user deletion
2. Backend uses service_role key to delete both auth + profile
3. Frontend calls this API endpoint

**Current Behavior:**
- ✅ User profile deleted from database
- ✅ User removed from UI
- ⚠️ Auth user still exists (shows warning in toast)
- 📝 Manual cleanup: Go to Supabase → Authentication → Users → Delete manually

### About Password Reset

✅ **Secure Method:**
- Uses Supabase's built-in password reset flow
- Sends secure reset link to user's email
- Link expires after set time
- User sets their own new password

❌ **Old (Insecure) Method:**
- Generated random password
- Displayed password in toast (insecure!)
- Would have required admin API (not implemented)

## Error Messages

### Delete User Errors

**Permission Error:**
```
❌ 刪除失敗
Missing DELETE permission. Please run add-users-delete-policy.sql in Supabase
```
**Fix:** Run the SQL migration

**User Not Found:**
```
❌ 刪除失敗
User not found or already deleted
```

**Success with Warning:**
```
✅ 用戶已刪除
User profile deleted. Note: You may need to manually delete the auth user from Supabase dashboard
```

### Password Reset Errors

**Email Not Found:**
```
❌ 重設失敗
找不到用戶電郵
```

**Email Send Failed:**
```
❌ 重設失敗
Unable to send email. Please check Supabase email configuration.
```

**Success:**
```
✅ 郵件已發送
密碼重設郵件已發送到 user@example.com
```

## Files Changed

### Backend (Database):
1. **`supabase/add-users-delete-policy.sql`** - NEW! Adds DELETE policy for admins

### Frontend (Code):
1. **`src/services/userService.js`** - Updated deleteUser() with better error handling
2. **`src/pages/AdminPage.jsx`** - Fixed handlePasswordReset() to use email-based reset
3. **`src/components/admin/AdminUsersTab.jsx`** - Updated handleDeleteUser() to be async and show proper messages

## Verification Checklist

- [ ] SQL migration runs without errors
- [ ] DELETE policy appears in Supabase (pg_policies table)
- [ ] Can click Delete button without errors
- [ ] Console shows "User profile deleted successfully"
- [ ] User disappears from admin list
- [ ] Can click Reset Password button
- [ ] Toast shows "Email sent" message
- [ ] User receives password reset email
- [ ] Reset link works and user can set new password

## Production Recommendations

### For Complete User Deletion:

Create a backend API endpoint (e.g., using Supabase Edge Functions):

```javascript
// Backend API (requires service_role key)
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Server-side only!
)

export async function deleteUserCompletely(userId) {
  // 1. Delete from auth
  await supabaseAdmin.auth.admin.deleteUser(userId)

  // 2. Delete profile (CASCADE will handle related data)
  await supabaseAdmin.from('users').delete().eq('id', userId)

  return { success: true }
}
```

Then update frontend to call this API instead of direct deletion.

## Summary

✅ **Delete User**: Now works after running SQL migration (profile only)
✅ **Reset Password**: Now works using secure email-based reset
⚠️ **Note**: Auth user deletion requires manual cleanup or backend API

After running the SQL migration, both features should work correctly! 🎉
