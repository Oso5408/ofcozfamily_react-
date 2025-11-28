# Deploy Cancel with Refund Feature

## Overview
This guide helps you deploy the admin cancellation with optional token/package refund feature.

## What Was Implemented

### 1. Frontend (✅ Already Done)
- Admin cancellation dialog now has a checkbox: "退還代幣/套票給用戶" / "Refund tokens/package to user"
- Checkbox shows only for bookings paid with: `token`, `dp20`, `br15`, `br30`
- Default: Checked (refund enabled)
- Admin can uncheck to keep tokens/packages deducted

### 2. Backend (⚠️ NEEDS DEPLOYMENT)
- 4 new database functions for refunding
- 2 Edge Functions for sending emails

## Deployment Steps

### Step 1: Deploy SQL Functions

Run this in **Supabase SQL Editor**:

```sql
-- Copy and paste the entire contents of:
-- supabase/add-token-refund-functions.sql

-- This creates:
-- 1. add_tokens(user_id, amount, booking_id, description)
-- 2. refund_br15_hours(user_id, hours, booking_id)
-- 3. refund_br30_hours(user_id, hours, booking_id)
-- 4. refund_dp20_days(user_id, days, booking_id)
```

**Or** if you have Supabase CLI connected:
```bash
psql YOUR_DATABASE_URL < supabase/add-token-refund-functions.sql
```

### Step 2: Deploy Edge Functions

Deploy the email notification functions:

```bash
# Deploy cancellation notification (to admin)
supabase functions deploy send-cancellation-notification

# Deploy cancellation email (to user)
supabase functions deploy send-cancellation-email

# Or deploy all functions at once
supabase functions deploy
```

### Step 3: Verify Deployment

**Check SQL Functions:**
```sql
-- Run this in Supabase SQL Editor to verify:
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('add_tokens', 'refund_br15_hours', 'refund_br30_hours', 'refund_dp20_days');
```

You should see all 4 functions listed.

**Check Edge Functions:**
Go to: Supabase Dashboard → Edge Functions

You should see:
- ✅ `send-cancellation-notification` (deployed)
- ✅ `send-cancellation-email` (deployed)

### Step 4: Test the Feature

1. Go to Admin Panel → Bookings
2. Find a booking paid with tokens or packages
3. Click "Cancel" button
4. You should see:
   - Cancellation confirmation dialog
   - Checkbox: "退還代幣/套票給用戶" (checked by default)
5. Test both scenarios:
   - **Checked**: Cancel → User gets refund
   - **Unchecked**: Cancel → User doesn't get refund
6. Check console logs:
   - Should show: `💰 Processing refund for payment method: ...`
   - Should show: `✅ Refunded X tokens/hours/days to user`

## Troubleshooting

### Error: "function add_tokens does not exist"
➡️ You forgot Step 1. Run the SQL migration.

### Error: "404 on send-cancellation-notification"
➡️ You forgot Step 2. Deploy the Edge Functions.

### Error: "PGRST201 - ambiguous relationship"
➡️ This is already fixed in the code (line 314 of bookingService.js uses `users!bookings_user_id_fkey`)

### Refund not working but no error
➡️ Check Supabase logs:
- Go to: Database → Logs
- Look for: `add_tokens`, `refund_br15_hours`, etc.
- Verify the functions are being called

## How It Works

### Payment Method: `token`
- Calls: `add_tokens(user_id, amount, booking_id)`
- Refunds to: `users.tokens`
- Logs to: `token_history` table

### Payment Method: `br15`
- Calls: `refund_br15_hours(user_id, hours, booking_id)`
- Refunds to: `users.br15_balance`
- Logs to: `package_history` table

### Payment Method: `br30`
- Calls: `refund_br30_hours(user_id, hours, booking_id)`
- Refunds to: `users.br30_balance`
- Logs to: `package_history` table

### Payment Method: `dp20`
- Calls: `refund_dp20_days(user_id, days, booking_id)`
- Refunds to: `users.dp20_balance` (max 20)
- Logs to: `package_history` table

## Files Modified

- ✅ `src/components/admin/AdminBookingsTab.jsx` - Added checkbox UI
- ✅ `src/services/bookingService.js` - Added refund logic
- ✅ `src/data/translations/en/dashboard.js` - Added English translations
- ✅ `src/data/translations/zh/dashboard.js` - Added Chinese translations
- ✅ `supabase/add-token-refund-functions.sql` - **NEW FILE** (needs deployment)
- ✅ `supabase/functions/send-cancellation-email/` - **NEW FOLDER** (needs deployment)

## Success Criteria

After deployment, you should be able to:
1. ✅ See checkbox in cancellation dialog (for token/package bookings)
2. ✅ Cancel with refund (checkbox checked) → User balance increases
3. ✅ Cancel without refund (checkbox unchecked) → User balance stays the same
4. ✅ User receives cancellation email
5. ✅ Admin receives cancellation notification
6. ✅ All actions logged in database history tables
