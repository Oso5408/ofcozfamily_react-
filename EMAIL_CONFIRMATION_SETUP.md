# Email Confirmation Setup Guide

This guide will help you implement email confirmation for user registration.

## Step 1: Enable Email Confirmation in Supabase

### Option A: For Development/Testing (Disable Confirmation)
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers** → **Email**
3. **Disable** "Confirm email" toggle
4. Click **Save**

**Result:** Users can register and login immediately without email verification.

### Option B: For Production (Enable Confirmation)
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers** → **Email**
3. **Enable** "Confirm email" toggle
4. Set "Confirm email" to **enabled**
5. Click **Save**

**Result:** Users must verify their email before they can login.

## Step 2: Configure Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Click on **Confirm signup**
3. Customize the template:

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your email address:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>

<p>Welcome to Ofcoz Family! 🐱</p>
```

4. Available variables:
   - `{{ .ConfirmationURL }}` - The confirmation link
   - `{{ .Token }}` - The confirmation token
   - `{{ .Email }}` - User's email
   - `{{ .SiteURL }}` - Your site URL

## Step 3: Configure Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Add your redirect URLs:
   - **Site URL**: `http://localhost:5173` (development)
   - **Redirect URLs**:
     - `http://localhost:5173/#/auth/confirm`
     - `https://yourdomain.com/#/auth/confirm` (production)

## Step 4: Email Provider Setup

### Option A: Use Supabase Email (Limited)
- Default: Supabase sends emails
- **Limitation**: 3 emails per hour on free tier
- Good for testing

### Option B: Custom SMTP (Recommended for Production)

1. Go to **Settings** → **Auth** → **SMTP Settings**
2. Configure your email provider:

**Using Gmail:**
```
Host: smtp.gmail.com
Port: 587
Username: your-email@gmail.com
Password: your-app-password (not regular password!)
Sender email: your-email@gmail.com
Sender name: Ofcoz Family
```

**Using SendGrid:**
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: your-sendgrid-api-key
Sender email: noreply@yourdomain.com
Sender name: Ofcoz Family
```

**Using AWS SES:**
```
Host: email-smtp.region.amazonaws.com
Port: 587
Username: your-smtp-username
Password: your-smtp-password
Sender email: noreply@yourdomain.com
Sender name: Ofcoz Family
```

3. Click **Save**

## Step 5: Test Email Delivery

1. Go to **Authentication** → **Users**
2. Click **Invite user**
3. Enter a test email
4. Check if email is received

**Common Issues:**
- Check spam folder
- Verify SMTP credentials
- Check sender email is verified (for AWS SES, Gmail)
- Review email logs in Supabase dashboard

## Step 6: App Implementation

The app now includes:
- ✅ Email confirmation handler page (`/auth/confirm`)
- ✅ "Check your email" message after registration
- ✅ Resend confirmation email button
- ✅ Email verification status in dashboard
- ✅ Bilingual support (EN/ZH)

## User Flow with Email Confirmation

### When Email Confirmation is ENABLED:

1. **User Registers**
   - Fills registration form
   - Clicks "Register"
   - Sees "Check your email" message
   - Cannot login yet

2. **User Checks Email**
   - Receives confirmation email
   - Clicks confirmation link
   - Redirected to app with success message
   - Can now login

3. **If Email Not Received**
   - User can click "Resend confirmation email"
   - New email sent
   - Check spam folder

### When Email Confirmation is DISABLED:

1. **User Registers**
   - Fills registration form
   - Clicks "Register"
   - Automatically logged in
   - Redirected to dashboard

## Testing Guide

### Test 1: Registration with Confirmation Enabled
1. Enable email confirmation in Supabase
2. Register new user
3. Should see: "Please check your email to confirm your account"
4. Check email inbox
5. Click confirmation link
6. Should redirect to app with success message
7. Login with credentials
8. Should work

### Test 2: Registration with Confirmation Disabled
1. Disable email confirmation in Supabase
2. Register new user
3. Should auto-login and redirect to dashboard
4. No email sent

### Test 3: Resend Confirmation Email
1. Register user (with confirmation enabled)
2. Don't click email link
3. Go to login page
4. Try to login → Should show "Email not confirmed"
5. Click "Resend confirmation email"
6. Check inbox for new email
7. Click link and confirm

## Troubleshooting

### Issue: Emails Not Being Sent

**Solution:**
1. Check Supabase logs: **Logs** → **Auth Logs**
2. Verify SMTP settings are correct
3. Check email provider status
4. Ensure sender email is verified
5. Check rate limits (3/hour on free tier)

### Issue: Confirmation Link Doesn't Work

**Solution:**
1. Check redirect URLs in Supabase settings
2. Verify Site URL matches your app URL
3. Check if link has expired (links expire after 24 hours)
4. Check browser console for errors

### Issue: User Stuck After Confirmation

**Solution:**
1. User should login manually after email confirmation
2. Check that auto-login after confirmation is working
3. Verify user status in Supabase → Authentication → Users

### Issue: Wrong Language in Email

**Solution:**
1. Customize email template to detect user language
2. Or create separate templates for each language
3. Store user language preference in user metadata

## Security Best Practices

1. ✅ **Always enable email confirmation in production**
2. ✅ **Use custom SMTP provider for reliable delivery**
3. ✅ **Set appropriate rate limits**
4. ✅ **Monitor email logs for abuse**
5. ✅ **Use verified sender domains**
6. ✅ **Enable email change confirmation**
7. ✅ **Set confirmation link expiry (default 24 hours)**

## Production Checklist

Before going live:

- [ ] Email confirmation enabled in Supabase
- [ ] SMTP provider configured (not using Supabase default)
- [ ] Email templates customized with branding
- [ ] Redirect URLs configured for production domain
- [ ] Sender email verified with email provider
- [ ] Rate limiting configured
- [ ] Email templates tested in both languages
- [ ] Spam folder checked
- [ ] Confirmation flow tested end-to-end
- [ ] Resend email feature tested
- [ ] Email logs monitored

## Next Steps

After email confirmation:
1. Add password reset via email
2. Add email change confirmation
3. Add magic link authentication
4. Add email preferences (opt-in/opt-out)
5. Add email notifications for bookings

---

**Status:** ✅ Email confirmation system ready to configure
**Files Created:**
- `/src/pages/EmailConfirmPage.jsx`
- `/src/components/ResendConfirmationEmail.jsx`
- `/EMAIL_CONFIRMATION_SETUP.md`
