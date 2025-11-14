# Gmail SMTP Email Notifications Setup Guide

This guide explains how to configure Gmail SMTP for sending email notifications from your Ofcoz Family booking system.

## Overview

The app sends 3 types of automated emails:
1. **Booking Created** - When user creates a new booking (發送給用戶本身)
2. **Receipt Uploaded** - When user uploads payment receipt (發送給用戶本身)
3. **Payment Confirmed** - When admin confirms booking (待確認 → 已確認) (發送給用戶本身)

## Prerequisites

- A Gmail account (e.g., ofcozfamily@gmail.com)
- Supabase project with Edge Functions enabled
- Access to Supabase Dashboard

---

## Part 1: Generate Gmail App Password

### Step 1: Enable 2-Factor Authentication (Required)

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Sign in with your Gmail account
3. Scroll to "2-Step Verification" section
4. Click "2-Step Verification"
5. Follow the prompts to enable 2FA (you'll need your phone)
6. Complete the setup

### Step 2: Create App Password

1. After enabling 2FA, go back to [Security page](https://myaccount.google.com/security)
2. Scroll to "2-Step Verification" section
3. Click "App passwords" (or search "App passwords" in the page)
4. You may need to re-enter your password
5. Under "Select app", choose **Mail**
6. Under "Select device", choose **Other (Custom name)**
7. Enter a name like "Ofcoz Family Booking System"
8. Click **Generate**
9. **IMPORTANT**: Copy the 16-character password shown (format: `xxxx xxxx xxxx xxxx`)
   - This password will only be shown once!
   - Example: `abcd efgh ijkl mnop`

---

## Part 2: Configure Supabase Edge Functions

### Step 1: Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Project Settings** (gear icon in left sidebar)
4. Click **Edge Functions** in the settings menu

### Step 2: Add Environment Variables (Secrets)

Click **"Add new secret"** for each of the following variables:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `SMTP_HOST` | `smtp.gmail.com` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` | `587` |
| `SMTP_USER` | Your Gmail address | `ofcozfamily@gmail.com` |
| `SMTP_PASS` | 16-char app password (NO spaces) | `abcdefghijklmnop` |
| `SMTP_FROM_EMAIL` | Your Gmail address | `ofcozfamily@gmail.com` |
| `SMTP_FROM_NAME` | Display name | `Ofcoz Family` |
| `SMTP_SECURE` | `false` | `false` |

**IMPORTANT NOTES:**
- For `SMTP_PASS`: **Remove all spaces** from the 16-character password
  - ❌ Wrong: `abcd efgh ijkl mnop`
  - ✅ Correct: `abcdefghijklmnop`
- Use port **587** with `SMTP_SECURE=false` (STARTTLS)
- Do NOT use port 465 (it requires different SSL settings)

### Step 3: Deploy Edge Functions

Run these commands from your project root:

```bash
# Login to Supabase CLI
npx supabase login

# Link your project (first time only)
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy the email functions
npx supabase functions deploy send-booking-created
npx supabase functions deploy send-booking-confirmation
npx supabase functions deploy send-status-notification
npx supabase functions deploy send-package-notification
```

**Find Your Project Reference:**
- Go to Supabase Dashboard → Project Settings → General
- Copy the "Reference ID" (looks like: `rlfrwsyqletwegvflqip`)

---

## Part 3: Test Email Sending

### Option 1: Test via Supabase Dashboard

1. Go to **Edge Functions** in left sidebar
2. Click on `send-booking-created`
3. Click **"Invoke function"** tab
4. Paste this test payload:

```json
{
  "to": "your-test-email@gmail.com",
  "language": "zh",
  "booking": {
    "name": "Test User",
    "receiptNumber": "TEST-12345",
    "room": {
      "name": "Room A"
    },
    "date": "2025-12-01",
    "startTime": "10:00",
    "endTime": "12:00",
    "paymentMethod": "cash",
    "totalCost": 120,
    "specialRequests": "This is a test email"
  },
  "roomNameTranslated": "Room A"
}
```

5. Click **"Run"**
6. Check your email inbox (including spam folder)

### Option 2: Test by Creating a Booking

1. Go to your app: http://localhost:5174
2. Create a test booking
3. Check the browser console for email sending logs:
   - ✅ `Email sent successfully to: user@example.com`
   - ❌ Check error messages if email fails

---

## Part 4: Troubleshooting

### Common Issues

#### 1. Authentication Failed

**Error**: `SMTP authentication failed. Check username and password.`

**Solutions:**
- Verify you're using the 16-character **App Password**, not your Gmail password
- Remove all spaces from the App Password
- Make sure 2FA is enabled on your Gmail account
- Try regenerating a new App Password

#### 2. Connection Timeout

**Error**: `Could not connect to SMTP server. Check host and port.`

**Solutions:**
- Verify `SMTP_HOST` is exactly `smtp.gmail.com`
- Verify `SMTP_PORT` is `587`
- Verify `SMTP_SECURE` is `false` (not `true`)
- Check your firewall/network settings

#### 3. TLS/SSL Error

**Error**: `TLS/SSL error. Check SMTP_SECURE setting.`

**Solutions:**
- Use port `587` with `SMTP_SECURE=false` (STARTTLS)
- Do NOT use port `465` (requires SSL from start)

#### 4. Emails Going to Spam

**Solutions:**
- Ask recipients to mark your emails as "Not Spam"
- Add a custom domain email (advanced, requires DNS configuration)
- Verify your sender reputation with Gmail

#### 5. Daily Sending Limit

Gmail free accounts have a limit of **500 emails per day**.

**Solutions:**
- Upgrade to Google Workspace for 2000 emails/day
- Use a dedicated email service (SendGrid, AWS SES, Mailgun)

#### 6. Missing Required Email Fields

**Error**: `Missing required email fields (from, to, subject, or html)`

**Solutions:**
- Check the Supabase Edge Function logs to see which field is missing
- Verify the email service is passing all required data to the Edge Function
- For booking emails, ensure the booking object has `email`, `name`, and `room` data
- Check that translations are loaded correctly (for email subject and content)

---

## Part 5: Email Templates

### Current Email Types

| Email Type | Trigger | Template File |
|------------|---------|---------------|
| Booking Created | User clicks "預約" button | `send-booking-created/index.ts` |
| Receipt Uploaded | User uploads payment receipt | `send-status-notification/index.ts` |
| Payment Confirmed | Admin changes status to 已確認 | `send-status-notification/index.ts` |
| Package Assigned | Admin adds BR/DP20 package | `send-package-notification/index.ts` |

### Customizing Email Templates

To modify email content:

1. Edit the template file in `supabase/functions/[function-name]/index.ts`
2. Modify the `getEmailHtml()` function
3. Redeploy the function: `npx supabase functions deploy [function-name]`

---

## Part 6: Monitoring & Logs

### Check Email Sending Logs

1. Go to Supabase Dashboard → **Edge Functions**
2. Click on a function (e.g., `send-booking-created`)
3. Click **"Logs"** tab
4. Look for:
   - ✅ `Email sent successfully to: user@example.com`
   - ❌ Error messages with details

### Check App Logs

Open browser console (F12) when creating bookings:
```
📧 Sending booking created email...
✅ Booking created email sent successfully
```

---

## Part 7: Security Best Practices

1. **Never commit App Passwords to Git**
   - Always use environment variables
   - Add `.env` to `.gitignore`

2. **Rotate App Passwords Regularly**
   - Delete old App Passwords in Google Account
   - Generate new ones every 3-6 months

3. **Monitor Suspicious Activity**
   - Check [Google Account Activity](https://myaccount.google.com/notifications)
   - Review recent security events

4. **Use Dedicated Email Account**
   - Don't use your personal Gmail
   - Create a separate account like `noreply@yourdomain.com`

---

## Part 8: Production Deployment

### Checklist Before Going Live

- [ ] Gmail App Password generated and saved securely
- [ ] All SMTP environment variables added to Supabase
- [ ] All Edge Functions deployed successfully
- [ ] Test emails sent and received successfully
- [ ] Email templates reviewed for accuracy (EN/ZH)
- [ ] "Reply-To" address configured correctly
- [ ] Sender name set to "Ofcoz Family"
- [ ] Daily sending limit sufficient for your needs

### Recommended Upgrades

For production use, consider:

1. **Google Workspace** ($6/user/month)
   - 2000 emails/day limit
   - Custom domain email (hello@ofcozfamily.com)
   - Better deliverability
   - Professional appearance

2. **Dedicated Email Service**
   - **SendGrid**: 100 emails/day free, then $20/month
   - **AWS SES**: $0.10 per 1000 emails
   - **Mailgun**: 5000 emails/month free

---

## Quick Reference

### Gmail SMTP Settings

```
Host: smtp.gmail.com
Port: 587
Security: STARTTLS (not SSL)
Username: your-gmail@gmail.com
Password: 16-char app password (no spaces)
```

### Supabase Environment Variables

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ofcozfamily@gmail.com
SMTP_PASS=your16charpassword
SMTP_FROM_EMAIL=ofcozfamily@gmail.com
SMTP_FROM_NAME=Ofcoz Family
SMTP_SECURE=false
```

### Deploy Command

```bash
npx supabase functions deploy send-booking-created
```

---

## Support

If you encounter issues:

1. Check the logs in Supabase Dashboard → Edge Functions → Logs
2. Verify all environment variables are set correctly
3. Test with a simple payload first
4. Check browser console for error messages
5. Ensure Gmail App Password is correct (no spaces!)

For questions about the app: ofcozfamily@gmail.com
