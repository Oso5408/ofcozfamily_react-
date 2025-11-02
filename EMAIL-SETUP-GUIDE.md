# Email Notification Setup Guide

This guide will walk you through setting up email notifications for booking confirmations using Supabase Edge Functions and SMTP2GO.

## Overview

When an admin changes a booking status from "待確認" (to_be_confirmed) to "已確認" (confirmed), the system will automatically send a confirmation email to the customer in their preferred language (English or Chinese).

## Prerequisites

1. Supabase account with your project set up
2. Supabase CLI installed ([Install Guide](https://supabase.com/docs/guides/cli/getting-started))
3. SMTP2GO account (free tier available) or another SMTP service

---

## Step 1: Set Up SMTP2GO Account

### 1.1 Create SMTP2GO Account

1. Go to [SMTP2GO](https://www.smtp2go.com/) and sign up for a free account
2. Verify your email address
3. Log in to your SMTP2GO dashboard

### 1.2 Get API Key

1. In SMTP2GO dashboard, go to **Settings** → **API Keys**
2. Click **Create New API Key**
3. Give it a name like "Ofcoz Family Booking Notifications"
4. Select permissions: **Send Email**
5. Click **Create** and copy the API key (you won't be able to see it again!)
6. Save this API key securely - you'll need it for Step 3

### 1.3 Set Sender Email

1. Go to **Settings** → **Sender Domains**
2. Click **Add Sender**
3. Enter your email address (e.g., `noreply@yourdomain.com` or `ofcozfamily@gmail.com`)
4. Verify the email by clicking the link sent to that address
5. Wait for approval (usually instant for Gmail addresses)

**Note:** If you don't have a custom domain, you can use a Gmail address for testing, but for production, it's recommended to use a custom domain.

---

## Step 2: Install Supabase CLI and Deploy Edge Function

### 2.1 Install Supabase CLI

**On macOS:**
```bash
brew install supabase/tap/supabase
```

**On Windows (via Scoop):**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**On Linux:**
```bash
npm install -g supabase
```

### 2.2 Login to Supabase CLI

```bash
supabase login
```

This will open a browser window to authenticate. Follow the prompts.

### 2.3 Link Your Project

Navigate to your project directory:

```bash
cd /path/to/your/project
```

Link to your Supabase project:

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

**To find your project ref:**
1. Go to your Supabase project dashboard
2. Look at the URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
3. Copy the `YOUR_PROJECT_REF` part

### 2.4 Deploy the Edge Function

Deploy the email notification edge function:

```bash
supabase functions deploy send-booking-confirmation
```

You should see output like:
```
Deploying send-booking-confirmation (project ref: xxxxx)
Bundled send-booking-confirmation in 234ms
Deployed send-booking-confirmation in 1.2s
```

---

## Step 3: Configure Environment Variables in Supabase

### 3.1 Set Secret Environment Variables

Set the SMTP API key in Supabase (replace with your actual API key from Step 1.2):

```bash
supabase secrets set SMTP_API_KEY=your-smtp2go-api-key-here
```

Set the sender email (use the verified email from Step 1.3):

```bash
supabase secrets set SMTP_FROM_EMAIL=noreply@yourdomain.com
supabase secrets set SMTP_FROM_NAME="Ofcoz Family"
```

### 3.2 Verify Secrets

List your secrets to verify they're set:

```bash
supabase secrets list
```

You should see:
```
SMTP_API_KEY
SMTP_FROM_EMAIL
SMTP_FROM_NAME
```

**Note:** The actual values are hidden for security.

---

## Step 4: Test the Email Function

### 4.1 Test via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** in the left sidebar
3. Click on **send-booking-confirmation**
4. Click the **Invoke** button
5. Use this test payload (replace `your-email@example.com` with your email):

```json
{
  "to": "your-email@example.com",
  "language": "zh",
  "booking": {
    "name": "Test User",
    "receiptNumber": "TEST-12345",
    "room": {
      "name": "roomA"
    },
    "date": "01/01/2025",
    "startTime": "10:00",
    "endTime": "12:00",
    "specialRequests": "This is a test email"
  },
  "roomNameTranslated": "Room A"
}
```

6. Click **Invoke Function**
7. Check your email inbox for the confirmation email

### 4.2 Test from the Application

You can also test from the browser console:

1. Open your application in the browser
2. Open Developer Tools (F12)
3. Go to the Console tab
4. Run this code (replace with your email):

```javascript
const { emailService } = await import('./src/services/emailService.js');
await emailService.sendTestEmail('your-email@example.com', 'zh');
```

---

## Step 5: Verify the Integration

### 5.1 Test the Full Flow

1. Log in as an admin to your application
2. Go to the Admin Panel → Bookings
3. Find a booking with status "待確認" (to_be_confirmed)
4. Click on the "View Receipt" button (👁)
5. Click "Confirm Payment" (確認付款)
6. The booking should be confirmed AND an email should be sent to the customer

### 5.2 Check Logs

To debug issues, check the Edge Function logs:

```bash
supabase functions logs send-booking-confirmation
```

Or in the Supabase dashboard:
1. Go to **Edge Functions**
2. Click on **send-booking-confirmation**
3. Click on **Logs** tab

---

## Troubleshooting

### Issue: "SMTP_API_KEY not configured"

**Solution:** Make sure you've set the secret correctly:
```bash
supabase secrets set SMTP_API_KEY=your-actual-api-key
```

### Issue: "Email sending failed: Invalid API key"

**Solution:** Double-check your SMTP2GO API key is correct and has the "Send Email" permission.

### Issue: "Sender email not verified"

**Solution:**
1. Go to SMTP2GO dashboard → Settings → Sender Domains
2. Make sure your sender email is verified (green checkmark)
3. If not verified, click "Resend Verification Email"

### Issue: Edge function not found

**Solution:** Make sure the function is deployed:
```bash
supabase functions list
```

If not listed, deploy again:
```bash
supabase functions deploy send-booking-confirmation
```

### Issue: CORS error when calling from browser

**Solution:** The edge function already has CORS headers configured. Make sure you're calling it via the Supabase client:
```javascript
const { data, error } = await supabase.functions.invoke('send-booking-confirmation', { body: {...} });
```

### Issue: Email not received

**Solutions:**
1. Check spam/junk folder
2. Check SMTP2GO dashboard for delivery logs (Dashboard → Reporting → Sent Emails)
3. Make sure the customer's email address is valid
4. Check Edge Function logs for errors:
   ```bash
   supabase functions logs send-booking-confirmation
   ```

---

## Alternative SMTP Services

If you prefer not to use SMTP2GO, you can modify the code to use other services:

### Option 1: Gmail SMTP

1. Create an App Password in your Google Account
2. Update `supabase/functions/send-booking-confirmation/smtp-client.ts`
3. Replace SMTP2GO API call with Gmail SMTP connection

### Option 2: SendGrid

1. Sign up for SendGrid
2. Get API key
3. Update the `sendEmail` function to use SendGrid's API:
   ```typescript
   const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${SMTP_API_KEY}`,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       personalizations: [{ to: [{ email: options.to }] }],
       from: { email: SMTP_FROM_EMAIL, name: SMTP_FROM_NAME },
       subject: options.subject,
       content: [{ type: 'text/html', value: options.html }],
     }),
   });
   ```

### Option 3: Resend

1. Sign up for Resend
2. Get API key
3. Update the `sendEmail` function to use Resend's API:
   ```typescript
   const response = await fetch('https://api.resend.com/emails', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${SMTP_API_KEY}`,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       from: `${SMTP_FROM_NAME} <${SMTP_FROM_EMAIL}>`,
       to: options.to,
       subject: options.subject,
       html: options.html,
     }),
   });
   ```

---

## Email Template Customization

### Customize Email Content

To customize the email templates, edit:
- **Chinese template**: `supabase/functions/send-booking-confirmation/index.ts` (lines 35-90)
- **English template**: `supabase/functions/send-booking-confirmation/index.ts` (lines 92-147)

After editing, redeploy:
```bash
supabase functions deploy send-booking-confirmation
```

### Customize Email Translations

To customize the email text translations, edit:
- **Chinese**: `src/data/translations/zh/email.js`
- **English**: `src/data/translations/en/email.js`

---

## Production Checklist

Before going live, make sure:

- [ ] SMTP service is configured with a verified sender email
- [ ] Edge function is deployed and tested
- [ ] Environment variables are set correctly
- [ ] Test emails are received successfully
- [ ] Email templates display correctly in different email clients (Gmail, Outlook, etc.)
- [ ] Both English and Chinese emails are tested
- [ ] Error handling is working (check logs when email fails)
- [ ] Customer support email (ofcozfamily@gmail.com) is monitored

---

## Cost Considerations

### SMTP2GO Pricing

- **Free tier**: 1,000 emails/month
- **Starter**: $10/month for 10,000 emails
- **Professional**: $30/month for 50,000 emails

For most small businesses, the free tier should be sufficient. Monitor your usage in the SMTP2GO dashboard.

---

## Support

If you encounter issues not covered in this guide:

1. Check Supabase Edge Function logs
2. Check SMTP2GO delivery logs
3. Review the error messages in browser console
4. Check the network tab for failed API requests

For further assistance, contact your development team or refer to:
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [SMTP2GO Documentation](https://apidocs.smtp2go.com/)
