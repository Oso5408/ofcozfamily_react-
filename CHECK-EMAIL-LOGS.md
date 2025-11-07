# How to Check if Email Was Sent

## Method 1: Browser Console (Easiest)

1. Open Developer Tools (F12 or Cmd+Option+I)
2. Go to **Console** tab
3. Upload a receipt
4. Look for these messages:

**Success:**
```
📤 Uploading receipt for booking: [booking-id]
✅ Receipt uploaded successfully: [url]
✅ Booking updated with receipt URL and status changed to to_be_confirmed
📧 Sending receipt received email...
✅ Receipt received email sent successfully
```

**Failure:**
```
❌ Failed to send receipt received email: [error message]
```

---

## Method 2: Supabase Dashboard Logs

1. Go to: https://supabase.com/dashboard/project/rlfrwsyqletwegvflqip/logs/edge-functions

2. Select function: **send-status-notification**

3. Filter by recent time

4. Look for function invocations and errors

---

## Method 3: Check Database

Run this SQL in Supabase SQL Editor:

```sql
-- Check recent bookings and their status
SELECT
  id,
  receipt_number,
  status,
  receipt_url,
  created_at,
  updated_at,
  users.email as user_email
FROM bookings
LEFT JOIN users ON bookings.user_id = users.id
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;
```

If `status = 'to_be_confirmed'` and `receipt_url` is not null, the receipt was uploaded successfully.

---

## Method 4: Network Tab (Check API Calls)

1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Upload receipt
4. Look for API call to: `send-status-notification`
5. Click on it to see:
   - Request payload
   - Response status
   - Response body

---

## Common Issues & Solutions

### Issue 1: Email Function Not Called
**Symptom:** No `📧 Sending receipt received email...` in console

**Cause:** Receipt upload might have failed before reaching email step

**Check:** Look for `❌ Receipt upload failed` or `❌ Failed to update booking with receipt`

### Issue 2: SMTP Credentials Not Set
**Symptom:** Error message: "Missing SMTP credentials"

**Solution:** Set Supabase secrets:
```bash
supabase secrets set SMTP_HOST=smtp.hostinger.com
supabase secrets set SMTP_PORT=465
supabase secrets set SMTP_USER=your-email@domain.com
supabase secrets set SMTP_PASSWORD=your-password
```

### Issue 3: Edge Function Error
**Symptom:** Error in console or network tab

**Solution:** Check Supabase dashboard logs for detailed error

### Issue 4: Wrong Email Address
**Check booking record:**
```sql
SELECT email, name FROM users WHERE id = 'user-id';
```

Make sure user has valid email address.

---

## Test Email Manually

You can test the email function directly:

```javascript
// Run this in browser console on your site
const { emailService } = await import('./src/services/emailService.js');

const testBooking = {
  email: 'your-test-email@gmail.com',
  name: 'Test User',
  receiptNumber: 'TEST-123',
  room: { name: 'roomA' },
  date: '01/01/2025',
  startTime: '10:00',
  endTime: '12:00'
};

const result = await emailService.sendReceiptReceivedEmail(testBooking, 'zh');
console.log('Email result:', result);
```

---

## Quick Debug Checklist

- [ ] Check browser console for logs
- [ ] Check booking status in database (`to_be_confirmed`?)
- [ ] Check receipt URL exists in database
- [ ] Check user email is valid
- [ ] Check Supabase Edge Function logs
- [ ] Check SMTP credentials are set
- [ ] Check spam folder in email

---

## Where to Find Logs

**Supabase Dashboard:**
- Edge Functions Logs: https://supabase.com/dashboard/project/rlfrwsyqletwegvflqip/logs/edge-functions
- Postgres Logs: https://supabase.com/dashboard/project/rlfrwsyqletwegvflqip/logs/postgres-logs
- API Logs: https://supabase.com/dashboard/project/rlfrwsyqletwegvflqip/logs/api-logs
