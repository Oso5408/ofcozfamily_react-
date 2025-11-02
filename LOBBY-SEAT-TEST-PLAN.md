# Lobby Seat Booking - Comprehensive Test Plan

## Overview
This test plan covers all functionality for the Lobby Seat (One Day Pass) booking system with DP20 package support.

---

## Test Environment Setup

### Prerequisites
1. ✅ Supabase database updated with Lobby Seat (room ID: 9, capacity: 4)
2. ✅ Test user accounts created:
   - Regular user WITHOUT DP20 balance
   - Regular user WITH DP20 balance (20 visits, not expired)
   - Regular user WITH EXPIRED DP20 package
   - Admin user
3. ✅ Development server running: `npm run dev`

### Test Data Configuration
```sql
-- Create test users with different DP20 states
-- User 1: No DP20
UPDATE users SET dp20_balance = 0, dp20_expiry = NULL
WHERE email = 'test-no-dp20@example.com';

-- User 2: Valid DP20 (20 visits, expires in 60 days)
UPDATE users
SET dp20_balance = 20, dp20_expiry = NOW() + INTERVAL '60 days'
WHERE email = 'test-with-dp20@example.com';

-- User 3: Expired DP20
UPDATE users
SET dp20_balance = 5, dp20_expiry = NOW() - INTERVAL '10 days'
WHERE email = 'test-expired-dp20@example.com';

-- User 4: Low DP20 (expiring soon)
UPDATE users
SET dp20_balance = 2, dp20_expiry = NOW() + INTERVAL '5 days'
WHERE email = 'test-low-dp20@example.com';
```

---

## Test Cases

### 1. Room Display Tests

#### 1.1 Lobby Seat Appears in Rooms List
**Steps:**
1. Navigate to `/rooms` page
2. Locate "Lobby Seat" / "大廳座位" card

**Expected Results:**
- ✅ Lobby Seat card is visible
- ✅ Capacity shows "Up to 4 guests" / "最多 4 位客人"
- ✅ Description mentions:
  - Operating hours: 10:00 AM - 6:30 PM
  - Single visit: $100 per person / 每人 $100
  - DP20 package info
  - Maximum 4 people per time slot
- ✅ "Book" button is clickable

---

### 2. Booking Modal Tests

#### 2.1 Payment Tabs Display
**Steps:**
1. Click "Book" on Lobby Seat
2. Verify payment tabs are visible

**Expected Results:**
- ✅ **TWO tabs visible**:
  - Tab 1: "Cash" / "現金"
  - Tab 2: "DP20 Package" / "DP20 套票"
- ✅ Both tabs are clickable
- ✅ No "Token" tab is shown

**Debug Check:**
- Open browser console
- Look for: `Booking Options: Array(2) ["cash", "dp20"]`

#### 2.2 Cash Tab Content
**Steps:**
1. Select "Cash" tab
2. Fill in booking details

**Expected Results:**
- ✅ Form fields visible:
  - Name (pre-filled from user profile)
  - Email (pre-filled from user profile)
  - Phone (pre-filled from user profile)
  - Date (date picker)
  - Guests (number input, min: 1, max: 4)
- ✅ Time slot is FIXED: 10:00 AM - 6:30 PM (not editable)
- ✅ No hourly time selection

#### 2.3 DP20 Tab Content - User WITH Balance
**Steps:**
1. Login as user WITH valid DP20 balance
2. Click "Book" on Lobby Seat
3. Select "DP20 Package" tab

**Expected Results:**
- ✅ Shows current balance: "DP20 Balance: 20 visits" / "DP20餘額: 20 次"
- ✅ Shows expiry date in green (if > 7 days until expiry)
- ✅ Shows "Required: 1 visit" / "所需DP20: 1次"
- ✅ Shows fixed time slot: 10:00 AM - 6:30 PM
- ✅ NO warning messages
- ✅ Price display shows cash equivalent for reference

#### 2.4 DP20 Tab Content - User WITHOUT Balance
**Steps:**
1. Login as user with 0 DP20 balance
2. Click "Book" on Lobby Seat
3. Select "DP20 Package" tab

**Expected Results:**
- ✅ Shows balance: "DP20 Balance: 0 visits"
- ✅ Shows BLUE informative box (not red error):
  - "📢 You don't have a DP20 package yet" / "您目前沒有DP20套票"
  - Package info: "20 visits for $1000 (90-day validity)"
  - "💡 Contact admin to purchase or learn more"
- ✅ User can still see the form (for education)
- ✅ Submit button should be disabled or show error when clicked

#### 2.5 DP20 Tab Content - Expired Package
**Steps:**
1. Login as user with expired DP20
2. Click "Book" on Lobby Seat
3. Select "DP20 Package" tab

**Expected Results:**
- ✅ Shows balance: "DP20 Balance: 5 visits"
- ✅ Shows expiry date in RED
- ✅ Shows RED warning: "Your DP20 package has expired" / "您的DP20套票已過期"
- ✅ Booking should fail if attempted

#### 2.6 DP20 Tab Content - Expiring Soon
**Steps:**
1. Login as user with DP20 expiring in < 7 days
2. Click "Book" on Lobby Seat
3. Select "DP20 Package" tab

**Expected Results:**
- ✅ Shows balance in ORANGE (if 1-5 visits remaining)
- ✅ Shows expiry date in ORANGE
- ✅ Shows ORANGE warning: "⚠️ Your DP20 package is expiring soon"
- ✅ Booking still allowed if not expired

---

### 3. Price Calculation Tests

#### 3.1 Cash Payment - Single Guest
**Steps:**
1. Select "Cash" tab
2. Set guests = 1
3. Verify price display

**Expected Results:**
- ✅ Total price shows: **HK$100** (not HK$0)
- ✅ Price updates immediately when changing guest count

#### 3.2 Cash Payment - Multiple Guests
**Test Data:**
- 2 guests → HK$200
- 3 guests → HK$300
- 4 guests → HK$400

**Steps:**
1. Select "Cash" tab
2. Change guest count to 2, 3, 4
3. Verify price updates

**Expected Results:**
- ✅ Price = $100 × (number of guests)
- ✅ Price updates in real-time
- ✅ Cannot select more than 4 guests

#### 3.3 DP20 Payment - Price Reference
**Steps:**
1. Select "DP20 Package" tab
2. Set guests = 3
3. Verify price display

**Expected Results:**
- ✅ Shows cash equivalent: **HK$300** (for reference)
- ✅ Also shows: "DP20 Required: 1 visit"
- ✅ Price calculation same as cash (guests × $100)

---

### 4. Booking Submission Tests

#### 4.1 Cash Booking - Success Flow
**Steps:**
1. Fill all required fields:
   - Name: "Test User"
   - Email: "test@example.com"
   - Phone: "12345678"
   - Date: Tomorrow
   - Guests: 2
2. Select "Cash" tab
3. Click "Confirm Booking"

**Expected Results:**
- ✅ Booking created in database
- ✅ Status: "pending" (awaiting payment)
- ✅ Total cost: $200 (2 guests × $100)
- ✅ Payment method: "cash"
- ✅ Receipt upload modal appears
- ✅ Success toast: "Booking submitted"
- ✅ Redirected to dashboard

**Database Verification:**
```sql
SELECT * FROM bookings
WHERE room_id = 9
ORDER BY created_at DESC
LIMIT 1;
```
Should show:
- `payment_method = 'cash'`
- `total_cost = 200`
- `status = 'pending'`

#### 4.2 DP20 Booking - Success Flow (WITH Balance)
**Steps:**
1. Login as user with DP20 balance = 20
2. Fill booking form (guests = 3)
3. Select "DP20 Package" tab
4. Click "Confirm Booking"

**Expected Results:**
- ✅ Booking created successfully
- ✅ DP20 balance deducted: 20 → 19
- ✅ Status: "confirmed" (no payment needed)
- ✅ Success toast: "DP20 Visit Deducted - 1 visit has been deducted. Remaining: 19 visits"
- ✅ Redirected to dashboard
- ✅ Booking appears in "My Bookings"

**Database Verification:**
```sql
-- Check booking
SELECT * FROM bookings WHERE room_id = 9 ORDER BY created_at DESC LIMIT 1;
-- Should show: payment_method = 'dp20', status = 'confirmed'

-- Check user balance
SELECT dp20_balance FROM users WHERE email = 'test-with-dp20@example.com';
-- Should show: dp20_balance = 19
```

#### 4.3 DP20 Booking - Insufficient Balance
**Steps:**
1. Login as user with DP20 balance = 0
2. Try to book with DP20 tab

**Expected Results:**
- ✅ Submit button disabled OR
- ✅ Error toast: "Insufficient DP20 Balance"
- ✅ Error message: "This booking requires 1 visit. Your available balance: 0"
- ✅ Booking NOT created
- ✅ No balance deduction

#### 4.4 DP20 Booking - Expired Package
**Steps:**
1. Login as user with expired DP20
2. Try to book with DP20 tab

**Expected Results:**
- ✅ Error toast: "Your DP20 package has expired"
- ✅ Booking NOT created
- ✅ Redirected back or stays on form

#### 4.5 Maximum Capacity Enforcement
**Steps:**
1. Try to set guests = 5 (more than capacity)

**Expected Results:**
- ✅ Input field limited to max value of 4
- ✅ Cannot manually type number > 4
- ✅ If somehow bypassed, backend should reject

---

### 5. Time Slot Tests

#### 5.1 Fixed Time Slot Display
**Steps:**
1. Open booking modal for Lobby Seat

**Expected Results:**
- ✅ NO hourly time picker shown
- ✅ Fixed time displayed: "10:00 AM - 6:30 PM"
- ✅ Gray box with "Fixed time slot" label
- ✅ Cannot change start/end time

#### 5.2 Booking Stored with Correct Times
**Steps:**
1. Create a booking for Lobby Seat

**Database Verification:**
```sql
SELECT
  start_time,
  end_time,
  TO_CHAR(start_time, 'HH24:MI') as start_display,
  TO_CHAR(end_time, 'HH24:MI') as end_display
FROM bookings
WHERE room_id = 9
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Results:**
- ✅ `start_display = '10:00'`
- ✅ `end_display = '18:30'`
- ✅ Same date for both timestamps

---

### 6. Admin Panel Tests

#### 6.1 Assign DP20 Package
**Steps:**
1. Login as admin
2. Go to Admin Panel → Users tab
3. Scroll to "DP20 Package Assignment" (green card)
4. Select user: "test-no-dp20@example.com"
5. Enter reason: "Testing"
6. Click "Assign DP20 Package (+20 visits)"

**Expected Results:**
- ✅ Success toast: "DP20 package assigned successfully"
- ✅ User's DP20 balance shows: 20 visits
- ✅ Expiry date shows: 90 days from now
- ✅ Record in package_history table

**Database Verification:**
```sql
-- Check user balance
SELECT dp20_balance, dp20_expiry
FROM users
WHERE email = 'test-no-dp20@example.com';
-- Should show: dp20_balance = 20, dp20_expiry = NOW() + 90 days

-- Check history
SELECT * FROM package_history
WHERE user_id = (SELECT id FROM users WHERE email = 'test-no-dp20@example.com')
ORDER BY created_at DESC
LIMIT 1;
-- Should show: package_type = 'DP20', br_amount = 20, reason = 'Testing'
```

#### 6.2 View Lobby Seat Bookings
**Steps:**
1. Admin → Bookings tab
2. Filter by Lobby Seat

**Expected Results:**
- ✅ All Lobby Seat bookings visible
- ✅ Shows payment method: "Cash" or "DP20"
- ✅ Shows correct total cost
- ✅ Can view booking details
- ✅ Can update booking status

---

### 7. Dashboard Tests

#### 7.1 View DP20 Balance in Profile
**Steps:**
1. Login as user with DP20 balance
2. Go to Dashboard

**Expected Results:**
- ✅ Profile section shows DP20 badge: "DP20: 20"
- ✅ Badge color: Green gradient (from-green-100 to-teal-200)
- ✅ If expiry exists, shows expiry date box
- ✅ Shows expiry status:
  - Green: > 7 days remaining
  - Orange: < 7 days remaining ("Expiring soon")
  - Red: Expired ("已過期")

#### 7.2 View Lobby Seat Booking in My Bookings
**Steps:**
1. Create Lobby Seat booking
2. Go to Dashboard → My Bookings tab

**Expected Results:**
- ✅ Booking appears in list
- ✅ Shows: "Lobby Seat" / "大廳座位"
- ✅ Shows payment badge:
  - Cash: Blue badge "Cash Payment" / "現金支付"
  - DP20: Green badge "DP20 Package"
- ✅ Shows number of guests
- ✅ Shows date and time: 10:00 AM - 6:30 PM
- ✅ Shows booking status

---

### 8. Edge Cases & Error Handling

#### 8.1 Booking on Same Date Multiple Times
**Steps:**
1. Create booking for Lobby Seat on 2025-11-05
2. Try to create another booking for same date

**Expected Results:**
- ✅ Should ALLOW (multiple people can book same time slot)
- ✅ System tracks total guests across all bookings
- ✅ Should prevent if total guests would exceed 4

**Note:** Current implementation may not enforce this - needs review.

#### 8.2 Booking in the Past
**Steps:**
1. Try to select a past date

**Expected Results:**
- ✅ Date picker min value = today
- ✅ Cannot select past dates
- ✅ If bypassed, backend should reject

#### 8.3 Network Error During Booking
**Steps:**
1. Disconnect network
2. Try to submit booking

**Expected Results:**
- ✅ Error toast: "Network error" or "Failed to create booking"
- ✅ User stays on booking page
- ✅ Can retry after network restored

#### 8.4 Concurrent DP20 Bookings
**Scenario:** Two users with DP20 balance try to book simultaneously

**Steps:**
1. User A starts booking (balance = 1)
2. User B starts booking (different user, balance = 1)
3. User A submits first
4. User B submits second

**Expected Results:**
- ✅ User A: Success, balance → 0
- ✅ User B: Error, "Insufficient balance" (if same user) OR Success (if different user)

---

### 9. Localization Tests

#### 9.1 English Display
**Steps:**
1. Set language to English
2. Navigate to Lobby Seat booking

**Expected Results:**
- ✅ Room name: "Lobby Seat"
- ✅ Tabs: "Cash", "DP20 Package"
- ✅ Description shows English text
- ✅ Pricing: "$100 per person"
- ✅ Time: "10:00 AM - 6:30 PM"

#### 9.2 Chinese Display
**Steps:**
1. Set language to Chinese
2. Navigate to Lobby Seat booking

**Expected Results:**
- ✅ Room name: "大廳座位"
- ✅ Tabs: "現金", "DP20 套票"
- ✅ Description shows Chinese text
- ✅ Pricing: "每人 $100"
- ✅ Time: "10:00-18:30"
- ✅ Capacity: "每時段最多4人"

---

### 10. Mobile Responsiveness Tests

#### 10.1 Mobile View - Booking Modal
**Steps:**
1. Resize browser to mobile size (375px width)
2. Open Lobby Seat booking

**Expected Results:**
- ✅ Modal fits screen width
- ✅ Tabs stack vertically or wrap properly
- ✅ Form fields are full width
- ✅ Guest number input is tappable
- ✅ Buttons are large enough to tap

---

## Test Results Template

### Test Execution Date: __________
### Tester: __________
### Environment: Development / Staging / Production

| Test ID | Test Case | Status | Notes |
|---------|-----------|--------|-------|
| 1.1 | Room Display | ⬜ Pass ⬜ Fail | |
| 2.1 | Payment Tabs | ⬜ Pass ⬜ Fail | |
| 2.2 | Cash Tab | ⬜ Pass ⬜ Fail | |
| 2.3 | DP20 With Balance | ⬜ Pass ⬜ Fail | |
| 2.4 | DP20 Without Balance | ⬜ Pass ⬜ Fail | |
| 2.5 | DP20 Expired | ⬜ Pass ⬜ Fail | |
| 2.6 | DP20 Expiring Soon | ⬜ Pass ⬜ Fail | |
| 3.1 | Price - Single Guest | ⬜ Pass ⬜ Fail | |
| 3.2 | Price - Multiple Guests | ⬜ Pass ⬜ Fail | |
| 3.3 | Price - DP20 Reference | ⬜ Pass ⬜ Fail | |
| 4.1 | Cash Booking Success | ⬜ Pass ⬜ Fail | |
| 4.2 | DP20 Booking Success | ⬜ Pass ⬜ Fail | |
| 4.3 | DP20 Insufficient Balance | ⬜ Pass ⬜ Fail | |
| 4.4 | DP20 Expired Package | ⬜ Pass ⬜ Fail | |
| 4.5 | Max Capacity Enforcement | ⬜ Pass ⬜ Fail | |
| 5.1 | Fixed Time Slot | ⬜ Pass ⬜ Fail | |
| 5.2 | Time Storage | ⬜ Pass ⬜ Fail | |
| 6.1 | Assign DP20 | ⬜ Pass ⬜ Fail | |
| 6.2 | View Bookings | ⬜ Pass ⬜ Fail | |
| 7.1 | DP20 Badge Display | ⬜ Pass ⬜ Fail | |
| 7.2 | Booking in Dashboard | ⬜ Pass ⬜ Fail | |
| 8.1-8.4 | Edge Cases | ⬜ Pass ⬜ Fail | |
| 9.1-9.2 | Localization | ⬜ Pass ⬜ Fail | |
| 10.1 | Mobile Responsive | ⬜ Pass ⬜ Fail | |

---

## Known Issues & Limitations

### Current Limitations:
1. ⚠️ Lobby Seat doesn't enforce total capacity across concurrent bookings (e.g., if 4 bookings each with 2 guests = 8 total)
2. ⚠️ No waitlist system if capacity is full
3. ⚠️ DP20 balance deduction happens after booking creation (potential race condition)

### Future Enhancements:
1. Add capacity management across all bookings for same date
2. Add email notifications when DP20 is expiring
3. Add auto-renewal option for DP20 packages
4. Add usage analytics for Lobby Seat

---

## Quick Test Checklist (5-Minute Smoke Test)

**Before any deployment, run these critical tests:**

1. ✅ Lobby Seat appears in rooms list
2. ✅ Both Cash and DP20 tabs are visible when booking
3. ✅ Price shows correctly: 2 guests = $200 (not $0)
4. ✅ DP20 balance deducts correctly after booking
5. ✅ Booking appears in dashboard after creation

---

## Regression Test After Updates

Run all tests in this document whenever:
- Database schema changes (rooms, bookings, users tables)
- BookingModal.jsx is modified
- roomService.js is modified
- Price calculation logic changes
- DP20 deduction logic changes

---

**Test Plan Version:** 1.0
**Last Updated:** 2025-11-02
**Maintained By:** Development Team
