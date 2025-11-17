# Production Password Reset Setup

## Current Configuration

The app already uses **dynamic URLs** that automatically adapt to production:

```javascript
redirectTo: `${window.location.origin}/#/reset-password`
```

This means:
- **Development**: `http://localhost:5173/#/reset-password`
- **Production**: `https://yourdomain.com/#/reset-password`

## ⚠️ Required: Supabase Dashboard Configuration

You MUST add your production URL to Supabase for password reset to work:

### Step 1: Add Production Site URL

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Update **Site URL** to your production domain:
   ```
   https://yourdomain.com
   ```

### Step 2: Add Production Redirect URL

In the same **URL Configuration** section:

1. Find **Redirect URLs** section
2. Add your production reset password URL:
   ```
   https://yourdomain.com/#/reset-password
   ```

3. Keep the localhost URL for development:
   ```
   http://localhost:5173/#/reset-password
   ```

### Step 3: Verify Email Templates

1. Go to **Authentication** → **Email Templates**
2. Check the **Reset Password** template
3. Verify it uses the correct redirect URL: `{{ .ConfirmationURL }}`

## Testing Production Password Reset

### Test Flow:

1. **Trigger Reset**:
   - Go to `https://yourdomain.com/#/forgot-password`
   - Enter user email
   - Click "Send Reset Link"

2. **Check Email**:
   - User receives email from Supabase
   - Email contains link like: `https://yourdomain.com/#/reset-password#access_token=...`

3. **Reset Password**:
   - Click link in email
   - Should redirect to `https://yourdomain.com/#/reset-password`
   - Enter new password
   - Submit form

4. **Verify**:
   - User should be redirected to login page
   - Login with new password should work

## Troubleshooting

### Issue: Email link redirects to localhost

**Cause**: Site URL in Supabase still set to `http://localhost:5173`

**Fix**: Update Site URL in Supabase dashboard to production domain

### Issue: "Invalid redirect URL" error

**Cause**: Production URL not added to allowed Redirect URLs list

**Fix**: Add `https://yourdomain.com/#/reset-password` to Redirect URLs in Supabase

### Issue: Email not received

**Cause**: Email provider (Resend) not configured or domain not verified

**Fix**: 
1. Check Resend API key is set in Supabase Edge Functions
2. Verify sender domain in Resend dashboard
3. Check email logs in Supabase Dashboard → Logs

## Configuration Summary

| Environment | Site URL | Redirect URL |
|-------------|----------|--------------|
| **Development** | `http://localhost:5173` | `http://localhost:5173/#/reset-password` |
| **Production** | `https://yourdomain.com` | `https://yourdomain.com/#/reset-password` |

## Notes

- The app code is **already production-ready** ✅
- Only **Supabase configuration** needs to be updated
- Both development and production URLs can coexist in Supabase settings
- No code changes needed - `window.location.origin` handles everything automatically

## Deployment Checklist

Before deploying to production:

- [ ] Update Supabase Site URL to production domain
- [ ] Add production redirect URL to Supabase allowed list
- [ ] Verify Resend API key is configured
- [ ] Test password reset flow end-to-end
- [ ] Check email delivery and link formatting
- [ ] Verify password reset page loads correctly on production domain

---

**Pro Tip**: You can use environment variables to explicitly set the redirect URL if needed:

```javascript
const redirectUrl = import.meta.env.VITE_APP_URL 
  ? `${import.meta.env.VITE_APP_URL}/#/reset-password`
  : `${window.location.origin}/#/reset-password`;
```

Then set in `.env.production`:
```
VITE_APP_URL=https://yourdomain.com
```
