# SMTP Bug Fix - Step by Step Solution

## Problem Analysis

### Error Message
```
❌ Error sending email: TypeError: Cannot read properties of undefined (reading 'includes')
    at https://deno.land/x/denomailer@1.6.0/config/mail/mod.ts:65:48
    at Array.some (<anonymous>)
    at validateConfig (https://deno.land/x/denomailer@1.6.0/config/mail/mod.ts:65:27)
```

### Root Cause
The error occurred at line 65 in denomailer's validation code:
```typescript
config.mimeContent.some((v) => (v.mimeType.includes("text/html") || v.mimeType.includes("text/plain")))
```

**Problem:** Our code was passing `contentType` but denomailer expected `mimeType`, causing `v.mimeType` to be undefined.

### Our Wrong Code
```typescript
mimeContent: [
  {
    contentType: 'text/html; charset=UTF-8',  // ❌ Wrong property name
    content: base64Html,                       // ❌ Unnecessary base64 encoding
    transferEncoding: 'base64',
  }
]
```

## Solution

### What We Changed
Instead of using the complex `mimeContent` API with manual base64 encoding, we switched to denomailer's simpler and recommended approach:

**Correct Code:**
```typescript
await client.send({
  from: fromEmail,
  to: toEmail,
  subject: emailSubject,
  content: 'auto',      // ✅ Auto-generate plain text from HTML
  html: emailHtml,      // ✅ HTML as string (not base64)
  headers: {
    'Reply-To': 'ofcozfamily@gmail.com',
  },
})
```

### Why This Works
1. **Simpler API**: Uses denomailer's standard `html` and `content` properties
2. **Automatic Encoding**: Denomailer handles charset encoding automatically
3. **No Manual Base64**: No need for custom encoding functions
4. **Proper Validation**: Passes denomailer's internal validation checks

## Files Fixed

### 1. Frontend Email Service
- **File:** `src/services/emailService.js`
- **Changes:**
  - Added safe null checking for `t.rooms?.roomNames`
  - Added try-catch blocks for room name translation
  - Fixed both `sendPaymentConfirmedEmail` and `sendReceiptReceivedEmail`

### 2. Supabase Edge Functions
- **File:** `supabase/functions/send-booking-confirmation/smtp-client.ts`
- **Changes:**
  - Removed `encodeBase64()` helper function
  - Changed from `mimeContent` to `html` + `content` properties
  - Fixed error handling with safe null checks

- **File:** `supabase/functions/send-booking-created/smtp-client.ts`
- **Changes:**
  - Same fixes as send-booking-confirmation
  - Consistent SMTP implementation across all functions

## Deployment Instructions

### Step 1: Deploy Edge Functions to Supabase

You need to redeploy the Edge Functions with the fixed SMTP client:

```bash
# Deploy send-booking-confirmation function
supabase functions deploy send-booking-confirmation

# Deploy send-booking-created function
supabase functions deploy send-booking-created

# Deploy send-status-notification function (uses same smtp-client)
supabase functions deploy send-status-notification
```

**Alternative (Supabase Dashboard):**
1. Go to Supabase Dashboard → Edge Functions
2. For each function, click "Deploy New Version"
3. Upload the updated files

### Step 2: Verify SMTP Environment Variables

Ensure these are set in Supabase Dashboard → Edge Functions → Settings:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=Ofcoz Family
SMTP_SECURE=false
```

**Note:** Use App Password for Gmail, not your regular password!

### Step 3: Test Email Sending

After deploying, test the email functionality:

1. Create a test booking as admin
2. Change booking status to trigger emails:
   - Upload receipt → "Receipt Received" email
   - Confirm payment → "Payment Confirmed" email
3. Check browser console for:
   - ✅ Success messages
   - ❌ Any error messages

## Testing Checklist

- [ ] Deploy all Edge Functions to Supabase
- [ ] Verify SMTP environment variables are set
- [ ] Test "Receipt Received" email (status: pending → to_be_confirmed)
- [ ] Test "Payment Confirmed" email (status: to_be_confirmed → confirmed)
- [ ] Test "Booking Created" email (new booking)
- [ ] Verify Chinese characters display correctly in emails
- [ ] Check HTML formatting renders properly

## Expected Behavior After Fix

### Before Fix
```
❌ Email sending failed: Cannot read properties of undefined (reading 'includes')
❌ Failed to send confirmation email: Cannot read properties of undefined (reading 'includes')
```

### After Fix
```
📧 Sending payment confirmed email to: user@example.com
📨 Connecting to SMTP server...
📧 Email fields: { from: '...', to: '...', subject: '...', hasHtml: true }
✅ Email sent successfully to: user@example.com
✅ Payment confirmed email sent successfully
```

## Additional Notes

### Why We Used mimeContent Before
The original implementation tried to use base64 encoding for better Chinese character support, but:
1. Denomailer already handles UTF-8 encoding automatically
2. The `mimeContent` API required `mimeType` (not `contentType`)
3. The simpler `html` property works perfectly with Chinese characters

### Denomailer Best Practices
From the official documentation:
- ✅ Use `html` for HTML content
- ✅ Use `content: 'auto'` for automatic plain text generation
- ✅ Let denomailer handle charset encoding
- ❌ Don't manually encode to base64 unless necessary
- ❌ Only use `mimeContent` for advanced custom encoding scenarios

## Troubleshooting

If emails still fail after deployment:

1. **Check Supabase Logs:**
   ```
   Dashboard → Edge Functions → [Function Name] → Logs
   ```

2. **Verify SMTP Credentials:**
   - Test Gmail App Password is valid
   - SMTP_HOST and SMTP_PORT are correct

3. **Check Email Address Format:**
   - Ensure `booking.email` or `booking.users.email` exists
   - Verify email format is valid

4. **Review Console Output:**
   - Look for "📧 Email fields:" log
   - Check if any fields are missing

## References

- [Denomailer Documentation](https://deno.land/x/denomailer@1.6.0/README.md)
- [Denomailer GitHub Issues](https://github.com/manyuanrong/denomailer/issues)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
