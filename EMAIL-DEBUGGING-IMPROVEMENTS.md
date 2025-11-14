# Email System Debugging Improvements

## Overview

Enhanced SMTP client validation and error handling to identify and prevent undefined field errors in the email notification system.

## Changes Made

### 1. Enhanced SMTP Client Validation

**Files Modified:**
- `supabase/functions/send-booking-confirmation/smtp-client.ts`
- `supabase/functions/send-booking-created/smtp-client.ts`

**What Changed:**
Added comprehensive field validation **before** attempting to send emails through the denomailer library.

**New Validation Logic (Lines 63-86):**

```typescript
// Validate email fields before sending
const fromEmail = options.from?.email || SMTP_FROM_EMAIL;
const toEmail = options.to;
const emailSubject = options.subject;
const emailHtml = options.html;

console.log('📧 Email fields:', {
  from: fromEmail,
  to: toEmail,
  subject: emailSubject,
  hasHtml: !!emailHtml,
  htmlLength: emailHtml?.length || 0
});

// Check for undefined fields
if (!fromEmail || !toEmail || !emailSubject || !emailHtml) {
  console.error('❌ Missing required email fields:', {
    hasFrom: !!fromEmail,
    hasTo: !!toEmail,
    hasSubject: !!emailSubject,
    hasHtml: !!emailHtml
  });
  return { success: false, error: 'Missing required email fields (from, to, subject, or html)' };
}
```

## Problem Solved

### Original Error:
```
TypeError: Cannot read properties of undefined (reading 'includes')
at https://deno.land/x/denomailer@1.6.0/config/mail/mod.ts:65:48
at validateConfig
at SMTPHandler.send
```

### Root Cause:
The denomailer library's validation function was trying to call `.includes()` on an undefined email field (from, to, subject, or html).

### Solution:
Now we validate all required fields **before** passing them to denomailer, providing clear error messages about which specific field is missing.

## Debugging Benefits

### 1. Clear Error Messages
Instead of cryptic denomailer errors, you now get:
```
❌ Missing required email fields: {
  hasFrom: true,
  hasTo: false,  // ← This field is missing!
  hasSubject: true,
  hasHtml: true
}
```

### 2. Detailed Logging
Every email attempt now logs all field values:
```
📧 Email fields: {
  from: "ofcozfamily@gmail.com",
  to: "user@example.com",
  subject: "Your Booking Confirmation",
  hasHtml: true,
  htmlLength: 4532
}
```

### 3. Early Failure Detection
Failed validations return immediately with descriptive errors, preventing denomailer from even attempting to send malformed emails.

## How to Use This for Troubleshooting

### Step 1: Check Supabase Edge Function Logs
1. Go to Supabase Dashboard → Edge Functions
2. Click on the failing function (e.g., `send-booking-created`)
3. Check "Logs" tab

### Step 2: Look for Validation Logs
Search for these log patterns:

**✅ Successful validation:**
```
📧 SMTP Configuration: {
  host: "smtp.gmail.com",
  port: 587,
  user: "ofcozfamily@gmail.com",
  secure: false,
  from: "ofcozfamily@gmail.com"
}

📨 Connecting to SMTP server...

📧 Email fields: {
  from: "ofcozfamily@gmail.com",
  to: "user@example.com",
  subject: "Your Booking Confirmation",
  hasHtml: true,
  htmlLength: 4532
}

✅ Email sent successfully to: user@example.com
```

**❌ Failed validation:**
```
📧 Email fields: {
  from: "ofcozfamily@gmail.com",
  to: undefined,  // ← Problem found!
  subject: "Your Booking Confirmation",
  hasHtml: true,
  htmlLength: 4532
}

❌ Missing required email fields: {
  hasFrom: true,
  hasTo: false,  // ← This tells you exactly what's wrong
  hasSubject: true,
  hasHtml: true
}
```

### Step 3: Fix the Root Cause
Based on which field is missing:

| Missing Field | Likely Cause | Fix Location |
|---------------|--------------|--------------|
| `to` | User email not extracted properly | `src/services/emailService.js` - Check email extraction logic |
| `subject` | Translation missing | `src/data/translations/` - Add missing translation key |
| `html` | Template generation failed | Edge Function `index.ts` - Check `getEmailHtml()` function |
| `from` | SMTP_FROM_EMAIL not configured | Supabase Dashboard → Edge Functions → Add `SMTP_FROM_EMAIL` secret |

## Testing the Fix

### Test 1: Create Booking
```bash
# In browser console after creating booking:
# Look for: "✅ Booking created email sent successfully"
```

### Test 2: Upload Receipt
```bash
# In browser console after uploading receipt:
# Look for: "✅ Receipt received email sent successfully"
```

### Test 3: Admin Confirm Payment
```bash
# In browser console after admin confirms:
# Look for: "✅ Payment confirmed email sent successfully"
```

## Next Steps

1. **Deploy Updated Edge Functions:**
   ```bash
   npx supabase functions deploy send-booking-created
   npx supabase functions deploy send-booking-confirmation
   npx supabase functions deploy send-status-notification
   ```

2. **Configure SMTP Environment Variables** (if not already done):
   - Go to Supabase Dashboard → Project Settings → Edge Functions
   - Add all required SMTP_* secrets (see GMAIL-SMTP-SETUP.md Part 2)

3. **Test Each Email Scenario:**
   - Create a test booking
   - Upload a receipt
   - Confirm payment as admin
   - Check Supabase logs for each test

4. **Monitor Production:**
   - Watch Edge Function logs for any validation failures
   - Use the detailed logging to quickly identify issues

## Additional Documentation

- **Setup Guide**: `GMAIL-SMTP-SETUP.md`
- **Email Service Code**: `src/services/emailService.js`
- **Edge Functions**: `supabase/functions/send-*/`

## Summary

These improvements transform cryptic denomailer errors into actionable debugging information. You can now quickly identify exactly which email field is missing and where to fix it, significantly reducing troubleshooting time.
