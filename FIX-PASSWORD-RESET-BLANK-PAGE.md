# Fix: Password Reset Blank Page Issue

## Problem

Clicking password reset links results in a **blank page** instead of showing the password reset form.

### Root Cause

**HashRouter + Supabase Auth = URL Collision**

The app uses `HashRouter` which requires URLs in the format `/#/route`. However, Supabase sends authentication tokens in the URL **hash fragment** (`#access_token=...`), causing a double-hash conflict:

1. **Expected URL**: `https://yoursite.com/#/reset-password?access_token=xxx`
2. **Actual URL**: `https://yoursite.com/#/reset-password#access_token=xxx`
3. **Browser encoded**: `https://yoursite.com/#/reset-password%23access_token=xxx`
4. **Result**: Supabase client can't parse the token → blank page

### Technical Details

**How it happens:**

```javascript
// ForgotPasswordPage.jsx:29
const redirectUrl = `${window.location.origin}/#/reset-password`;

// Supabase appends: #access_token=xxx&type=recovery&refresh_token=yyy
// Final URL: /#/reset-password#access_token=xxx
// Browser encodes second #: /%23access_token=xxx
```

**Why it fails:**
- Browsers only support ONE hash fragment per URL
- The second `#` gets URL-encoded to `%23`
- Supabase's automatic token parsing expects `#access_token`, not `%23access_token`
- `ResetPasswordPage.jsx` calls `supabase.auth.getSession()` but no session exists
- Component shows "Verifying link..." indefinitely

## Solution

Updated `ResetPasswordPage.jsx` to **manually extract and verify tokens** from malformed URLs.

### What Changed

**File**: `src/pages/ResetPasswordPage.jsx`

**Before** (lines 28-70):
- Relied on `supabase.auth.getSession()` to automatically detect recovery session
- Didn't handle URL-encoded hash fragments

**After** (lines 28-107):
1. **Extract tokens** from both `#access_token` and `%23access_token` formats
2. **Parse URL manually** to find access_token, refresh_token, and type
3. **Create session** using `supabase.auth.setSession()` with extracted tokens
4. **Fallback** to automatic session detection if manual parsing fails

### Code Flow

```javascript
// 1. Parse URL (handles both formats)
const fullUrl = window.location.href;
const tokenParams = fullUrl.includes('%23access_token')
  ? fullUrl.split('%23')[1]  // Encoded hash
  : hash.split('#').find(part => part.includes('access_token'));  // Normal hash

// 2. Extract tokens
const params = new URLSearchParams(tokenParams);
const accessToken = params.get('access_token');
const refreshToken = params.get('refresh_token');
const type = params.get('type');

// 3. Manually create session
if (accessToken && type === 'recovery') {
  await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken
  });
}

// 4. Validate and show reset form
if (session) {
  setIsValidToken(true);  // User can now reset password
}
```

## Testing

### Test Case 1: Password Reset Flow

1. **Trigger reset**:
   ```
   Navigate to: https://yoursite.com/#/forgot-password
   Enter email: test@example.com
   Click: Send Reset Email
   ```

2. **Check email**:
   - Email should arrive with subject "Reset Password"
   - Click "Reset Password" button

3. **Verify redirect**:
   - URL should be: `https://yoursite.com/#/reset-password%23access_token=xxx`
   - Page should show "Verifying link..." (briefly)
   - Then show password reset form with two password fields

4. **Reset password**:
   - Enter new password (twice)
   - Click "Reset Password"
   - Should redirect to `/login` with success message

### Test Case 2: Invalid/Expired Link

1. **Use old reset link** (already used or >24 hours old)
2. Should show error: "Invalid or expired link"
3. Should redirect to `/forgot-password` page

### Test Case 3: Direct Access

1. **Navigate directly** to: `https://yoursite.com/#/reset-password`
2. Should show error: "No valid session found"
3. Should redirect to `/forgot-password` page

## Console Logs (for debugging)

When the fix works correctly, you should see:

```
🔍 Checking for recovery token in URL...
Full URL: https://yoursite.com/#/reset-password%23access_token=xxx&type=recovery&refresh_token=yyy
URL hash: #/reset-password%23access_token=xxx&type=recovery&refresh_token=yyy
Found %23 encoded token params: access_token=xxx&type=recovery&refresh_token=yyy
Extracted access_token: Found ✅
Token type: recovery
🔑 Recovery token found, creating session...
✅ Recovery session created successfully
```

If it fails, you'll see:

```
🔍 Checking for recovery token in URL...
Full URL: https://yoursite.com/#/reset-password
URL hash: #/reset-password
Extracted access_token: Not found ❌
Token type: null
❌ No valid session found
```

## Alternative Solutions (Future Improvements)

### Option 1: Use PKCE Flow (Recommended)

Supabase supports **PKCE (Proof Key for Code Exchange)** which uses query parameters instead of hash fragments:

**Change in `ForgotPasswordPage.jsx`:**
```javascript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/#/reset-password`,
  // Add PKCE option
  options: {
    emailRedirectTo: `${window.location.origin}/#/reset-password`
  }
});
```

**Result URL**: `/#/reset-password?code=xxx` (no hash collision!)

### Option 2: Switch to BrowserRouter

Use `BrowserRouter` instead of `HashRouter` (requires server configuration):

**Benefits:**
- Clean URLs: `https://yoursite.com/reset-password?access_token=xxx`
- No hash conflicts
- Better SEO

**Drawbacks:**
- Requires server-side URL rewriting (e.g., Netlify `_redirects` or Nginx config)
- All routes must return `index.html`

### Option 3: Use Custom Redirect Domain

Set up a separate redirect domain that doesn't use HashRouter:

**Example:**
- Main app: `https://app.yoursite.com` (HashRouter)
- Auth redirect: `https://auth.yoursite.com/reset` (BrowserRouter)
- After token verification, redirect back to main app with session

## Files Modified

- ✅ `src/pages/ResetPasswordPage.jsx` - Added manual token extraction and session creation

## Files NOT Modified

These files work correctly and don't need changes:
- `src/pages/ForgotPasswordPage.jsx` - Email sending logic is fine
- `src/services/authService.js` - Password update logic is fine
- `PRODUCTION-EMAIL-TEMPLATE.html` - Email template is fine

## Known Limitations

1. **URL stays encoded**: After successful verification, the URL still shows `%23access_token` (cosmetic issue only)
2. **Browser back button**: After resetting password, clicking back shows error (expected behavior)
3. **Multiple clicks**: Clicking the reset link twice will fail the second time (token is single-use)

## Rollback Instructions

If this fix causes issues, revert to previous behavior:

```javascript
// Replace lines 33-107 in ResetPasswordPage.jsx with:
const checkSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (session && session.user) {
      setIsValidToken(true);
    } else {
      navigate('/forgot-password');
    }
  } catch (error) {
    navigate('/forgot-password');
  } finally {
    setIsCheckingToken(false);
  }
};
```

## Support

If users still experience blank page issues:

1. **Check browser console** for error messages
2. **Verify Supabase URL config**:
   - Site URL: `https://www.ofcozfamilybooking.com`
   - Redirect URLs: Include `https://www.ofcozfamilybooking.com/#/reset-password`
3. **Test email delivery**: Check spam folder, verify Resend API key
4. **Try different browser**: Some ad blockers interfere with auth redirects

---

**Status**: ✅ Fixed
**Date**: 2025-11-17
**Affected Routes**: `/#/reset-password`
