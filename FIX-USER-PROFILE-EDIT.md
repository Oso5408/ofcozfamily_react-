# Fix: User Profile Edit Not Working

## Problem
When admin tries to edit user profile (姓名/電郵/電話) in the user detail page, the "保存" (Save) button doesn't work and the changes don't save.

## Root Cause
The `users` table is missing the **UPDATE policy** for admins in Row Level Security (RLS).

**Current situation:**
- ✅ Users can view their own profile (SELECT)
- ✅ Admins can view all users (SELECT)
- ✅ Users can register (INSERT via trigger)
- ❌ **MISSING: Admins cannot update user profiles** (UPDATE)

## Solution

### Step 1: Run the SQL Migration

Go to your Supabase dashboard:
1. Open your project
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase/check-and-fix-users-update-policy.sql`
5. Click **Run**

This will:
- Check existing policies on the `users` table
- Create UPDATE policy for admins to edit any user
- Create UPDATE policy for users to edit their own profile
- Verify the policies were created successfully

### Step 2: Verify the Policies

After running the SQL, you should see these policies for the `users` table:

| Policy Name | Command | Description |
|------------|---------|-------------|
| Users can update own profile | UPDATE | Users can edit their own info |
| Admins can update all users | UPDATE | Admins can edit anyone's info |
| (other SELECT/INSERT policies) | SELECT/INSERT | Existing policies |

### Step 3: Test the Feature

1. **Refresh the browser** (hard refresh: Cmd+Shift+R or Ctrl+Shift+R)
2. Go to any user detail page (e.g., `/user/[userId]`)
3. You should see an **"編輯" (Edit)** button in the top right of the "詳情" section
4. Click **"編輯" (Edit)**
5. The form will become editable with input fields for:
   - 姓名 (Name)
   - 電郵 (Email)
   - 電話 (Phone)
6. Make your changes
7. Click **"保存" (Save)**
8. You should see a success message: "更新成功 - 用戶資料已更新"

## What Was Changed

### Backend (Database):
**File:** `supabase/check-and-fix-users-update-policy.sql`

Created two UPDATE policies:
1. **"Admins can update all users"** - Allows admins to edit any user's profile
2. **"Users can update own profile"** - Allows users to edit their own profile

### Frontend (UI):
**File:** `src/pages/UserDetailPage.jsx`

Added functionality:
- **Edit button** - Shows in normal view mode
- **Edit mode** - Transforms fields into editable inputs
- **Save handler** (`handleSaveProfile`) - Updates user data in Supabase
- **Cancel handler** - Discards changes and returns to view mode
- **Permission error detection** - Shows helpful message if SQL wasn't run

## UI States

### Normal View Mode:
```
詳情                    [編輯]
姓名: John Doe
電郵: john@example.com
電話: 1234567890
```

### Edit Mode:
```
詳情
姓名: [input field]
電郵: [input field]
電話: [input field]
[保存]  [取消]
```

## Error Messages

### If SQL Migration Not Run:
```
❌ 權限錯誤
缺少更新權限。請在 Supabase 執行 check-and-fix-users-update-policy.sql
```

### Console Logs:
Open browser console (F12) to see detailed logs:
- `🔄 Updating user profile:` - Shows data being sent
- `✅ Profile update successful:` - Shows response from Supabase
- `❌ Supabase error:` - Shows any errors with details

## Common Issues

### Issue 1: "Permission denied" error
**Cause:** The UPDATE policy wasn't created successfully
**Fix:** Re-run the SQL migration in Supabase

### Issue 2: Edit button not showing
**Cause:** Browser cache or page needs refresh
**Fix:** Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Issue 3: Changes save but don't reflect immediately
**Cause:** Frontend cache
**Fix:** The code automatically refreshes user data after save. If not working, refresh the page.

### Issue 4: Email update fails
**Cause:** Email is tied to Supabase authentication
**Fix:** For now, updating email in the `users` table won't change the auth email. This may require additional Supabase auth API calls.

## Testing Checklist

- [ ] SQL migration runs without errors
- [ ] Policies appear in Supabase dashboard (pg_policies)
- [ ] "編輯" button appears in user detail page
- [ ] Clicking "編輯" shows input fields
- [ ] Input fields are pre-filled with current values
- [ ] Changes can be typed into fields
- [ ] Clicking "保存" shows success toast
- [ ] User info updates in the UI
- [ ] Refreshing the page shows the saved changes
- [ ] Clicking "取消" discards changes
- [ ] Console shows success logs

## Security Notes

✅ **Safe Operations:**
- Admins can update name, email, phone
- Users can update their own profile only
- RLS ensures users can't update other users

⚠️ **Important:**
- Updating email in `users` table doesn't change Supabase auth email
- Consider using Supabase Auth API for email changes
- is_admin and token balances should have additional protection

## Summary

The user profile edit feature has been implemented with:
1. ✅ Backend UPDATE policies for `users` table
2. ✅ Frontend edit UI with inline editing
3. ✅ Permission error detection and helpful messages
4. ✅ Automatic data refresh after save
5. ✅ Console logging for debugging

**After running the SQL migration, admins will be able to edit user profiles successfully!** 🎉
