# BR Package Bug Fix & Testing Guide

## 🐛 The Problem

When users tried to book rooms using BR packages (BR15 or BR30), they received an "Insufficient BR Balance" error even though they had BR balance. The UI showed they had BR (e.g., 15 BR), but the system said they had 0 BR.

## 🔍 Root Causes Identified

### 1. **Database Columns Missing**
The `br15_balance` and `br30_balance` columns might not exist in the database if the migration wasn't run.

### 2. **Stale Profile Data**
When an admin assigns a BR package, the user's browser doesn't automatically refresh their profile, so they see outdated balance information.

### 3. **No Package Auto-Selection**
Users had to manually select which BR package to use (BR15 or BR30), and if they selected the wrong one (e.g., BR15 when they have balance in BR30), they'd get an error.

## ✅ Fixes Applied

### 1. **Database Verification Script**
Created: `supabase/VERIFY-AND-FIX-BR-COLUMNS.sql`

This script:
- Checks if BR balance columns exist
- Adds them if they don't (safe to run multiple times)
- Creates the package_history table
- Sets up proper RLS policies
- Verifies everything is working

### 2. **Real-Time Profile Updates**
Updated: `src/contexts/AuthContext.jsx`

Added:
- Real-time subscription to profile changes
- Automatic profile refresh when admin updates BR balance
- Manual `refreshProfile()` function for debugging

### 3. **Auto-Select BR Package**
Updated: `src/components/BookingModal.jsx`

Added:
- Automatic selection of BR package with sufficient balance
- Disabled empty packages (grayed out with "無餘額" label)
- Auto-refresh profile when booking modal opens
- Clear warning when both packages are empty

### 4. **Better Error Messages**
Updated: `src/pages/BookingPage.jsx`

Now shows:
- Which package was selected (BR15 or BR30)
- How much BR is required
- How much BR you actually have
- Example: "您的BR15套票餘額不足。此預約需要 3 BR，但您只有 0 BR。"

## 🧪 Testing Procedure

### **STEP 1: Fix Database (Run in Supabase SQL Editor)**

1. Open Supabase Dashboard → SQL Editor
2. Run the entire script: `supabase/VERIFY-AND-FIX-BR-COLUMNS.sql`
3. Verify output shows:
   ```
   br15_balance | integer | 0 | NO
   br30_balance | integer | 0 | NO
   ```
4. Check the final verification:
   ```
   status: BR columns setup complete!
   ```

### **STEP 2: Assign BR Package (Admin Panel)**

1. Log in as admin
2. Go to Admin Panel → Users Tab
3. Find a test user
4. Click "Assign BR Package"
5. Select "BR15" or "BR30"
6. Click "Assign"
7. Verify the user's balance updates in the UI

### **STEP 3: Test Real-Time Updates**

**Setup:**
1. Open two browser windows side-by-side
2. Window 1: Admin logged in
3. Window 2: Regular user logged in

**Test:**
1. In Window 1 (Admin): Assign BR15 package (15 BR) to the user
2. In Window 2 (User): Watch the console logs
3. You should see: `🔔 Profile updated in database: {...}`
4. The user's BR balance should update **automatically** without page refresh

### **STEP 4: Test Booking with BR15**

1. Log in as a user who has BR15 balance (15 BR)
2. Navigate to Rooms page
3. Select a room (e.g., Room A)
4. Click "Book Now"
5. **Check the booking modal:**
   - ✅ BR15 should be **automatically selected** (blue highlight)
   - ✅ Should show "BR15餘額: 15 BR"
   - ✅ BR30 should be grayed out (if balance is 0)
6. Select date, start time (e.g., 20:00), end time (e.g., 21:00)
7. **Check required BR:**
   - Should show "所需BR: 1個"
8. Fill in purpose and special requests
9. Check "Agree to Terms"
10. Click "確認" (Confirm)
11. **Verify success:**
    - Should see "BR 已扣除" toast
    - Should say "已從 BR15 扣除 1 BR"
    - Booking should be created
    - Should redirect to Dashboard

**Check in Database:**
```sql
SELECT email, br15_balance, br30_balance FROM users WHERE email = 'test@example.com';
```
- br15_balance should now be 14 (15 - 1)

### **STEP 5: Test Booking with BR30**

1. Have admin assign BR30 package (30 BR) to user
2. User should see real-time update in console
3. Follow same steps as Step 4, but:
   - BR30 should auto-select
   - Deduction should come from BR30

### **STEP 6: Test Error Cases**

**Case 1: Insufficient BR**
1. User has BR15 with 1 BR remaining
2. Try to book 2 hours (requires 2 BR)
3. Should see error: "您的BR15套票餘額不足。此預約需要 2 BR，但您只有 1 BR。"

**Case 2: Empty Packages**
1. User has 0 BR in both packages
2. Open booking modal
3. Should see yellow warning: "⚠️ 您的 BR 套票餘額為 0。將使用一般 Token 進行預約。"
4. Both BR15 and BR30 buttons should be grayed out with "無餘額"

**Case 3: Mixed Balances**
1. User has BR15: 5 BR, BR30: 0 BR
2. Open booking modal
3. BR15 should auto-select
4. BR30 should be disabled
5. User can still manually switch to BR30 (disabled, can't click)

### **STEP 7: Test Profile Refresh**

**In browser console:**
```javascript
// Get the refreshProfile function from React DevTools or add a button
const { refreshProfile } = useAuth();
await refreshProfile();
```

Should see:
```
🔄 Manually refreshing profile for user: [uuid]
✅ Profile refreshed: { br15_balance: 15, br30_balance: 30, ... }
```

## 🔍 Debugging Checklist

If the issue persists, check:

### 1. **Database Columns Exist**
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name LIKE 'br%balance';
```
Should return: `br15_balance`, `br30_balance`

### 2. **User Has Balance**
```sql
SELECT email, br15_balance, br30_balance FROM users;
```

### 3. **RLS Policies Allow Reading**
```sql
SELECT * FROM pg_policies WHERE tablename = 'users';
```
Should have: "Users can view their own data" and "Enable read access for authenticated users"

### 4. **Real-Time Subscription is Active**
In browser console, should see:
```
🔔 Setting up real-time profile subscription for user: [uuid]
```

### 5. **Profile Refreshes on Modal Open**
When opening booking modal, should see:
```
🔄 Refreshing profile to get latest BR balance...
✅ Profile refreshed successfully: { br15_balance: 15, ... }
```

## 📊 Expected Console Logs

### **On Admin Assigning BR Package:**
```
🎫 Assigning BR package: { userId, packageType: 'BR15', adminId }
📖 Fetching current balance...
✅ User data: { br15_balance: 0 }
💰 New balance will be: 15
💾 Updating balance...
✅ Balance updated successfully
📝 Creating package history record...
✅ Package history created
```

### **On User Side (Real-Time):**
```
🔔 Profile updated in database: { br15_balance: 15, ... }
```

### **On Opening Booking Modal:**
```
🔄 Refreshing profile to get latest BR balance...
✅ Profile refreshed successfully: { br15_balance: 15, br30_balance: 0, ... }
```

### **On Booking:**
```
💳 Processing payment: { selectedBRPackage: 'BR15', requiredTokens: 1 }
🎫 Deducting from BR package: BR15
💳 Deducting BR balance: { userId, brAmount: 1, packageType: 'BR15' }
📖 Fetching current balance...
✅ User data: { br15_balance: 15 }
💰 Current balance: 15 Required: 1
💰 New balance will be: 14
💾 Updating balance...
✅ Balance updated successfully
```

## 🎯 Success Criteria

✅ Database has br15_balance and br30_balance columns
✅ Admin can assign BR packages
✅ User's balance updates in real-time (no page refresh needed)
✅ BookingModal auto-selects correct BR package
✅ Empty packages are disabled and grayed out
✅ Booking successfully deducts from correct BR package
✅ Error messages are clear and show exact balance
✅ User can book with BR15, BR30, and regular tokens

## 🚨 Common Issues & Solutions

### Issue: "Column br15_balance does not exist"
**Solution:** Run `VERIFY-AND-FIX-BR-COLUMNS.sql` in Supabase SQL Editor

### Issue: Profile doesn't update after admin assigns BR
**Solution:**
1. Check browser console for subscription messages
2. Manually refresh the page
3. Try opening/closing the booking modal (triggers refresh)

### Issue: UI shows 15 BR but error says 0 BR
**Solution:**
1. Run the SQL verification script
2. Check if the user actually has the balance in database:
   ```sql
   SELECT * FROM users WHERE email = 'user@example.com';
   ```
3. Open booking modal to trigger profile refresh

### Issue: Can't select BR package
**Solution:**
- Check if package has balance (might be 0)
- Packages with 0 balance are intentionally disabled
- Have admin assign BR package first

## 📝 Quick Test Commands

### Check user balance:
```sql
SELECT email, br15_balance, br30_balance, tokens FROM users WHERE email = 'test@example.com';
```

### Manually set balance for testing:
```sql
UPDATE users SET br15_balance = 15, br30_balance = 30 WHERE email = 'test@example.com';
```

### View package history:
```sql
SELECT u.email, ph.package_type, ph.br_amount, ph.created_at
FROM package_history ph
JOIN users u ON ph.user_id = u.id
ORDER BY ph.created_at DESC;
```

### Check bookings:
```sql
SELECT b.id, u.email, b.payment_method, b.total_cost, b.status
FROM bookings b
JOIN users u ON b.user_id = u.id
ORDER BY b.created_at DESC LIMIT 10;
```

## ✅ Completion

Once all tests pass, the BR package system is working correctly! Users can now:
- Receive BR packages from admin
- See their balance update in real-time
- Book rooms using BR packages
- See clear error messages if insufficient balance
