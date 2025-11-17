# Admin Password Reset - Complete Implementation Guide

## ✅ What's Implemented

The admin password reset button now has **full backend support** with enterprise-level features:

1. **✅ Audit Logging** - All password resets are logged in database
2. **✅ Rate Limiting** - Prevents abuse (max 3 resets per user per hour)
3. **✅ Confirmation Dialog** - Admin must confirm before sending email
4. **✅ Better UX** - Loading states, clear error messages, bilingual support

---

## 🗄️ Backend (Database)

### New Table: `admin_audit_log`

**Purpose:** Track all administrative actions for security and compliance

**Schema:**
```sql
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY,
  admin_id UUID NOT NULL,              -- Which admin performed the action
  action_type TEXT NOT NULL,            -- Type: 'password_reset', 'role_change', 'user_delete', etc.
  target_user_id UUID,                  -- Which user was affected
  target_booking_id UUID,               -- Which booking was affected (if applicable)
  target_room_id INTEGER,               -- Which room was affected (if applicable)
  details JSONB,                        -- Additional context
  ip_address TEXT,                      -- Admin's IP address
  user_agent TEXT,                      -- Admin's browser
  created_at TIMESTAMP WITH TIME ZONE   -- When it happened
);
```

**Features:**
- ✅ Row Level Security (RLS) - Only admins can read/write
- ✅ Indexes for fast queries
- ✅ View with user details: `admin_audit_log_with_details`
- ✅ Rate limiting function: `get_recent_password_resets()`
- ✅ Cleanup function: `cleanup_old_audit_logs()` (1 year retention)

### Setup Instructions

**Step 1: Run SQL Migration**

```bash
# Go to Supabase Dashboard → SQL Editor
# Copy and run: supabase/add-admin-audit-log.sql
```

Or via CLI:
```bash
supabase db push
```

**Step 2: Verify Table Created**

In Supabase Dashboard → Database → Tables, you should see:
- `admin_audit_log` table
- `admin_audit_log_with_details` view

---

## 🔧 Frontend (User Experience)

### How It Works Now

**Admin Flow:**
1. Admin clicks "重設密碼" (Reset Password) button
2. **Confirmation dialog appears** showing:
   - User name and email
   - Warning that action will be logged
   - Cancel or Confirm options
3. Admin clicks "確認發送" (Confirm Send)
4. **System checks:**
   - ✅ Rate limit (max 3 resets/hour)
   - ✅ User email exists
5. **System executes:**
   - 📧 Sends reset email to user (via Resend)
   - 📝 Logs action in `admin_audit_log`
   - ✅ Shows success message
6. **User receives email** with password reset link
7. **Admin sees confirmation** that email was sent and action was logged

### User Interface Changes

**Before:**
- Click button → Email sent immediately (no confirmation)
- No visual feedback during sending
- No audit trail

**After:**
- Click button → **Confirmation dialog**
- Loading state: "發送中..." (Sending...)
- Success message: "✅ 郵件已發送... 此操作已記錄在系統日誌中"
- Rate limit protection
- Full audit trail

---

## 🔒 Security Features

### 1. Rate Limiting

**Protection:** Prevents admin spam or abuse

**Limit:** 3 password reset requests per user per hour

**Implementation:**
```javascript
// Backend function (SQL)
get_recent_password_resets(user_id, hours)

// Frontend check (auditService.js)
const rateLimitCheck = await auditService.checkPasswordResetRateLimit(userId);
if (!rateLimitCheck.allowed) {
  // Show error message
}
```

**Error Message:**
- 🇨🇳 "此用戶的密碼重設請求過於頻繁。請稍後再試。（3 次 / 小時）"
- 🇬🇧 "Too many password reset requests for this user. Please try again later. (3 attempts in the last hour)"

### 2. Audit Logging

**What's Logged:**
- Admin ID (who triggered the reset)
- Target user ID (who's password is being reset)
- User email and name
- Timestamp (when it happened)
- IP address (optional, for future enhancement)
- User agent (browser info)

**Log Entry Example:**
```json
{
  "admin_id": "uuid-of-admin",
  "action_type": "password_reset",
  "target_user_id": "uuid-of-user",
  "details": {
    "user_email": "user@example.com",
    "user_name": "John Doe",
    "timestamp": "2025-01-17T10:30:00Z"
  },
  "created_at": "2025-01-17T10:30:00Z"
}
```

### 3. Confirmation Dialog

**Prevents:**
- Accidental clicks
- Unauthorized password resets
- Confusion about which user is being reset

**Shows:**
- User's full name
- User's email address
- Warning about logging
- Clear confirm/cancel options

---

## 📊 Viewing Audit Logs

### Method 1: Supabase Dashboard

**Steps:**
1. Go to Supabase Dashboard → Database → Tables
2. Select `admin_audit_log` or `admin_audit_log_with_details` (view)
3. Click "View Data"
4. Filter by:
   - `action_type = 'password_reset'`
   - `admin_id = <your-admin-id>`
   - `created_at` (date range)

### Method 2: SQL Query

**Get all password resets today:**
```sql
SELECT
  admin_email,
  target_user_email,
  created_at
FROM admin_audit_log_with_details
WHERE action_type = 'password_reset'
  AND created_at >= CURRENT_DATE
ORDER BY created_at DESC;
```

**Get password resets for a specific user:**
```sql
SELECT *
FROM admin_audit_log_with_details
WHERE action_type = 'password_reset'
  AND target_user_email = 'user@example.com'
ORDER BY created_at DESC;
```

**Check rate limit for a user:**
```sql
SELECT get_recent_password_resets('<user-uuid>', 1);
-- Returns count of resets in last 1 hour
```

### Method 3: Via auditService (Future Feature)

You can create an admin dashboard tab to view audit logs:

```javascript
import { auditService } from '@/services/auditService';

// Get all audit logs
const { logs } = await auditService.getAuditLogs({ limit: 100 });

// Get password reset logs only
const { logs } = await auditService.getAuditLogs({
  actionType: 'password_reset',
  limit: 50
});

// Get logs for a specific user
const { logs } = await auditService.getUserAuditLogs(userId);

// Get recent logs (last 24 hours)
const { logs } = await auditService.getRecentAuditLogs();
```

---

## 🧪 Testing Guide

### Test 1: Normal Password Reset

**Steps:**
1. Login as admin
2. Go to admin panel → 用戶列表 (Users tab)
3. Find a test user
4. Click "重設密碼" (Reset Password) button
5. Verify confirmation dialog appears with correct user details
6. Click "確認發送" (Confirm Send)
7. Wait for success message: "✅ 郵件已發送"
8. Check user's email inbox for reset email
9. Verify audit log created in database

**Expected Results:**
- ✅ Confirmation dialog shows correct user name/email
- ✅ Email sent successfully
- ✅ Success toast message appears
- ✅ Email arrives in user's inbox (check spam)
- ✅ Audit log entry created in `admin_audit_log` table

### Test 2: Rate Limiting

**Steps:**
1. Reset same user's password 3 times quickly
2. Try to reset 4th time
3. Should see rate limit error

**Expected Results:**
- ✅ First 3 resets succeed
- ❌ 4th reset fails with error: "操作過於頻繁" (Too Many Attempts)
- ✅ Error shows count: "（3 次 / 小時）"
- ✅ Can reset again after 1 hour

### Test 3: Cancel Confirmation

**Steps:**
1. Click "重設密碼" button
2. Confirmation dialog appears
3. Click "取消" (Cancel)

**Expected Results:**
- ✅ Dialog closes
- ✅ No email sent
- ✅ No audit log created
- ✅ No error or success message

### Test 4: Loading State

**Steps:**
1. Click "重設密碼" button
2. Confirmation dialog appears
3. Click "確認發送"
4. Observe button text

**Expected Results:**
- ✅ Button changes to "發送中..." (Sending...)
- ✅ Button disabled during sending
- ✅ Cannot click Cancel during sending
- ✅ After success, dialog closes automatically

### Test 5: User Not Found Error

**Steps:**
1. Manually trigger reset for non-existent user (via browser console)
2. Should see error message

**Expected Results:**
- ❌ Error: "找不到用戶電郵" (User email not found)
- ✅ No email sent
- ✅ No audit log created

---

## 🔧 Configuration

### Adjust Rate Limit

**Default:** 3 resets per hour

**To change:** Edit `AdminPage.jsx:173`

```javascript
// Change from 3 to 5
const rateLimitCheck = await auditService.checkPasswordResetRateLimit(
  userToResetPassword,
  5  // <-- Change this number
);
```

### Adjust Audit Log Retention

**Default:** 1 year (365 days)

**To clean up old logs manually:**
```sql
-- Delete logs older than 365 days
SELECT cleanup_old_audit_logs(365);

-- Delete logs older than 90 days
SELECT cleanup_old_audit_logs(90);
```

**To set up automatic cleanup (requires pg_cron):**
```sql
-- Run cleanup monthly at midnight
SELECT cron.schedule(
  'cleanup-old-audit-logs',
  '0 0 1 * *',  -- 1st of every month at midnight
  'SELECT cleanup_old_audit_logs(365);'
);
```

---

## 📋 Files Changed/Created

### Backend (Database)
- ✨ **NEW:** `supabase/add-admin-audit-log.sql` - Database schema + functions

### Frontend (Services)
- ✨ **NEW:** `src/services/auditService.js` - Audit logging service

### Frontend (Pages)
- 📝 **MODIFIED:** `src/pages/AdminPage.jsx`
  - Added import for `auditService`
  - Added import for `AlertDialog`
  - Added state: `userToResetPassword`, `isResettingPassword`
  - Modified: `handlePasswordReset()` - Now shows dialog
  - Added: `confirmPasswordReset()` - Executes reset with checks
  - Added: `<AlertDialog>` component - Confirmation UI

---

## 🎯 Benefits

### For Security:
- ✅ **Audit trail** - Know who reset what and when
- ✅ **Rate limiting** - Prevent abuse
- ✅ **Confirmation** - Prevent accidents
- ✅ **Logging** - Compliance ready

### For User Experience:
- ✅ **Clear feedback** - Know what's happening
- ✅ **Better errors** - Understand why it failed
- ✅ **Loading states** - Visual feedback
- ✅ **Bilingual** - Full EN/ZH support

### For Admins:
- ✅ **Confidence** - Confirm before sending
- ✅ **Transparency** - See all logs
- ✅ **Protection** - Can't spam users
- ✅ **Accountability** - All actions tracked

---

## 🐛 Troubleshooting

### Issue: "Missing DELETE permission" (audit logs)

**Cause:** RLS policies not created

**Fix:**
1. Run `supabase/add-admin-audit-log.sql` again
2. Verify policies exist in Supabase Dashboard

### Issue: Rate limit not working

**Cause:** Function not created or RPC call failing

**Fix:**
1. Check browser console for errors
2. Verify `get_recent_password_resets()` function exists
3. Test function directly in SQL Editor:
   ```sql
   SELECT get_recent_password_resets('<user-uuid>', 1);
   ```

### Issue: Audit logs not created

**Cause:** RLS policy blocking inserts

**Fix:**
1. Verify current user is admin: `SELECT is_admin FROM users WHERE id = auth.uid();`
2. Check admin_audit_log policies in Supabase Dashboard
3. Look for errors in browser console

### Issue: Confirmation dialog not appearing

**Cause:** State not updating or component import missing

**Fix:**
1. Verify `AlertDialog` import exists in `AdminPage.jsx`
2. Check browser console for errors
3. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

---

## 📈 Future Enhancements (Optional)

1. **Admin Notifications**
   - Send email to admin after password reset
   - Include user details and timestamp

2. **IP Address Logging**
   - Capture admin's IP address
   - Detect unusual locations

3. **Audit Dashboard Tab**
   - Visual interface to view logs
   - Filter by action type, date, admin
   - Export to CSV

4. **Temporary Password Option**
   - Admin sets temporary password
   - User must change on first login
   - More secure than email reset

5. **Multi-Admin Approval**
   - Require 2 admins to approve sensitive actions
   - Prevents rogue admin attacks

---

## ✅ Summary

**What you got:**
- 🗄️ Backend audit logging system (SQL table + functions)
- 🔒 Rate limiting (3 resets/hour)
- 💬 Confirmation dialog with user details
- 📝 Full audit trail for compliance
- 🌏 Bilingual support (EN/ZH)
- ✅ Better error handling and UX

**Next steps:**
1. Run SQL migration: `supabase/add-admin-audit-log.sql`
2. Test password reset flow
3. View audit logs in Supabase Dashboard
4. Optionally: Build audit dashboard tab

🎉 **The admin password reset button is now fully functional with enterprise-level backend support!**
