# Room Booking System - Database Setup Guide

## Overview

This guide will help you set up the room booking system with cash payment management in Supabase.

## Prerequisites

- Supabase project created
- Basic tables created (users, bookings, rooms)
- Access to Supabase SQL Editor

---

## Step 1: Run Base Schema (If Not Already Done)

If you haven't run the complete setup script yet:

```bash
# In Supabase SQL Editor, run:
supabase/complete-setup.sql
```

---

## Step 2: Add Payment Confirmation Fields

Run this script to add admin payment tracking fields:

```bash
# In Supabase SQL Editor, run:
supabase/booking-payment-fields.sql
```

This adds:
- `admin_notes` - Notes about payment (e.g., "Paid $120 cash")
- `payment_confirmed_at` - Timestamp when admin confirmed payment
- `payment_confirmed_by` - Which admin user confirmed payment
- `pending_payment` status for bookings awaiting payment

---

## Step 3: Seed Rooms Data

Run this script to insert rooms A through H:

```bash
# In Supabase SQL Editor, run:
supabase/seed-rooms.sql
```

This creates:
- **Room A** (ID: 8) - Hidden by default
- **Room B** (ID: 1) - Visible
- **Room C** (ID: 2) - Visible
- **Room D** (ID: 3) - Visible
- **Room E** (ID: 4) - Visible
- **Room F** (ID: 5) - Hidden by default
- **Room G** (ID: 6) - **Hidden (requires manual admin control)**
- **Room H** (ID: 7) - Visible

---

## Verification

After running all scripts, verify the setup:

### Check Rooms

```sql
SELECT id, name, capacity, hidden FROM public.rooms ORDER BY id;
```

Expected result: 8 rooms total, with Room G hidden.

### Check Booking Table Structure

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'bookings'
ORDER BY ordinal_position;
```

Should include: `admin_notes`, `payment_confirmed_at`, `payment_confirmed_by`

### Check Booking Statuses

```sql
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'bookings_status_check';
```

Should include: `pending_payment`, `confirmed`, `cancelled`, `completed`, `no-show`

---

## Room Configuration

### Current Room Status:

| Room | ID | Hidden | Payment Options | Price (Hourly) |
|------|----|----|-----------------|----------------|
| Room A | 8 | ✅ Yes | Token, Cash | $120 |
| Room B | 1 | ❌ No | Token, Cash | $120 |
| Room C | 2 | ❌ No | Cash only | $150 |
| Room D | 3 | ❌ No | Token, Cash | $120 |
| Room E | 4 | ❌ No | Token, Cash | $120 |
| Room F | 5 | ✅ Yes | Token, Cash | $120 |
| Room G | 6 | ✅ **Yes** (Manual control) | Token, Cash | $120 |
| Room H | 7 | ❌ No | Token, Cash | $120 |

### To Make Room G Visible:

Admins can toggle Room G visibility through the Admin Panel (coming in Phase 5), or manually:

```sql
UPDATE public.rooms
SET hidden = FALSE
WHERE id = 6;
```

---

## Booking Status Flow

### For Cash Payments:

```
1. Customer creates booking
   ↓
   status: 'pending_payment'
   payment_status: 'pending'
   payment_method: 'cash'

2. Customer pays at venue
   ↓
   Admin clicks "Mark as Paid"

3. System updates booking
   ↓
   status: 'confirmed'
   payment_status: 'paid'
   payment_confirmed_at: [timestamp]
   payment_confirmed_by: [admin_user_id]
   admin_notes: "Received $120 cash"

4. Booking is confirmed!
```

### For Token Payments:

```
1. Customer creates booking
   ↓
   Tokens deducted immediately
   status: 'confirmed'
   payment_status: 'paid'
   payment_method: 'token'
```

---

## Row Level Security (RLS) Policies

Ensure these policies are set:

### Bookings Table:

**Users can:**
- View their own bookings
- Create bookings for themselves
- Cancel their own bookings (with restrictions)

**Admins can:**
- View all bookings
- Update any booking
- Mark payments as confirmed
- Add admin notes

### Rooms Table:

**Users can:**
- View rooms where `hidden = FALSE`

**Admins can:**
- View all rooms (including hidden)
- Create/update/delete rooms
- Toggle room visibility

---

## Common Queries

### Get All Pending Payment Bookings

```sql
SELECT
  b.*,
  u.full_name,
  u.email,
  r.name as room_name
FROM public.bookings b
JOIN public.users u ON b.user_id = u.id
JOIN public.rooms r ON b.room_id = r.id
WHERE b.payment_status = 'pending'
  AND b.status = 'pending_payment'
ORDER BY b.created_at DESC;
```

### Get Today's Confirmed Bookings

```sql
SELECT
  b.*,
  u.full_name,
  r.name as room_name
FROM public.bookings b
JOIN public.users u ON b.user_id = u.id
JOIN public.rooms r ON b.room_id = r.id
WHERE b.status = 'confirmed'
  AND DATE(b.start_time) = CURRENT_DATE
ORDER BY b.start_time;
```

### Get Revenue by Payment Method

```sql
SELECT
  payment_method,
  COUNT(*) as booking_count,
  SUM(total_cost) as total_revenue
FROM public.bookings
WHERE payment_status = 'paid'
  AND status != 'cancelled'
GROUP BY payment_method;
```

---

## Troubleshooting

### Issue: "relation rooms_id_seq does not exist"

If you get this error when running seed-rooms.sql:

```sql
-- Check if sequence exists
SELECT * FROM information_schema.sequences WHERE sequence_name LIKE '%rooms%';

-- If not, create it
CREATE SEQUENCE IF NOT EXISTS public.rooms_id_seq OWNED BY public.rooms.id;
```

### Issue: Bookings not showing up

Check RLS policies:

```sql
-- Disable RLS temporarily for testing (re-enable after!)
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

-- Re-enable when done testing
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
```

### Issue: Can't update booking status

Ensure admin has proper permissions:

```sql
-- Check if user is admin
SELECT id, email, is_admin FROM public.users WHERE email = 'your-admin@email.com';

-- Make user admin if needed
UPDATE public.users SET is_admin = TRUE WHERE email = 'your-admin@email.com';
```

---

## Next Steps

After database setup:

1. ✅ Run all SQL scripts above
2. ✅ Verify rooms and bookings tables
3. ⏭️ Update frontend to use Supabase (Phase 2)
4. ⏭️ Implement admin payment confirmation UI (Phase 3)
5. ⏭️ Add room management for Room G (Phase 5)

---

**Status:** Database setup complete! 🎉

**Next:** Phase 2 - Update BookingPage.jsx to use Supabase
