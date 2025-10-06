# Room Booking System - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Set Up Database (5 minutes)

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Click on "SQL Editor" in the sidebar

2. **Run these 2 scripts in order:**

   **Script 1:** Add payment tracking fields
   ```bash
   # In SQL Editor, open and run:
   supabase/booking-payment-fields.sql
   ```

   **Script 2:** Seed rooms A-H
   ```bash
   # In SQL Editor, open and run:
   supabase/seed-rooms.sql
   ```

3. **Verify setup:**
   ```sql
   -- Check rooms were created
   SELECT id, name, hidden FROM rooms ORDER BY id;

   -- Should show 8 rooms, with Room A, F, G hidden
   ```

---

### Step 2: Test Cash Booking Flow (Customer Side)

1. **Start dev server** (if not running)
   ```bash
   npm run dev
   ```

2. **Register/Login as a customer**

3. **Book a room with cash payment:**
   - Go to Rooms page
   - Select any visible room (B, C, D, E, or H)
   - Choose date and time
   - Select **"Cash Payment"** option
   - Submit booking

4. **You should see:**
   - Success message: "Your booking has been submitted. Please pay at the venue."
   - Booking appears in your dashboard with "Pending Payment" status

---

### Step 3: Test Admin Payment Confirmation

1. **Login as admin**
   - Make sure your user has `is_admin: true` in Supabase
   - To set admin:
     ```sql
     UPDATE users SET is_admin = TRUE WHERE email = 'your@email.com';
     ```

2. **Go to Admin Panel**
   - Navigate to `/admin`
   - Click on "Bookings" tab

3. **Find the pending booking:**
   - Look for booking with "Pending Payment" status
   - Should see a green "Mark as Paid" button

4. **Confirm payment:**
   - Click "Mark as Paid"
   - Modal opens showing booking details and amount
   - Enter admin notes (e.g., "Received $120 cash")
   - Click "Confirm Payment Received"

5. **Verify:**
   - Booking status changes to "Confirmed"
   - Success notification appears
   - Customer can see confirmed booking in their dashboard

---

## ✅ What's Working Now

### For Customers:
- ✅ Browse available rooms (Room G hidden by default)
- ✅ Book with cash payment
- ✅ See "pending payment" status
- ✅ Clear instructions to pay at venue

### For Admins:
- ✅ See all bookings (including pending payments)
- ✅ Mark cash bookings as paid
- ✅ Add payment notes
- ✅ Track who confirmed payment and when

### System Features:
- ✅ Room availability checking
- ✅ No double bookings
- ✅ Payment tracking with timestamps
- ✅ Admin notes for payment records
- ✅ Bilingual support (EN/ZH)

---

## 🎯 Room Setup

| Room | ID | Status | Visible on Website | Notes |
|------|---|--------|-------------------|-------|
| Room A | 8 | Hidden | ❌ | Admin can make visible |
| Room B | 1 | Visible | ✅ | Available for booking |
| Room C | 2 | Visible | ✅ | Cash only |
| Room D | 3 | Visible | ✅ | Available for booking |
| Room E | 4 | Visible | ✅ | Available for booking |
| Room F | 5 | Hidden | ❌ | Admin can make visible |
| **Room G** | 6 | **Hidden** | ❌ | **Manual admin control** |
| Room H | 7 | Visible | ✅ | Available for booking |

### To Make Room G Visible (Temporary Method):

Run in Supabase SQL Editor:
```sql
UPDATE rooms SET hidden = FALSE WHERE id = 6;
```

**Note:** Room management UI coming in Phase 5 (see TODO section)

---

## 📋 Payment Status Reference

| Booking Status | Payment Status | What It Means | Admin Actions |
|----------------|----------------|---------------|---------------|
| `pending_payment` | `pending` | Awaiting customer payment | Mark as Paid ✅ |
| `confirmed` | `paid` | Payment received | View, Edit, Cancel |
| `completed` | `paid` | Booking finished | View only |
| `cancelled` | varies | Booking cancelled | View only |

---

## 🔍 How to Check Everything is Working

### 1. Verify Database Setup

```sql
-- Check rooms table
SELECT COUNT(*) as total_rooms FROM rooms;
-- Should return: 8

-- Check booking fields exist
SELECT column_name FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name IN ('admin_notes', 'payment_confirmed_at', 'payment_confirmed_by');
-- Should return 3 rows
```

### 2. Test Booking Creation

```sql
-- Check recent bookings
SELECT
  id,
  status,
  payment_status,
  payment_method,
  total_cost,
  created_at
FROM bookings
ORDER BY created_at DESC
LIMIT 5;
```

### 3. Test Payment Confirmation

```sql
-- Check confirmed payments
SELECT
  b.id,
  b.status,
  b.payment_status,
  b.payment_confirmed_at,
  b.admin_notes,
  u.full_name as confirmed_by
FROM bookings b
LEFT JOIN users u ON b.payment_confirmed_by = u.id
WHERE b.payment_status = 'paid' AND b.payment_method = 'cash';
```

---

## ⚠️ Important Notes

### Current Limitations:

1. **Room data source:**
   - Rooms currently fetched from `roomsData.js` (hardcoded)
   - Should migrate to fetch from Supabase database
   - Works for now, but not dynamic

2. **Admin bookings tab:**
   - Partially uses localStorage (legacy code)
   - Payment confirmation uses Supabase ✅
   - Full migration needed (Phase 6)

3. **Room G visibility:**
   - No UI for toggling yet (coming in Phase 5)
   - Must use SQL command to change visibility

4. **Notifications:**
   - No real-time notifications yet (Phase 4)
   - Admin must manually check for pending payments

---

## 🐛 Troubleshooting

### Issue: "Mark as Paid" button not showing

**Check:**
1. Booking has `status: 'pending_payment'`
2. Booking has `payment_status: 'pending'`
3. You're logged in as admin (`is_admin: true`)

**Fix:**
```sql
-- Make user admin
UPDATE users SET is_admin = TRUE WHERE email = 'your@email.com';
```

### Issue: Booking creation fails

**Check:**
1. Supabase SQL scripts ran successfully
2. Room exists in database
3. No time conflict with existing bookings

**Debug:**
```sql
-- Check if room exists
SELECT * FROM rooms WHERE id = 1;

-- Check for time conflicts
SELECT * FROM bookings WHERE room_id = 1 AND status != 'cancelled';
```

### Issue: Room G still hidden after SQL update

**Check:**
1. SQL command ran successfully
2. Clear browser cache
3. Refresh rooms list

**Verify:**
```sql
SELECT id, name, hidden FROM rooms WHERE id = 6;
-- hidden should be FALSE
```

---

## 📚 Detailed Documentation

- **Complete Implementation Details:** `ROOM_BOOKING_IMPLEMENTATION_SUMMARY.md`
- **Database Setup Guide:** `supabase/ROOM_BOOKING_SETUP.md`
- **Deployment Guide:** `DEPLOYMENT_GUIDE.md`

---

## ✨ What's Next?

### Phase 4: Admin Notifications (Pending)
- Real-time notification badge for pending payments
- Show count of awaiting bookings
- Browser notifications

### Phase 5: Room Management UI (Pending)
- Create admin panel tab for room management
- Toggle button for room visibility
- Easy Room G control

### Phase 6: Complete Migration (Pending)
- Migrate all localStorage to Supabase
- Update dashboard components
- Update admin stats and calendar

---

## 🎉 You're Ready!

The core cash payment booking system is now functional. Follow the 3 steps above to test it out!

**Need help?** Check the detailed docs or review the code comments in the implementation files.

---

**Quick Links:**
- 📖 [Full Implementation Summary](./ROOM_BOOKING_IMPLEMENTATION_SUMMARY.md)
- 🗄️ [Database Setup Guide](./supabase/ROOM_BOOKING_SETUP.md)
- 🚀 [Deployment Guide](./DEPLOYMENT_GUIDE.md)
