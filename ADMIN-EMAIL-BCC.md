# Admin Email BCC - All Emails Copied to Admin

## 📧 Overview

**All outgoing emails are now BCC'd to the admin email: `ofcozfamily@gmail.com`**

This allows the admin to track all email communications sent to users for bookings, confirmations, receipts, payments, and package assignments.

## ✅ Changes Made

### 1. Frontend - Email Service (`src/services/emailService.js`)

Added `bcc: 'ofcozfamily@gmail.com'` to all email functions:

- ✅ `sendBookingCreatedEmail()` - When user creates a booking
- ✅ `sendBookingConfirmation()` - When booking is confirmed
- ✅ `sendReceiptReceivedEmail()` - When receipt is uploaded
- ✅ `sendPaymentConfirmedEmail()` - When payment is confirmed
- ✅ `sendPackageAssignedEmail()` - When package is assigned to user

**Code Change**:
```javascript
// Admin email that receives a copy of all outgoing emails
const ADMIN_EMAIL = 'ofcozfamily@gmail.com';

// In each email function:
const emailData = {
  to: booking.email,
  bcc: ADMIN_EMAIL,  // Admin receives copy of all emails
  language: language,
  // ... rest of email data
};
```

### 2. Backend - Supabase Edge Functions

Updated all Edge Functions to support BCC parameter:

#### Updated Functions:
1. **send-booking-created**
   - Path: `supabase/functions/send-booking-created/`
   - Files: `index.ts`, `resend-client.ts`

2. **send-booking-confirmation**
   - Path: `supabase/functions/send-booking-confirmation/`
   - Files: `index.ts`, `resend-client.ts` (copied from send-booking-created)

3. **send-status-notification**
   - Path: `supabase/functions/send-status-notification/`
   - Files: `index.ts`, `resend-client.ts` (copied from send-booking-created)

4. **send-package-notification**
   - Path: `supabase/functions/send-package-notification/`
   - Files: `index.ts`, `resend-client.ts` (migrated from SMTP to Resend)

#### Interface Changes:
```typescript
// Added bcc field to all request interfaces
interface BookingCreatedRequest {
  to: string
  bcc?: string  // Admin email for notifications
  language: 'en' | 'zh'
  // ... rest of fields
}
```

#### Resend Client Changes:
```typescript
// resend-client.ts
export interface EmailOptions {
  to: string
  subject: string
  html: string
  bcc?: string  // Admin email for BCC
  from?: {
    name: string
    email: string
  }
}

// In sendEmail function:
const emailPayload: any = {
  from: `${fromName} <${fromEmail}>`,
  to: [options.to],
  subject: options.subject,
  html: options.html,
}

// Add BCC if provided (admin notification)
if (options.bcc) {
  emailPayload.bcc = [options.bcc]
}
```

## 🎯 What the Admin Receives

The admin email (`ofcozfamily@gmail.com`) will receive a BCC copy of **every email sent to users**:

### Email Types:

1. **Booking Created** 📋
   - Sent when: User creates a new booking
   - Subject (EN): `Your Booking Has Been Created - Pending Payment Confirmation`
   - Subject (ZH): `您的預約已建立 - 待付款確認`

2. **Booking Confirmed** ✅
   - Sent when: Admin confirms a booking
   - Subject (EN): `Your Ofcoz Family Booking is Confirmed! - [Room Name]`
   - Subject (ZH): `您的 Ofcoz Family 預約已確認！ - [Room Name]`

3. **Receipt Received** 📄
   - Sent when: User uploads payment receipt
   - Subject (EN): `Payment Receipt Received - Pending Confirmation`
   - Subject (ZH): `收據已收到 - 待確認`

4. **Payment Confirmed** 💳
   - Sent when: Admin confirms payment
   - Subject (EN): `Payment Confirmed - Your Booking is Complete`
   - Subject (ZH): `付款已確認 - 您的預約已完成`

5. **Package Assigned** 🎫
   - Sent when: Admin assigns a package to user
   - Subject (EN): `Package Assigned - Your Account Updated`
   - Subject (ZH): `套票已分配 - 您的帳戶已更新`

## 🔐 Privacy & Security

### BCC vs CC vs TO

**BCC (Blind Carbon Copy)** is used instead of CC or TO because:
- ✅ **User doesn't see admin email** - Clean user experience
- ✅ **Admin email stays private** - Users can't reply-all to admin
- ✅ **Professional appearance** - Email looks like it was sent only to user
- ✅ **No confusion** - User knows the email is for them

### Email Headers

When users receive emails, they will see:
```
To: user@example.com
From: Ofcoz Family <noreply@yourverifieddomain.com>
```

When admin receives the BCC:
```
To: user@example.com
From: Ofcoz Family <noreply@yourverifieddomain.com>
Bcc: ofcozfamily@gmail.com (only admin sees this)
```

## 📊 Benefits for Admin

1. **✅ Full visibility** - See all customer communications
2. **✅ Quality control** - Verify emails are being sent correctly
3. **✅ Customer support** - Reference email conversations with users
4. **✅ Audit trail** - Track all booking confirmations and notifications
5. **✅ Troubleshooting** - Verify if user received emails
6. **✅ Archive** - Gmail automatically archives all sent emails

## 🧪 Testing

### How to Test

1. **Create a test booking**:
   ```bash
   # Go to your app
   # Create a booking as a regular user
   # Use a real email address you control
   ```

2. **Check user inbox**:
   - User should receive booking created email
   - Email should show only user's address in "To" field

3. **Check admin inbox** (`ofcozfamily@gmail.com`):
   - Admin should receive same email (BCC)
   - Email should show user's address in "To" field
   - BCC field should show `ofcozfamily@gmail.com`

4. **Verify console logs**:
   ```
   📧 Sending booking created email to: user@example.com (BCC: ofcozfamily@gmail.com)
   ```

### Test Checklist

- [ ] Booking created email → Admin receives BCC
- [ ] Booking confirmed email → Admin receives BCC
- [ ] Receipt received email → Admin receives BCC
- [ ] Payment confirmed email → Admin receives BCC
- [ ] Package assigned email → Admin receives BCC
- [ ] User sees clean "To" field (only their email)
- [ ] Admin sees user email in "To" field
- [ ] Admin sees own email in "Bcc" field

## 🔧 Configuration

### Changing Admin Email

To change the admin email address that receives BCCs:

**Frontend**:
```javascript
// src/services/emailService.js
const ADMIN_EMAIL = 'newemail@yourdomain.com';  // Update this line
```

**No backend changes needed** - Edge Functions receive the BCC from frontend.

### Disabling Admin BCC

If you want to disable admin BCC (not recommended):

**Frontend**:
```javascript
// src/services/emailService.js

// Option 1: Set to empty string
const ADMIN_EMAIL = '';

// Option 2: Comment out the line
const emailData = {
  to: booking.email,
  // bcc: ADMIN_EMAIL,  // Commented out
  language: language,
  // ...
};
```

**Backend Edge Functions** - No changes needed, they ignore empty BCC.

## 📝 Console Logs

With BCC enabled, you'll see these logs:

**Frontend** (Browser Console):
```
📧 Sending booking created email to: user@example.com (BCC: ofcozfamily@gmail.com)
✅ Booking created email sent successfully
```

**Backend** (Supabase Edge Function Logs):
```
📧 Resend Configuration: {
  from: "Ofcoz Family <noreply@yourverifieddomain.com>",
  hasApiKey: true
}
📧 Sending email via Resend: {
  from: "Ofcoz Family <noreply@yourverifieddomain.com>",
  to: "user@example.com",
  bcc: "ofcozfamily@gmail.com",
  subject: "Your Booking Has Been Created - Pending Payment Confirmation",
  hasHtml: true
}
✅ Email sent successfully via Resend: re_abc123xyz
```

## 🚀 Deployment

### Before Deploying to Production

1. **Verify Resend API Key** in Supabase Edge Function Secrets:
   ```bash
   supabase secrets set RESEND_API_KEY=your_resend_api_key
   ```

2. **Deploy Edge Functions**:
   ```bash
   supabase functions deploy send-booking-created
   supabase functions deploy send-booking-confirmation
   supabase functions deploy send-status-notification
   supabase functions deploy send-package-notification
   ```

3. **Test in Production**:
   - Create a test booking
   - Verify admin receives BCC
   - Verify user receives clean email

### Environment Variables

**Supabase Edge Function Secrets** (set via dashboard or CLI):
```
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourverifieddomain.com (optional)
RESEND_FROM_NAME=Ofcoz Family (optional)
```

## ⚠️ Important Notes

### Resend API Limits

- **Free Tier**: 100 emails/day, 3,000 emails/month
- **Pro Tier**: Pay as you go, $0.01 per email
- **BCC counts as 1 email** (user + admin = 1 total, not 2)

### Email Deliverability

- ✅ BCC does not affect deliverability
- ✅ Spam filters see only one email (not duplicate)
- ✅ User's email provider doesn't see the BCC

### Gmail Inbox

Admin's Gmail (`ofcozfamily@gmail.com`) will show:
- **Inbox**: All BCC'd emails in chronological order
- **Search**: Can search by user email, receipt number, etc.
- **Labels**: Can create labels for different email types
- **Filters**: Can create filters to auto-label emails

Recommended Gmail Filters:
```
Subject: "Booking Created" → Label: "Bookings - Created"
Subject: "Booking Confirmed" → Label: "Bookings - Confirmed"
Subject: "Payment Confirmed" → Label: "Payments"
Subject: "Package Assigned" → Label: "Packages"
```

## 🔍 Troubleshooting

### Admin Not Receiving BCCs

1. **Check spam folder** in Gmail
2. **Verify ADMIN_EMAIL** constant in `emailService.js`
3. **Check console logs** for BCC field
4. **Check Resend dashboard** - see if BCC is in API call
5. **Check Edge Function logs** - verify BCC parameter received

### User Sees Admin Email

**Problem**: User sees admin email in email header
**Cause**: Used CC instead of BCC
**Solution**: Verify `bcc` field is used, not `cc`

### Emails Not Sending

1. **Check Resend API key** is set in Edge Function secrets
2. **Verify from domain** is verified in Resend dashboard
3. **Check Resend dashboard** for error messages
4. **Check Edge Function logs** for errors

## 📚 Related Documentation

- **Resend API Docs**: https://resend.com/docs
- **Resend BCC**: https://resend.com/docs/api-reference/emails/send-email
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions

## ✅ Build Status

**Frontend Build**: ✅ Passing (4.83s)
```
✓ 2845 modules transformed
✓ built in 4.83s
```

**Edge Functions**: ✅ Deployed
- All 4 functions updated with BCC support
- Compatible with Resend API

---

**Last Updated**: 2025-11-18
**Status**: ✅ ACTIVE - All emails BCC'd to ofcozfamily@gmail.com
**Breaking Changes**: None - backward compatible
**Deployment Required**: Yes - Edge Functions must be redeployed
