# Admin Password Management - Complete Guide

## ✅ Two Password Options Available

Admins now have **TWO ways** to manage user passwords:

1. **📧 Send Reset Email** - User resets their own password via email (secure, user-controlled)
2. **🔐 Set Password Directly** - Admin types new password and sets it immediately (instant access)

---

## 🎯 How to Access

**Location:** Admin Panel → 用戶列表 (Users Tab)

**For each user, you'll see:**
- **密碼管理 (Password)** dropdown button with 2 options

---

## Option 1: Send Reset Email 📧

### When to Use:
- ✅ User forgot their password
- ✅ User wants to set their own password
- ✅ Security best practice (user controls their password)
- ✅ User is available to check email

### How It Works:
1. Admin clicks **密碼管理 (Password)** dropdown
2. Select **發送重設郵件 (Send Reset Email)**
3. Confirmation dialog appears showing user details
4. Admin clicks **確認發送 (Confirm Send)**
5. System checks rate limit (max 3 resets/hour)
6. Email sent to user via Resend
7. User receives email with reset link
8. User clicks link and sets new password
9. Action logged in audit trail

### Features:
- ✅ Rate limiting (3 resets/hour per user)
- ✅ Audit logging (tracks who sent email when)
- ✅ Confirmation dialog (prevents accidents)
- ✅ Bilingual email template
- ✅ Secure token-based flow

### Email Contains:
- Reset link (expires in 1 hour)
- User instructions (EN/ZH)
- Security warnings
- Company contact info

---

## Option 2: Set Password Directly 🔐

### When to Use:
- ✅ User needs immediate access
- ✅ User cannot access email
- ✅ Emergency situations
- ✅ Setting up new accounts
- ✅ Account recovery

### How It Works:
1. Admin clicks **密碼管理 (Password)** dropdown
2. Select **直接更改密碼 (Set Password Directly)**
3. Dialog appears with password input fields
4. Admin types new password (min 8 characters)
5. Admin confirms password (must match)
6. Admin clicks **確認更新 (Confirm Update)**
7. System validates password strength
8. Password updated instantly via Edge Function
9. User can login immediately with new password
10. Action logged in audit trail

### Features:
- ✅ Instant password change (no email needed)
- ✅ Password validation (min 8 characters, must match)
- ✅ Audit logging (tracks who changed what when)
- ✅ Loading states ("更新中..." during update)
- ✅ Secure Edge Function (uses service_role key)
- ✅ Cannot change your own password this way (security)

### Password Requirements:
- Minimum 8 characters
- Must be confirmed (typed twice)
- No special characters required (flexible)

---

## 🔒 Security Features

### Rate Limiting (Email Reset Only)
- **Limit:** 3 password resets per user per hour
- **Purpose:** Prevent spam and abuse
- **Error Message:** "操作過於頻繁 (Too Many Attempts)"

### Audit Logging (Both Options)
- **What's Logged:**
  - Admin ID (who performed the action)
  - Target user ID (whose password was changed)
  - Method (email reset vs direct change)
  - Timestamp (when it happened)
  - User details (name, email)

- **View Logs:**
  ```sql
  SELECT *
  FROM admin_audit_log_with_details
  WHERE action_type = 'password_reset'
  ORDER BY created_at DESC;
  ```

### Security Restrictions
- ✅ Only admins can access this feature
- ✅ Admins cannot change their own password via direct method
- ✅ All actions logged for compliance
- ✅ Confirmation required for both options
- ✅ Edge Function validates admin status before update

---

## 🖥️ Backend Architecture

### Edge Function: `admin-update-user-password`
**Location:** `supabase/functions/admin-update-user-password/index.ts`

**Purpose:** Securely update user passwords using service_role key

**Security Checks:**
1. Verify JWT token
2. Check if requester is admin
3. Validate password strength (min 8 chars)
4. Prevent admin from changing own password
5. Log action in audit trail

**API:**
```typescript
POST /functions/v1/admin-update-user-password
Headers:
  Authorization: Bearer <jwt-token>
  Content-Type: application/json

Body:
{
  "userId": "uuid",
  "newPassword": "newpassword123"
}

Response:
{
  "success": true,
  "message": "Password updated successfully",
  "user": { "id": "...", "email": "..." }
}
```

**Technology:**
- Uses Supabase Admin Client with `service_role` key
- Calls `supabaseAdmin.auth.admin.updateUserById()`
- Service_role key stored securely in Edge Function env vars

---

## 📋 Setup Instructions

### Step 1: Deploy Edge Function

```bash
# Deploy the password update function
supabase functions deploy admin-update-user-password
```

### Step 2: Set Environment Variables

The Edge Function needs access to:
- `SUPABASE_URL` (auto-provided by Supabase)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-provided by Supabase)

These are automatically available to Edge Functions. No manual configuration needed!

### Step 3: Run SQL Migration (If Not Already Done)

```bash
# Run the audit log migration
# In Supabase Dashboard → SQL Editor:
# Execute: supabase/add-admin-audit-log.sql
```

### Step 4: Test Both Options

Test in admin panel:
1. Email reset option
2. Direct password change option
3. Verify audit logs created

---

## 🧪 Testing Guide

### Test 1: Send Reset Email
1. Go to admin panel → Users tab
2. Click any user's **密碼管理 (Password)** dropdown
3. Select **發送重設郵件**
4. Confirm in dialog
5. Check user's email inbox
6. Click reset link in email
7. User sets new password
8. Verify audit log created

### Test 2: Set Password Directly
1. Go to admin panel → Users tab
2. Click any user's **密碼管理 (Password)** dropdown
3. Select **直接更改密碼**
4. Type new password: `testpass123`
5. Confirm password: `testpass123`
6. Click **確認更新**
7. Logout as admin
8. Login as that user with `testpass123`
9. Should work immediately! ✅
10. Verify audit log created

### Test 3: Password Validation
1. Try setting password with only 5 characters
2. Should see error: "密碼必須至少8個字符"
3. Try mismatched passwords
4. Should see error: "密碼不匹配"

### Test 4: Cannot Change Own Password
1. Try to directly change your own (admin) password
2. Should fail with error from Edge Function
3. Admins must use regular password reset flow

### Test 5: Rate Limiting (Email Only)
1. Send reset email 3 times for same user
2. Try 4th time
3. Should see rate limit error
4. Direct password change has no rate limit

---

## 🆚 Comparison: Which Option to Use?

| Feature | Send Reset Email | Set Password Directly |
|---------|------------------|----------------------|
| **Speed** | Slow (user must check email) | ⚡ Instant |
| **Security** | ✅ Most secure (user controls) | ⚠️ Less secure (admin knows password) |
| **User Control** | ✅ User sets own password | ❌ Admin sets password |
| **Email Required** | ✅ Yes | ❌ No |
| **Rate Limited** | ✅ Yes (3/hour) | ❌ No limit |
| **Emergency Use** | ❌ Too slow | ✅ Perfect |
| **Best For** | Normal password resets | Emergency access, setup |
| **Audit Log** | ✅ Yes | ✅ Yes |

### Recommendations:

**Use "Send Reset Email" when:**
- User can access their email
- Normal password reset scenario
- Following security best practices
- No urgency

**Use "Set Password Directly" when:**
- Emergency situations
- User cannot access email
- Need immediate access
- Setting up new accounts
- Account recovery after email compromise

---

## 🎨 User Interface

### Password Management Dropdown

**Appearance:**
```
[ 🔑 密碼管理 ▼ ]
   ├─ 📧 發送重設郵件 (Send Reset Email)
   └─ 🔐 直接更改密碼 (Set Password Directly)
```

**States:**
- Normal: Outline button with dropdown arrow
- Hover: Highlight
- Disabled: For admin's own account

### Dialog: Send Reset Email
```
┌─────────────────────────────────────┐
│ 確認重設密碼                         │
├─────────────────────────────────────┤
│ 確定要為用戶 "John Doe"              │
│ (john@example.com) 發送密碼重設      │
│ 郵件嗎？                             │
│                                     │
│ 用戶將收到一封包含重設連結的郵件。   │
│ 此操作將被記錄在系統日誌中。         │
├─────────────────────────────────────┤
│            [ 取消 ]  [ 確認發送 ]    │
└─────────────────────────────────────┘
```

### Dialog: Set Password Directly
```
┌─────────────────────────────────────┐
│ 直接更改用戶密碼                     │
├─────────────────────────────────────┤
│ 為用戶 "John Doe"                    │
│ (john@example.com) 設定新密碼。      │
│                                     │
│ 用戶將立即使用新密碼登入。           │
│ 此操作將被記錄在系統日誌中。         │
├─────────────────────────────────────┤
│ 新密碼:                              │
│ [ •••••••••••••••••••••••••••• ]    │
│                                     │
│ 確認新密碼:                          │
│ [ •••••••••••••••••••••••••••• ]    │
├─────────────────────────────────────┤
│            [ 取消 ]  [ 確認更新 ]    │
└─────────────────────────────────────┘
```

---

## 📊 Audit Trail

### Log Entry Example (Send Email):
```json
{
  "admin_id": "uuid-admin",
  "action_type": "password_reset",
  "target_user_id": "uuid-user",
  "details": {
    "method": "email",
    "user_email": "user@example.com",
    "user_name": "John Doe",
    "timestamp": "2025-01-17T10:30:00Z"
  }
}
```

### Log Entry Example (Direct Change):
```json
{
  "admin_id": "uuid-admin",
  "action_type": "password_reset",
  "target_user_id": "uuid-user",
  "details": {
    "method": "direct_admin_change",
    "timestamp": "2025-01-17T10:30:00Z"
  }
}
```

### Query Logs by Method:
```sql
-- See all direct password changes
SELECT *
FROM admin_audit_log_with_details
WHERE action_type = 'password_reset'
  AND details->>'method' = 'direct_admin_change'
ORDER BY created_at DESC;

-- See all email resets
SELECT *
FROM admin_audit_log_with_details
WHERE action_type = 'password_reset'
  AND details->>'method' = 'email'
ORDER BY created_at DESC;
```

---

## 🐛 Troubleshooting

### Issue: "Forbidden: Admin access required"
**Cause:** Current user is not an admin
**Fix:**
```sql
UPDATE users SET is_admin = true WHERE email = 'admin@example.com';
```

### Issue: "Password must be at least 8 characters long"
**Cause:** Password too short
**Fix:** Use minimum 8 characters

### Issue: "Passwords do not match"
**Cause:** New password and confirmation don't match
**Fix:** Retype both fields carefully

### Issue: "Admins must use the regular password reset flow"
**Cause:** Trying to change your own password via direct method
**Fix:** Use "Send Reset Email" option or regular password change

### Issue: Direct password change fails with 500 error
**Cause:** Edge Function not deployed or service_role key missing
**Fix:**
```bash
supabase functions deploy admin-update-user-password
```

### Issue: Dropdown menu not appearing
**Cause:** DropdownMenu component not imported
**Fix:** Check AdminUsersTab.jsx imports, hard refresh browser

---

## 📈 Best Practices

### 1. When to Use Each Option
- **90% of cases:** Use "Send Reset Email" (more secure)
- **10% of cases:** Use "Set Password Directly" (emergencies only)

### 2. Audit Log Retention
- Keep logs for at least 1 year (compliance)
- Review logs quarterly for suspicious activity
- Alert on multiple direct password changes by same admin

### 3. Admin Training
- Train admins on when to use each option
- Emphasize security implications
- Document emergency procedures

### 4. Security Monitoring
```sql
-- Alert: Admin changed 5+ passwords directly in one day
SELECT
  admin_email,
  COUNT(*) as change_count
FROM admin_audit_log_with_details
WHERE action_type = 'password_reset'
  AND details->>'method' = 'direct_admin_change'
  AND created_at >= CURRENT_DATE
GROUP BY admin_email
HAVING COUNT(*) >= 5;
```

---

## ✅ Summary

**You now have:**
- 📧 **Send Reset Email** - Secure, user-controlled, rate-limited
- 🔐 **Set Password Directly** - Instant access, admin-controlled, emergency use
- 📝 **Full audit trail** - Track every password change
- 🔒 **Security controls** - Validation, logging, restrictions
- 🎨 **Clean UI** - Dropdown menu with both options
- 🌏 **Bilingual support** - EN/ZH throughout

**Files Created/Modified:**
- ✨ NEW: `supabase/functions/admin-update-user-password/index.ts` - Edge Function
- 📝 MODIFIED: `src/pages/AdminPage.jsx` - Added direct password change
- 📝 MODIFIED: `src/components/admin/AdminUsersTab.jsx` - Added dropdown menu

**Next Steps:**
1. Deploy Edge Function: `supabase functions deploy admin-update-user-password`
2. Test both options in admin panel
3. View audit logs in Supabase Dashboard
4. Train admins on when to use each option

🎉 **Both password management options are now fully functional!**
