# Custom SMTP Email Setup Guide

This guide shows you how to set up email notifications using your own SMTP server credentials.

## What You Need

Before starting, make sure you have these SMTP credentials from your email provider:

- **SMTP Host** (e.g., `smtp.example.com`)
- **SMTP Port** (usually `587` for TLS or `465` for SSL)
- **SMTP Username** (usually your email address)
- **SMTP Password** (your email password or app password)
- **Sender Email** (the "from" email address)

---

## Setup Steps

### Step 1: Install Supabase CLI (if not installed)

**macOS:**
```bash
brew install supabase/tap/supabase
```

**Windows (via Scoop):**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Linux / npm:**
```bash
npm install -g supabase
```

### Step 2: Login and Link Project

```bash
# Login to Supabase
supabase login

# Navigate to your project directory
cd /Users/linenjuan/Downloads/horizons-export-39c194f1-5fbb-4e09-860b-f8ae67cf7c2e

# Link to your Supabase project
# Replace YOUR_PROJECT_REF with your actual project ID
supabase link --project-ref YOUR_PROJECT_REF
```

**To find your project ref:**
- Go to your Supabase dashboard
- Look at the URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
- Copy the ID after `/project/`

### Step 3: Set SMTP Environment Variables

Use the credentials provided to you:

```bash
# SMTP server hostname
supabase secrets set SMTP_HOST=smtp.yourserver.com

# SMTP port (587 for TLS, 465 for SSL)
supabase secrets set SMTP_PORT=587

# SMTP username (usually your email)
supabase secrets set SMTP_USER=your-email@example.com

# SMTP password (your email password or app password)
supabase secrets set SMTP_PASS=your-password-here

# Sender email (the "from" address in emails)
supabase secrets set SMTP_FROM_EMAIL=noreply@yourcompany.com

# Sender name (displayed in email client)
supabase secrets set SMTP_FROM_NAME="Ofcoz Family"

# Use SSL/TLS? (true for port 465, false for port 587)
supabase secrets set SMTP_SECURE=false
```

**Example for Gmail:**
```bash
supabase secrets set SMTP_HOST=smtp.gmail.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USER=youremail@gmail.com
supabase secrets set SMTP_PASS=your-app-password
supabase secrets set SMTP_FROM_EMAIL=youremail@gmail.com
supabase secrets set SMTP_FROM_NAME="Ofcoz Family"
supabase secrets set SMTP_SECURE=false
```

**Example for Office 365:**
```bash
supabase secrets set SMTP_HOST=smtp.office365.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USER=youremail@company.com
supabase secrets set SMTP_PASS=your-password
supabase secrets set SMTP_FROM_EMAIL=youremail@company.com
supabase secrets set SMTP_FROM_NAME="Ofcoz Family"
supabase secrets set SMTP_SECURE=false
```

### Step 4: Verify Secrets

Check that all secrets are set correctly:

```bash
supabase secrets list
```

You should see:
```
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
SMTP_FROM_EMAIL
SMTP_FROM_NAME
SMTP_SECURE
```

### Step 5: Deploy Edge Function

Deploy the email function to Supabase:

```bash
supabase functions deploy send-booking-confirmation
```

You should see:
```
Deploying send-booking-confirmation...
✓ Deployed send-booking-confirmation successfully
```

---

## Testing

### Test via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Click **Edge Functions** in the left sidebar
3. Click on **send-booking-confirmation**
4. Click **Invoke** button
5. Use this test payload (replace with your email):

```json
{
  "to": "your-test-email@example.com",
  "language": "zh",
  "booking": {
    "name": "測試用戶",
    "receiptNumber": "TEST-12345",
    "room": {
      "name": "roomA"
    },
    "date": "01/01/2025",
    "startTime": "10:00",
    "endTime": "12:00",
    "specialRequests": "這是測試郵件"
  },
  "roomNameTranslated": "房間 A"
}
```

6. Click **Invoke Function**
7. Check your email inbox

### Test from Application

1. Open your app in browser
2. Open Developer Console (F12)
3. Go to Console tab
4. Run:

```javascript
const { emailService } = await import('/src/services/emailService.js');
await emailService.sendTestEmail('your-email@example.com', 'zh');
```

### Test Full Integration

1. Log in as admin
2. Go to **Admin Panel** → **Bookings**
3. Find a booking with status "待確認" (to_be_confirmed)
4. Click **View Receipt** (👁 icon)
5. Click **Confirm Payment** (確認付款)
6. Check the customer's email inbox for confirmation

---

## Common SMTP Ports

- **Port 587** - TLS/STARTTLS (most common, recommended) → Set `SMTP_SECURE=false`
- **Port 465** - SSL (legacy but still used) → Set `SMTP_SECURE=true`
- **Port 25** - Unencrypted (not recommended, often blocked)

---

## Troubleshooting

### "SMTP not configured" error

**Check:** Make sure all required secrets are set:
```bash
supabase secrets list
```

Required: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`

### "Authentication failed" error

**Possible causes:**
1. Wrong username or password
2. Need to use "App Password" instead of regular password (Gmail, Yahoo)
3. Need to enable "Less Secure Apps" or "SMTP Access" in email settings

**For Gmail:**
- Enable 2-Factor Authentication
- Generate App Password: https://myaccount.google.com/apppasswords
- Use the App Password instead of your regular password

### "Connection refused" or "Timeout" error

**Check:**
1. Is the SMTP host correct?
2. Is the port correct? (587 or 465)
3. Is the server blocking outbound SMTP connections?

**Test connection:**
```bash
# Test if you can reach the SMTP server
telnet smtp.yourserver.com 587
```

### "TLS/SSL error"

**Fix:** Check `SMTP_SECURE` setting:
- Port 587 → `SMTP_SECURE=false` (uses STARTTLS)
- Port 465 → `SMTP_SECURE=true` (uses SSL)

### Email not received

**Check:**
1. Spam/junk folder
2. Is sender email verified/authorized?
3. Check Edge Function logs:
   ```bash
   supabase functions logs send-booking-confirmation
   ```

### View logs in real-time

```bash
supabase functions logs send-booking-confirmation --tail
```

---

## Security Best Practices

✅ **Never commit secrets to git**
✅ **Use App Passwords instead of real passwords** (when possible)
✅ **Use TLS/SSL encryption** (port 587 or 465)
✅ **Rotate passwords regularly**

⚠️ **Don't share SMTP credentials** in code or documentation

---

## SMTP Credential Template

Fill this out with the information provided to you:

```
SMTP Host: _______________________
SMTP Port: _______________________
SMTP Username: ____________________
SMTP Password: ____________________
Sender Email: _____________________
Sender Name: Ofcoz Family
Use SSL/TLS: ______________________ (true/false)
```

Then set them using:

```bash
supabase secrets set SMTP_HOST=...
supabase secrets set SMTP_PORT=...
supabase secrets set SMTP_USER=...
supabase secrets set SMTP_PASS=...
supabase secrets set SMTP_FROM_EMAIL=...
supabase secrets set SMTP_FROM_NAME="Ofcoz Family"
supabase secrets set SMTP_SECURE=false
```

---

## Updating Credentials

If you need to change credentials later:

1. Set new values:
   ```bash
   supabase secrets set SMTP_PASS=new-password
   ```

2. Redeploy function (to restart with new config):
   ```bash
   supabase functions deploy send-booking-confirmation
   ```

---

## Next Steps

Once setup is complete:

1. ✅ Test sending an email
2. ✅ Confirm email arrives in inbox (check spam)
3. ✅ Test the full booking confirmation flow
4. ✅ Monitor logs for any errors
5. ✅ Celebrate! 🎉

---

## Need Help?

Check the logs first:
```bash
supabase functions logs send-booking-confirmation
```

Look for error messages that indicate:
- Authentication failures
- Connection issues
- Invalid configuration

The logs will show exactly what went wrong!
