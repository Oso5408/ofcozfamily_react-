# Email BCC Testing Guide

This guide provides multiple ways to test that all emails include BCC to `ofcozfamily@gmail.com`.

## Quick Test (Browser Console)

### Method 1: Browser DevTools Test

1. **Open your app** in browser (http://localhost:5173)

2. **Open DevTools** (F12 or Right-click → Inspect)

3. **Go to Network tab**

4. **Filter** by "send-" to see Edge Function calls

5. **Create a test booking**:
   - Go to booking page
   - Fill in booking details
   - Use a real email you control
   - Submit booking

6. **Check Network tab**:
   - Look for `send-booking-created` request
   - Click on the request
   - Go to "Payload" or "Request" tab
   - Look for `bcc` field
   - **Verify**: `"bcc": "ofcozfamily@gmail.com"`

### Method 2: Console Quick Test

1. **Open browser console** (F12 → Console tab)

2. **Run quick test**:
   ```javascript
   // Import test utility
   import('/src/utils/testEmailBCC.js').then(module => {
     window.testEmailBCC = module.default;
     window.testEmailBCC.quickTest();
   });
   ```

3. **Check console output**:
   ```
   🚀 Running quick BCC test...
   Sending test booking created email...
   ✅ Email sent successfully!
   📝 To verify BCC:
   1. Open browser DevTools → Network tab
   2. Look for request to "send-booking-created"
   3. Check Request Payload for "bcc" field
   4. Verify bcc = "ofcozfamily@gmail.com"
   ```

4. **Verify in Network tab** as described above

### Method 3: Full Test Suite (Console)

1. **Open browser console**

2. **Import and run all tests**:
   ```javascript
   import('/src/utils/testEmailBCC.js').then(module => {
     window.testEmailBCC = module.default;
     window.testEmailBCC.runAllTests();
   });
   ```

3. **Check console for results**:
   ```
   🧪🧪🧪 EMAIL BCC TEST SUITE 🧪🧪🧪

   TEST 1: Booking Created Email
   ✅ Test passed - Check network tab for BCC field

   TEST 2: Booking Confirmation Email
   ✅ Test passed - Check network tab for BCC field

   ...

   TEST RESULTS SUMMARY
   ✅ PASSED: Booking Created Email
   ✅ PASSED: Booking Confirmation Email
   ✅ PASSED: Receipt Received Email
   ✅ PASSED: Payment Confirmed Email
   ✅ PASSED: Package Assigned Email

   Total: 5 | Passed: 5 | Failed: 0
   🎉 ALL TESTS PASSED!
   ```

## Manual Test (Real Email)

### Prerequisites
- Real email addresses (user and admin)
- Resend API key configured
- Edge Functions deployed

### Steps

1. **Create a test booking** with your real email:
   - Go to http://localhost:5173/#/booking/room-1
   - Fill in all details
   - **Use your real email** as the user email
   - Select "Cash" payment method
   - Submit booking

2. **Check user inbox**:
   - Open user's email inbox
   - Look for "Your Booking Has Been Created" email
   - Verify email received

3. **Check admin inbox** (`ofcozfamily@gmail.com`):
   - Open Gmail for `ofcozfamily@gmail.com`
   - Look for same "Your Booking Has Been Created" email
   - **Verify BCC header**:
     - Email should appear in inbox
     - "To" field shows user's email
     - Admin email should be in BCC (not visible in email content)

4. **Verify email headers** (Gmail):
   - Open the email in admin inbox
   - Click three dots (⋮) → "Show original"
   - Look for BCC header:
     ```
     To: user@example.com
     Bcc: ofcozfamily@gmail.com
     From: Ofcoz Family <noreply@yourverifieddomain.com>
     ```

## Edge Function Logs Test

### View Supabase Edge Function Logs

1. **Go to Supabase Dashboard**:
   - Navigate to Edge Functions
   - Click on `send-booking-created`
   - Go to "Logs" tab

2. **Trigger a test email**:
   - Create a booking in your app
   - Wait a few seconds

3. **Check logs** for BCC confirmation:
   ```
   📧 Sending email via Resend: {
     from: "Ofcoz Family <noreply@yourverifieddomain.com>",
     to: "user@example.com",
     bcc: "ofcozfamily@gmail.com",  ← Look for this
     subject: "Your Booking Has Been Created - Pending Payment Confirmation",
     hasHtml: true
   }
   ✅ Email sent successfully via Resend: re_abc123xyz
   ```

4. **Look for error logs**:
   - If BCC is missing, you'll see an error
   - If Resend rejects the request, check API key and domain verification

## Resend Dashboard Test

### Check Sent Emails in Resend

1. **Go to Resend Dashboard**: https://resend.com/emails

2. **Login** with your Resend account

3. **Click on "Emails"** in sidebar

4. **Find your test email**:
   - Look for recently sent email
   - Click to view details

5. **Verify recipients**:
   ```
   To: user@example.com
   Bcc: ofcozfamily@gmail.com  ← Should show both
   ```

6. **Check delivery status**:
   - Both emails should show "Delivered"
   - User email: Delivered to user@example.com
   - Admin email: Delivered to ofcozfamily@gmail.com

## Test All Email Types

### 1. Booking Created Email

**Trigger**: Create a new booking

**Expected**:
- User receives email
- Admin receives BCC
- Subject: "Your Booking Has Been Created - Pending Payment Confirmation"

**Test**:
```javascript
window.testEmailBCC.testBookingCreatedEmail()
```

### 2. Booking Confirmation Email

**Trigger**: Admin confirms a booking

**Expected**:
- User receives confirmation
- Admin receives BCC
- Subject: "Your Ofcoz Family Booking is Confirmed!"

**Test**:
```javascript
window.testEmailBCC.testBookingConfirmationEmail()
```

### 3. Receipt Received Email

**Trigger**: User uploads payment receipt

**Expected**:
- User receives acknowledgment
- Admin receives BCC
- Subject: "Payment Receipt Received - Pending Confirmation"

**Test**:
```javascript
window.testEmailBCC.testReceiptReceivedEmail()
```

### 4. Payment Confirmed Email

**Trigger**: Admin confirms payment

**Expected**:
- User receives confirmation
- Admin receives BCC
- Subject: "Payment Confirmed - Your Booking is Complete"

**Test**:
```javascript
window.testEmailBCC.testPaymentConfirmedEmail()
```

### 5. Package Assigned Email

**Trigger**: Admin assigns package to user

**Expected**:
- User receives package notification
- Admin receives BCC
- Subject: "Package Assigned - Your Account Updated"

**Test**:
```javascript
window.testEmailBCC.testPackageAssignedEmail()
```

## Troubleshooting

### BCC Not Showing in Network Tab

**Problem**: BCC field missing in request payload

**Check**:
1. Verify `ADMIN_EMAIL` constant in `src/services/emailService.js`
2. Ensure all email functions include `bcc: ADMIN_EMAIL`
3. Clear browser cache and reload
4. Check console for errors

**Fix**:
```javascript
// In src/services/emailService.js
const ADMIN_EMAIL = 'ofcozfamily@gmail.com';

const emailData = {
  to: booking.email,
  bcc: ADMIN_EMAIL,  // Must be here
  language: language,
  // ...
};
```

### Admin Not Receiving Emails

**Problem**: User receives email but admin doesn't

**Check**:
1. **Gmail spam folder** - Check `ofcozfamily@gmail.com` spam
2. **Resend dashboard** - Verify email was sent to both addresses
3. **Gmail filters** - Check if emails are being auto-archived
4. **Edge Function logs** - Verify BCC in Supabase logs

**Debug**:
```bash
# Check Supabase Edge Function logs
supabase functions logs send-booking-created

# Look for:
# "bcc": "ofcozfamily@gmail.com"
```

### BCC Shows User's Email Instead

**Problem**: BCC field contains user email, not admin email

**Fix**: Check that you're not mixing up `to` and `bcc`:
```javascript
// ✅ Correct
const emailData = {
  to: booking.email,        // User's email
  bcc: ADMIN_EMAIL,         // Admin's email
  // ...
};

// ❌ Wrong
const emailData = {
  to: ADMIN_EMAIL,          // Wrong!
  bcc: booking.email,       // Wrong!
  // ...
};
```

### Edge Function Not Receiving BCC

**Problem**: Edge Function receives request but BCC is undefined

**Check**:
1. Verify Edge Function interface includes `bcc?:string`
2. Ensure function destructures `bcc` from request
3. Verify `resend-client.ts` accepts BCC parameter

**Fix** (in Edge Function):
```typescript
// index.ts
interface BookingCreatedRequest {
  to: string
  bcc?: string  // Must include this
  language: 'en' | 'zh'
  // ...
}

// Destructure bcc
const { to, bcc, language, booking } = await req.json();

// Pass to sendEmail
const result = await sendEmail({ to, subject, html, bcc });
```

### Resend API Error

**Problem**: "Invalid BCC email" or similar error from Resend

**Check**:
1. BCC email format is correct (no typos)
2. BCC is an array in API call: `bcc: [options.bcc]`
3. Resend API key has permissions

**Fix** (in `resend-client.ts`):
```typescript
// ✅ Correct
if (options.bcc) {
  emailPayload.bcc = [options.bcc];  // Array format
}

// ❌ Wrong
if (options.bcc) {
  emailPayload.bcc = options.bcc;  // String format won't work
}
```

## Test Checklist

Use this checklist to verify BCC is working:

### Code Verification
- [ ] `ADMIN_EMAIL` constant exists in `src/services/emailService.js`
- [ ] `ADMIN_EMAIL = 'ofcozfamily@gmail.com'`
- [ ] All 5 email functions include `bcc: ADMIN_EMAIL`
- [ ] All Edge Functions accept `bcc?:string` parameter
- [ ] All Edge Functions pass BCC to `sendEmail()`
- [ ] `resend-client.ts` adds BCC to email payload

### Browser Test
- [ ] Network tab shows BCC in request payload
- [ ] Console test runs without errors
- [ ] No console errors about missing BCC

### Email Delivery Test
- [ ] User receives email successfully
- [ ] Admin (`ofcozfamily@gmail.com`) receives BCC
- [ ] Email "To" field shows only user's email
- [ ] Email appears in admin's Gmail inbox

### Edge Function Test
- [ ] Supabase logs show BCC in request
- [ ] No errors in Edge Function logs
- [ ] Resend dashboard shows 2 recipients

### Production Test
- [ ] Test with real booking in production
- [ ] Verify email reaches both user and admin
- [ ] Check Gmail inbox for admin
- [ ] Verify no BCC visible to user

## Automated Testing (Optional)

### Vitest Test (Future Enhancement)

Create `src/services/__tests__/emailService.test.js`:

```javascript
import { describe, it, expect, vi } from 'vitest';
import { emailService } from '../emailService';

describe('Email BCC Tests', () => {
  it('should include BCC in booking created email', async () => {
    const mockBooking = {
      email: 'user@example.com',
      // ... other fields
    };

    // Spy on Supabase function invoke
    const invokeSpy = vi.spyOn(supabase.functions, 'invoke');

    await emailService.sendBookingCreatedEmail(mockBooking, 'en');

    // Verify BCC was included
    expect(invokeSpy).toHaveBeenCalledWith('send-booking-created', {
      body: expect.objectContaining({
        bcc: 'ofcozfamily@gmail.com'
      })
    });
  });

  // Add more tests for other email types
});
```

Run tests:
```bash
npm test
```

---

**Last Updated**: 2025-11-18
**Status**: ✅ BCC Testing Guide Complete
**Tools**: Browser DevTools, Console, Resend Dashboard, Supabase Logs
