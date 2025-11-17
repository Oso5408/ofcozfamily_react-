# Password Reset Blank Page Fix - HashRouter + Supabase

## 🐛 Problem Summary

When users clicked the password reset link from their email, they encountered a **blank page** instead of the password reset form.

### Root Cause

The issue was a **URL collision between HashRouter and Supabase auth tokens**:

1. **Supabase** sends password reset links with tokens in the URL hash fragment:
   ```
   http://yoursite.com/#access_token=xxx&refresh_token=yyy&type=recovery
   ```

2. **HashRouter** also uses the hash fragment for client-side routing:
   ```
   http://yoursite.com/#/reset-password
   ```

3. **Conflict**: Both systems competing for the `#` fragment resulted in:
   ```
   http://yoursite.com/#access_token=xxx&type=recovery
   ```

   HashRouter tried to route to `/access_token=xxx&type=recovery` → **No matching route = Blank Page**

## ✅ Solution

Created a **dedicated auth callback handler** (`AuthCallbackPage`) that processes Supabase tokens before routing:

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks password reset link in email                     │
│    URL: http://site.com/auth/callback#access_token=xxx&type=... │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. AuthCallbackPage extracts tokens from URL hash               │
│    - Parses access_token, refresh_token, type from hash         │
│    - Calls supabase.auth.setSession() with tokens               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Redirects to appropriate page based on type:                 │
│    - type=recovery → /reset-password (clean URL, no tokens)     │
│    - type=signup → /dashboard                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. ResetPasswordPage verifies session and shows form            │
│    - Checks for active session (no token extraction needed)     │
│    - User can now reset password                                │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Changes Made

### 1. Created `AuthCallbackPage.jsx`
**Purpose**: Handles all Supabase auth callbacks (password reset, OAuth, email confirmation)

**Key Features**:
- Extracts tokens from URL hash (`window.location.hash`)
- Handles different auth types (`recovery`, `signup`, OAuth)
- Creates session via `supabase.auth.setSession()`
- Redirects to appropriate page with clean URL (no tokens)

**Location**: `src/pages/AuthCallbackPage.jsx`

### 2. Updated `ForgotPasswordPage.jsx`
**Change**: Modified redirect URL from:
```javascript
// ❌ Old (caused collision)
const redirectUrl = `${window.location.origin}/#/reset-password`;
```

To:
```javascript
// ✅ New (no hash route)
const redirectUrl = `${window.location.origin}/auth/callback`;
```

### 3. Simplified `ResetPasswordPage.jsx`
**Before**: Complex token extraction logic handling `%23` encoding and double hashes (95+ lines)

**After**: Simple session verification (30 lines)
```javascript
// Just check if user has active session (created by AuthCallbackPage)
const { data: { session } } = await supabase.auth.getSession();
if (session && session.user) {
  setIsValidToken(true);
}
```

### 4. Added Route in `App.jsx`
```javascript
<Route path="/auth/callback" element={<AuthCallbackPage />} />
```

## 📋 Required Supabase Configuration

### ⚠️ IMPORTANT: Update Redirect URLs in Supabase Dashboard

1. Go to **Supabase Dashboard** → Your Project → **Authentication** → **URL Configuration**

2. Add the following redirect URLs:

   **For Local Development:**
   ```
   http://localhost:5173/auth/callback
   ```

   **For Production:**
   ```
   https://yourdomain.com/auth/callback
   ```

3. **Site URL** should be set to:
   - Development: `http://localhost:5173`
   - Production: `https://yourdomain.com`

### How to Configure

#### Via Supabase Dashboard UI:
1. Navigate to **Authentication → URL Configuration**
2. Find **Redirect URLs** section
3. Click **Add URL**
4. Enter: `http://localhost:5173/auth/callback` (for local dev)
5. Click **Save**
6. Repeat for production URL when deploying

#### Via SQL (Alternative):
```sql
-- Check current auth config
SELECT * FROM auth.config;

-- Note: Redirect URLs are typically managed via Dashboard UI
-- Contact Supabase support if you need to manage via SQL
```

## 🧪 Testing the Fix

### Test Steps

1. **Start development server**:
   ```bash
   npm run dev
   ```

2. **Request password reset**:
   - Go to http://localhost:5173/#/forgot-password
   - Enter your email address
   - Click "Send Reset Email"

3. **Check email** (check spam folder too):
   - You should receive an email with a reset link
   - Link format: `http://localhost:5173/auth/callback#access_token=...&type=recovery`

4. **Click the reset link**:
   - Should see "Authenticating..." loading screen briefly
   - Should redirect to `http://localhost:5173/#/reset-password`
   - **NO MORE BLANK PAGE!** ✅

5. **Reset password**:
   - Enter new password
   - Confirm new password
   - Click "Reset Password"
   - Should see success message and redirect to login

### Expected Console Logs

```
🔄 AuthCallback: Processing auth callback...
Full URL: http://localhost:5173/auth/callback#access_token=xxx&type=recovery
Hash: #access_token=xxx&refresh_token=yyy&type=recovery
Extracted params: { hasAccessToken: true, hasRefreshToken: true, type: 'recovery' }
🔑 Password reset detected, setting session...
✅ Recovery session created, redirecting to reset password page...

🔍 Checking for active password reset session...
✅ Valid password reset session found
User ID: [user-uuid]
```

## 🔐 Security Considerations

### Why This Approach is Secure

1. **Tokens never exposed in routes**: Tokens are extracted and consumed immediately by AuthCallbackPage
2. **Clean URLs**: After redirect, URL has no sensitive data (`/#/reset-password` only)
3. **Session-based**: Uses Supabase session management (encrypted, HTTP-only cookies)
4. **One-time use**: Recovery tokens expire after first use
5. **No token in browser history**: `replace: true` prevents back button to token URL

### What the AuthCallbackPage Does

```javascript
// Extract tokens from URL hash (client-side only, never sent to server)
const hashParams = new URLSearchParams(window.location.hash.substring(1));
const accessToken = hashParams.get('access_token');

// Create session (Supabase stores in secure storage)
await supabase.auth.setSession({ access_token: accessToken });

// Redirect with clean URL (tokens removed from address bar)
navigate('/reset-password', { replace: true });
```

## 🚀 Production Deployment

### Before Deploying to Production

1. **Update Supabase redirect URLs**:
   - Add production callback URL: `https://yourdomain.com/auth/callback`

2. **Update email templates** (if customized):
   - Ensure reset link uses: `{{ .ConfirmationURL }}`
   - Supabase will automatically use the configured redirect URL

3. **Test in production environment**:
   - Request password reset with production email
   - Verify redirect works correctly
   - Check SSL/HTTPS is working

### Email Template (Supabase Default)

Supabase automatically uses the configured redirect URL. The email template should contain:

```html
<a href="{{ .ConfirmationURL }}">Reset Password</a>
```

This will expand to: `https://yourdomain.com/auth/callback#access_token=...&type=recovery`

## 📚 Related Documentation

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth/auth-helpers
- **Password Reset Flow**: https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
- **Redirect URLs**: https://supabase.com/docs/guides/auth/redirect-urls
- **React Router HashRouter**: https://reactrouter.com/en/main/router-components/hash-router

## 🎯 Benefits of This Fix

1. ✅ **No more blank page** - Users can actually reset passwords now
2. ✅ **Cleaner code** - Removed 95 lines of complex token extraction logic
3. ✅ **Better separation of concerns** - AuthCallback handles ALL auth flows
4. ✅ **Reusable** - Can handle OAuth, email confirmation, magic links, etc.
5. ✅ **Maintainable** - One place to debug auth callback issues
6. ✅ **Secure** - Tokens processed immediately, never stored in routes

## 🐛 If Issues Persist

### Debugging Steps

1. **Check Supabase redirect URLs**:
   ```bash
   # Should include /auth/callback
   curl https://rlfrwsyqletwegvflqip.supabase.co/auth/v1/settings \
     -H "apikey: YOUR_ANON_KEY"
   ```

2. **Check browser console**:
   - Look for 🔄, 🔑, ✅ emoji logs from AuthCallbackPage
   - Check for any error messages

3. **Check email link**:
   - Copy the full URL from the email
   - Verify it contains `/auth/callback`
   - Verify it has `#access_token=` in the hash

4. **Check network tab**:
   - Look for `auth/v1/token` request (setSession call)
   - Should return 200 OK with session data

5. **Clear browser cache**:
   - Old service workers or cache might interfere
   - Use incognito/private mode for testing

## 🔄 Rollback Plan (If Needed)

If this fix causes issues, you can rollback by:

1. Restore `ForgotPasswordPage.jsx` to use old redirect URL:
   ```javascript
   const redirectUrl = `${window.location.origin}/#/reset-password`;
   ```

2. Remove the AuthCallbackPage route from `App.jsx`

3. Restore old ResetPasswordPage.jsx logic (check git history)

## ✨ Future Improvements

- [ ] Add retry logic for failed session creation
- [ ] Add support for magic link authentication
- [ ] Add support for OAuth providers (Google, GitHub, etc.)
- [ ] Add loading state with progress indicator
- [ ] Add email verification callback handling
- [ ] Add detailed error messages for different failure scenarios

---

**Last Updated**: 2025-11-17
**Fixed By**: Claude Code
**Issue**: Password reset blank page caused by HashRouter URL collision
**Status**: ✅ RESOLVED
