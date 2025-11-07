# Email Notification Fix Summary

## Issues Fixed

### 1. CORS Error - Fixed ✅
**Problem:** Edge Function rejected `x-application-name` header from Supabase client

**Solution:** Added `x-application-name` to CORS allowed headers in all 3 Edge Functions:
- `send-status-notification/index.ts`
- `send-booking-confirmation/index.ts`
- `send-package-notification/index.ts`

**Deployed:** All functions deployed successfully to Supabase

### 2. Missing User Email - Fixed ✅
**Problem:** `uploadReceiptForBooking` didn't include user email in returned booking object

**Solution:** Updated SQL query to join with users table using specific foreign key:
```javascript
users!bookings_user_id_fkey (
  email,
  full_name,
  phone
)
```

### 3. Missing Date/Time Fields - Fixed ✅
**Problem:** Email showed `undefined` for date and time because database uses `start_time`/`end_time` timestamps, but email expects `date`, `startTime`, `endTime`

**Solution:** Added date/time formatting in `uploadReceiptForBooking`:
```javascript
const formattedDate = startDate.toLocaleDateString('zh-HK', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

const formattedStartTime = startDate.toLocaleTimeString('zh-HK', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});
```

Now the booking object includes:
- `email` - User's email address
- `name` - User's full name
- `date` - Formatted date (e.g., "07/11/2025")
- `startTime` - Formatted start time (e.g., "14:00")
- `endTime` - Formatted end time (e.g., "16:00")
- `room` - Room object with name

## Email Encoding - Fixed ✅

**Problem:** Email was using `quoted-printable` encoding which caused Chinese characters to display as raw code like `=e6=94=b6=e6=93=9a` in some email clients

**Solution:** Updated SMTP client to use `base64` encoding with explicit UTF-8 charset:

```typescript
await client.send({
  html: options.html,
  encoding: 'base64', // Use base64 for better Chinese character support
  headers: {
    'Content-Type': 'text/html; charset=UTF-8',
    'Content-Transfer-Encoding': 'base64',
  },
});
```

Now emails will render properly as:
```
📋 收據已收到
您好 Oso，
我們已收到您的付款收據，預約編號 #5792774。
```

## Testing

To test the complete flow:

1. Go to booking page and create a new booking
2. Select "現金付款 (Cash Payment)"
3. Upload a receipt image
4. Submit the booking

Expected console output:
```
📤 Uploading receipt for booking: [booking-id]
✅ Receipt uploaded successfully: [url]
✅ Booking updated with receipt URL and status changed to to_be_confirmed
📧 Sending receipt received email to: [email]
✅ Receipt received email sent successfully
```

Expected email content:
- Subject: 收據已收到 - 待確認
- Shows correct booking number
- Shows correct date and time
- Shows correct room name
- Status: ⏳ 待確認

## Files Modified

1. `src/services/bookingService.js` (lines 530-562)
   - Added date/time formatting
   - Added user data flattening

2. `supabase/functions/send-status-notification/index.ts` (line 25)
   - Updated CORS headers

3. `supabase/functions/send-booking-confirmation/index.ts` (line 24)
   - Updated CORS headers

4. `supabase/functions/send-package-notification/index.ts` (line 20)
   - Updated CORS headers

5. `supabase/functions/send-booking-confirmation/smtp-client.ts` (lines 57-69)
   - Changed encoding from `content: 'auto'` to `encoding: 'base64'`
   - Added explicit UTF-8 charset headers
   - Added base64 Content-Transfer-Encoding header

All Edge Functions have been deployed to Supabase with the new encoding settings.
