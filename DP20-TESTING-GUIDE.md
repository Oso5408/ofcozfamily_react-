# DP20 Day Pass Package - Complete Testing Guide

## 🎯 Overview

This guide walks you through testing the complete DP20 (Day Pass 20 visits) package system for Lobby Seat bookings.

**What is DP20?**
- **Package**: 20 visits for $1000 (HK$50 per visit)
- **Validity**: 90 days from assignment
- **Usage**: Lobby Seat bookings only (10:00-18:30)
- **Deduction**: 1 visit per booking

---

## ✅ Pre-Testing Checklist

Before starting, ensure:
- [ ] Development server is running (`npm run dev`)
- [ ] Supabase project is accessible
- [ ] You have admin access to the application
- [ ] You have a test user account (non-admin)

---

## 📋 Step-by-Step Testing

### **STEP 1: Run Database Migration**

**Location:** Supabase Dashboard → SQL Editor

**Action:** Copy and run the entire contents of:
```
supabase/add-dp20-package-system.sql
```

**Expected Output:**
```
✅ DP20 columns added
✅ Package types updated
✅ Sample User DP20 Data
🎉 DP20 Package System migration complete!
```

**Verification:**
```sql
-- Check columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('dp20_balance', 'dp20_expiry');

-- Should return:
-- dp20_balance  | integer
-- dp20_expiry   | timestamp with time zone
```

---

### **STEP 2: Verify Lobby Seat Room**

**Action:** Navigate to Rooms page in your app

**Check:**
- [ ] "Lobby Seat" (大廳座位) appears in room list
- [ ] Room shows capacity: 1 guest
- [ ] Features include: WiFi, Cat-friendly environment
- [ ] Description mentions DP20 package and pricing

**Expected:**
- Single day pass: $100
- DP20 package: $1000 for 20 visits (90-day validity)

---

### **STEP 3: Admin - Assign DP20 Package**

#### 3.1 Login as Admin
**Navigate to:** `/admin` → Users tab

#### 3.2 Find DP20 Assignment Section
**Look for:** Green gradient card titled "分配 DP20 套票" / "Assign DP20 Package"

#### 3.3 Assign Package
1. **Select User:** Choose a test user from dropdown
2. **Reason (Optional):** Enter "Testing DP20 system"
3. **Click:** "分配 DP20 套票 (+20次)" / "Assign DP20 Package (+20 visits)"

**Expected Success Toast:**
```
✅ DP20 套票已分配
已成功分配 DP20 套票 (20次, 90日有效) - 原因: Testing DP20 system
```

#### 3.4 Verify Balance Display
**Check in Admin Panel:**
- [ ] User's DP20 balance shows: **20 visits**
- [ ] Expiry date shows: **90 days from now**
- [ ] User list shows green badge: "DP20: 20"

**Verify in Database:**
```sql
SELECT email, dp20_balance, dp20_expiry
FROM users
WHERE email = 'test@example.com';

-- Should show:
-- dp20_balance: 20
-- dp20_expiry: [90 days from now]
```

---

### **STEP 4: User Dashboard - View DP20 Balance**

#### 4.1 Login as Test User
**Navigate to:** `/dashboard`

#### 4.2 Check Profile Section
**Look for:**
- [ ] Green badge showing "DP20: 20"
- [ ] Green box showing expiry date
- [ ] "DP20 有效期至: [date]" / "DP20 valid until: [date]"

**Screenshot Location:** Top of dashboard, next to BR15 and BR30 badges

---

### **STEP 5: Book Lobby Seat with DP20**

#### 5.1 Navigate to Lobby Seat
**Go to:** Rooms → Click "Lobby Seat" → Click "預約此房間" / "Book This Room"

#### 5.2 Fill Booking Form
1. **Name:** [Auto-filled from profile]
2. **Email:** [Auto-filled]
3. **Phone:** [Auto-filled or enter]
4. **Date:** Select tomorrow's date

#### 5.3 Select DP20 Payment Tab
**Check:**
- [ ] Three tabs visible: "套票" (Token), "時租" (Cash), **"DP20 套票"**
- [ ] Click on "DP20 套票" tab

**Expected Display:**
```
┌─────────────────────────────────────────┐
│ DP20 Package                             │
├─────────────────────────────────────────┤
│ 剩餘次數: DP20 Balance: 20 visits        │
│ 有效期至: Valid until: [date]           │
│                                          │
│ DP20 Required: 1 visit                   │
│ (10:00-18:30)                            │
│                                          │
│ ┌─────────────────────────────────────┐ │
│ │ 使用時段 / Time Slot                  │ │
│ │ 10:00 AM - 6:30 PM                   │ │
│ │ 固定時段 / Fixed time slot            │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### 5.4 Complete Booking
1. **Guests:** 1 (default)
2. **Business Nature:** Select one or more purposes
3. **Special Requests:** Enter or check "不需要" / "Not needed"
4. **Terms:** Check "I agree to terms and conditions"
5. **Click:** "確認預約" / "Confirm Booking"

**Expected Success Toast:**
```
✅ DP20 已扣除
已從 DP20 套票扣除 1 次使用。剩餘 19 次。
```

#### 5.5 Verify Deduction
**Check Dashboard:**
- [ ] DP20 badge now shows: **"DP20: 19"**
- [ ] Expiry date unchanged

**Check Database:**
```sql
SELECT email, dp20_balance, dp20_expiry
FROM users
WHERE email = 'test@example.com';

-- Should show:
-- dp20_balance: 19
-- dp20_expiry: [same as before]
```

**Check Booking Created:**
```sql
SELECT * FROM bookings
WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com')
ORDER BY created_at DESC
LIMIT 1;

-- Verify:
-- room_id: 9 (Lobby Seat)
-- booking_type: should show payment method
-- status: pending or confirmed
```

---

### **STEP 6: Test Balance Validation**

#### 6.1 Reduce Balance to 0
**As Admin:**
1. Go to Admin → Users
2. Update user's DP20 balance to 0 via SQL:
```sql
UPDATE users
SET dp20_balance = 0
WHERE email = 'test@example.com';
```

#### 6.2 Try Booking with 0 Balance
**As User:**
1. Go to Lobby Seat booking
2. Select DP20 tab
3. Try to book

**Expected:**
- [ ] Red warning box: "DP20 餘額不足" / "Insufficient DP20 Balance"
- [ ] Booking should fail with error toast

---

### **STEP 7: Test Expiry Validation**

#### 7.1 Set Package as Expired
**Run SQL:**
```sql
UPDATE users
SET dp20_balance = 10,
    dp20_expiry = NOW() - INTERVAL '1 day'
WHERE email = 'test@example.com';
```

#### 7.2 Check Dashboard Display
**As User:**
- [ ] Expiry shows in **red**: "(已過期)" / "(Expired)"
- [ ] Warning message: "您的DP20套票已過期"

#### 7.3 Try Booking with Expired Package
**Expected:**
- [ ] Booking fails
- [ ] Error: "DP20 package has expired"

---

### **STEP 8: Test Expiring Soon Warning**

#### 8.1 Set Package to Expire in 5 Days
**Run SQL:**
```sql
UPDATE users
SET dp20_balance = 15,
    dp20_expiry = NOW() + INTERVAL '5 days'
WHERE email = 'test@example.com';
```

#### 8.2 Check Warnings
**Dashboard:**
- [ ] Orange warning: "(即將到期)" / "(Expiring soon)"

**Booking Modal:**
- [ ] Orange warning box: "⚠️ 您的DP20套票即將到期"

---

### **STEP 9: Admin Package History**

#### 9.1 View Assignment History
**Run SQL:**
```sql
SELECT
  u.email,
  ph.package_type,
  ph.br_amount as visits,
  ph.reason,
  ph.assigned_at,
  admin.email as assigned_by
FROM package_history ph
JOIN users u ON ph.user_id = u.id
JOIN users admin ON ph.assigned_by = admin.id
WHERE ph.package_type = 'DP20'
ORDER BY ph.assigned_at DESC;
```

**Verify:**
- [ ] Shows DP20 assignments
- [ ] Includes reason: "Testing DP20 system"
- [ ] Shows admin who assigned it

---

### **STEP 10: Multi-User Test**

#### 10.1 Assign DP20 to Multiple Users
**As Admin:**
1. Assign DP20 to User A
2. Assign DP20 to User B
3. Assign DP20 to User C

#### 10.2 Verify Independent Balances
**Each user should have:**
- [ ] Their own 20 visits
- [ ] Their own 90-day expiry
- [ ] Independent of other users

#### 10.3 Test Simultaneous Bookings
**Have users book at the same time:**
- [ ] User A books → balance: 19
- [ ] User B books → balance: 19
- [ ] User C balance unchanged: 20

---

## 🐛 Common Issues & Solutions

### Issue 1: DP20 Tab Not Showing
**Cause:** Room doesn't have 'dp20' in bookingOptions

**Fix:**
```javascript
// Check roomsData.js - Lobby Seat should have:
bookingOptions: ['cash', 'dp20']
```

### Issue 2: Balance Not Deducting
**Cause:** Missing deductDP20Balance call

**Check:** `src/pages/BookingPage.jsx` line ~312
```javascript
if (bookingData.bookingType === 'dp20' && !user?.isAdmin) {
  const dp20Result = await deductDP20Balance(user.id);
  // ...
}
```

### Issue 3: Expiry Not Showing
**Cause:** User doesn't have dp20_expiry set

**Fix:**
```sql
-- Manually set expiry
UPDATE users
SET dp20_expiry = NOW() + INTERVAL '90 days'
WHERE dp20_balance > 0 AND dp20_expiry IS NULL;
```

### Issue 4: Translation Missing
**Symptom:** Seeing "{balance}" or "{date}" literally

**Fix:** Check translations exist:
- `src/data/translations/en/booking.js` - Lines 57-66
- `src/data/translations/zh/booking.js` - Lines 56-65

### Issue 5: Admin Can't See DP20 Section
**Cause:** Component not updated or cache issue

**Fix:**
1. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
2. Check `src/components/admin/AdminUsersTab.jsx` has DP20 Card

---

## 📊 Verification Checklist

### Database
- [ ] `users.dp20_balance` column exists (INTEGER)
- [ ] `users.dp20_expiry` column exists (TIMESTAMP WITH TIME ZONE)
- [ ] `package_history` accepts 'DP20' type
- [ ] `check_dp20_valid()` function exists

### Frontend - Admin
- [ ] DP20 assignment section visible
- [ ] User dropdown works
- [ ] Reason field works
- [ ] Assign button works
- [ ] Success toast shows
- [ ] Current balance displays
- [ ] User list shows DP20 badge

### Frontend - User
- [ ] Dashboard shows DP20 balance
- [ ] Dashboard shows expiry date
- [ ] Expiry warnings work (expired/expiring soon)
- [ ] Lobby Seat booking shows DP20 tab
- [ ] DP20 balance displays correctly
- [ ] Time slot shows as 10:00-18:30
- [ ] Booking succeeds
- [ ] Balance deducts correctly

### Business Logic
- [ ] Can assign 20 visits
- [ ] Expiry set to 90 days from assignment
- [ ] 1 visit deducted per booking
- [ ] Cannot book with 0 balance
- [ ] Cannot book with expired package
- [ ] Warnings for expiring packages (< 7 days)

---

## 🎉 Success Criteria

**DP20 system is fully functional when:**

1. ✅ Admin can assign DP20 packages with reason tracking
2. ✅ Users can see their DP20 balance and expiry in dashboard
3. ✅ Lobby Seat shows DP20 as payment option
4. ✅ Bookings deduct 1 visit from balance
5. ✅ Expired packages are blocked
6. ✅ Expiring packages show warnings
7. ✅ All balances are independent per user
8. ✅ Package history is recorded
9. ✅ Bilingual support works (EN/ZH)
10. ✅ No console errors during operation

---

## 🚀 Production Deployment Checklist

Before deploying to production:

- [ ] Run database migration on production Supabase
- [ ] Test with real admin account
- [ ] Test with real user account
- [ ] Verify email notifications (if applicable)
- [ ] Check mobile responsive display
- [ ] Verify all translations
- [ ] Test edge cases (0 balance, expired, etc.)
- [ ] Review package_history records
- [ ] Backup database before deployment
- [ ] Monitor first 10 real bookings

---

## 📞 Support

If you encounter issues:

1. **Check console logs** - Look for errors starting with ❌
2. **Check Supabase logs** - Dashboard → Logs
3. **Verify database** - Run verification queries above
4. **Review code** - Files changed listed in implementation summary

**Key Files:**
- Database: `supabase/add-dp20-package-system.sql`
- Backend: `src/contexts/AuthContext.jsx` (lines 407-581)
- Booking Flow: `src/pages/BookingPage.jsx` (lines 22, 311-341)
- Booking UI: `src/components/BookingModal.jsx` (lines 561-626)
- Admin Panel: `src/components/admin/AdminUsersTab.jsx` (lines 25, 34-35, 141-198, 375-442)
- Dashboard: `src/components/dashboard/ProfileSection.jsx` (lines 101-132)
- Room Data: `src/data/roomsData.js` (lines 98-109)
- Translations: `src/data/translations/*/booking.js` and `common.js`

---

## 🎊 Congratulations!

If all tests pass, your DP20 Day Pass Package system is ready for production! 🚀

Users can now purchase and use 20-visit packages for Lobby Seat bookings with automatic expiry tracking and balance management.
