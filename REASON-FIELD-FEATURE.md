# ✅ Reason Field Feature - Token & BR Package Management

## Overview

Added "Reason" input fields to both Token Management and BR Package Assignment sections in the Admin Panel. This allows admins to record why tokens or BR packages were added to user accounts.

---

## What Changed

### 1. UI Updates (Admin Panel)

**Token Management Section:**
```
┌──────────────────────────────────────────────────────────────┐
│ Manage Tokens                                                 │
├──────────────────────────────────────────────────────────────┤
│ Select User | Token Amount | Reason          | [+] Add [-] Remove │
│ John Doe    | 5            | Promotion gift  | [Add] [Remove]  │
└──────────────────────────────────────────────────────────────┘
```

**BR Package Assignment Section:**
```
┌──────────────────────────────────────────────────────────────┐
│ Assign BR Packages                                            │
├──────────────────────────────────────────────────────────────┤
│ Select User | Reason                 | Actions               │
│ Jane Smith  | Purchased package      | [BR15] [BR30]         │
└──────────────────────────────────────────────────────────────┘
```

### 2. Database Changes

**New Columns Added:**
- `token_history.reason` (TEXT, nullable)
- `package_history.reason` (TEXT, nullable)

These columns store the admin-provided reason for the transaction.

### 3. Code Changes

**Files Modified:**
- ✅ `src/components/admin/AdminUsersTab.jsx` - Added reason input fields and updated handlers
- ✅ `src/contexts/AuthContext.jsx` - Updated functions to accept reason parameter
- ✅ `src/services/userService.js` - Updated token service to save reason

**Files Created:**
- ✅ `supabase/add-reason-columns.sql` - Database migration script

---

## Features

### Token Management
**Before:**
- Select user
- Enter amount
- Click Add/Remove

**After:**
- Select user
- Enter amount
- **Enter reason** (optional)
- Click Add/Remove

**Examples of reasons:**
- "促銷活動" (Promotion)
- "補償" (Compensation)
- "客戶獎勵" (Customer Reward)
- "測試" (Testing)

### BR Package Management
**Before:**
- Select user
- Click BR15 or BR30

**After:**
- Select user
- **Enter reason** (optional)
- Click BR15 or BR30

**Examples of reasons:**
- "購買套票" (Package Purchase)
- "促銷活動" (Promotion)
- "贈送禮品" (Gift)
- "客戶忠誠獎勵" (Loyalty Reward)

---

## How It Works

### 1. Adding Tokens with Reason

```javascript
// Admin enters:
User: john@example.com
Amount: 10
Reason: "Promotion - New Year Gift"

// System saves to database:
token_history:
{
  user_id: 123,
  change: +10,
  new_balance: 15,
  transaction_type: "top-up",
  reason: "Promotion - New Year Gift",
  created_at: "2025-11-01..."
}
```

### 2. Assigning BR Package with Reason

```javascript
// Admin enters:
User: jane@example.com
Package: BR15
Reason: "Purchased 15-visit package"

// System saves to database:
package_history:
{
  user_id: 456,
  package_type: "BR15",
  br_amount: 15,
  assigned_by: admin_id,
  reason: "Purchased 15-visit package",
  assigned_at: "2025-11-01..."
}
```

---

## Setup Instructions

### Step 1: Run Database Migration

**Go to:** Supabase Dashboard → SQL Editor

**Run:**
```
supabase/add-reason-columns.sql
```

This will:
- ✅ Add `reason` column to `token_history` table
- ✅ Add `reason` column to `package_history` table
- ✅ Verify columns were added successfully
- ✅ Show sample recent records

### Step 2: Test the Feature

1. **Open your app** at `http://localhost:5174/`
2. **Login as admin**
3. **Go to Admin Panel** → Users tab

**Test Token Addition:**
1. Select a user
2. Enter token amount (e.g., 5)
3. Enter reason: "促銷活動" or "Promotion"
4. Click "Add Tokens"
5. ✅ Toast should show reason in description
6. ✅ Reason field should clear after success

**Test BR Package:**
1. Select a user
2. Enter reason: "購買套票" or "Package Purchase"
3. Click "BR15" or "BR30"
4. ✅ Toast should show reason in description
5. ✅ Reason field should clear after success

### Step 3: Verify in Database

Check that reasons are being saved:

```sql
-- View recent token changes with reasons
SELECT
  u.email,
  th.change,
  th.transaction_type,
  th.reason,
  th.created_at
FROM token_history th
JOIN users u ON th.user_id = u.id
ORDER BY th.created_at DESC
LIMIT 10;

-- View recent BR package assignments with reasons
SELECT
  u.email,
  ph.package_type,
  ph.br_amount,
  ph.reason,
  ph.assigned_at
FROM package_history ph
JOIN users u ON ph.user_id = u.id
ORDER BY ph.assigned_at DESC
LIMIT 10;
```

---

## Benefits

### For Admins
✅ **Track why changes were made** - Know the reason behind every adjustment
✅ **Better accountability** - Clear audit trail
✅ **Easier support** - Answer customer questions about balance changes
✅ **Dispute resolution** - Have context for past transactions

### For Business
✅ **Better record keeping** - Understand patterns in adjustments
✅ **Financial audit** - Clear documentation for accounting
✅ **Customer service** - Quick answers to balance inquiries
✅ **Analytics** - Track how often and why adjustments are made

---

## Example Use Cases

### Token Adjustments
| Reason | Scenario |
|--------|----------|
| "促銷活動" | New Year promotion - giving bonus tokens |
| "補償服務問題" | Compensating for service issue |
| "客戶忠誠獎勵" | Rewarding long-term customer |
| "測試" | Testing the system |
| "錯誤調整修正" | Correcting previous mistake |

### BR Package Assignments
| Reason | Scenario |
|--------|----------|
| "購買 BR15 套票" | Customer purchased 15-visit package |
| "促銷贈送" | Promotional gift |
| "升級獎勵" | Upgrade reward |
| "轉移套票" | Transferred from another account |
| "補償" | Compensation for issue |

---

## UI/UX Features

### Input Fields
- **Placeholder text** provides examples
  - ZH: "例如：促銷活動、補償等"
  - EN: "e.g., Promotion, Compensation"
- **Optional** - Can leave blank if reason not needed
- **Auto-clear** - Clears after successful operation

### Toast Notifications
**Without reason:**
```
✅ 代幣已更新
代幣數量已成功更新
```

**With reason:**
```
✅ 代幣已更新
代幣數量已成功更新 - 原因: 促銷活動
```

### Console Logging
All operations log the reason:
```
💰 Updating tokens: {userId: 123, amount: 10, operation: 'add', reason: 'Promotion'}
📝 Reason: Promotion - New Year Gift
```

---

## Validation

### Current Behavior
- ❌ **NOT required** - Reason is optional
- ✅ **NULL in database** - If no reason provided, stores NULL
- ✅ **Any text allowed** - No character limits or restrictions

### Future Enhancements (Optional)
- Add dropdown with common reasons
- Add character limit (e.g., max 200 chars)
- Add validation (e.g., required for certain operations)
- Add multi-language reason templates

---

## Data Flow

```
Admin UI
  ↓
  Enters reason in text field
  ↓
AdminUsersTab.jsx (handleTokenUpdate / handleBRPackageAssignment)
  ↓
  Passes reason parameter
  ↓
AuthContext.jsx (updateUserTokens / assignBRPackage)
  ↓
  Passes reason to service
  ↓
userService.js (updateTokens) / Supabase (assignBRPackage)
  ↓
  Inserts into history table with reason
  ↓
Database (token_history / package_history)
  ✅ Reason saved!
```

---

## Troubleshooting

### Issue: Reason not showing in database

**Check:**
1. Did you run the migration? `supabase/add-reason-columns.sql`
2. Check column exists:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'token_history' AND column_name = 'reason';
```

**Fix:**
- Re-run the migration script

### Issue: Error when saving reason

**Check:**
- Browser console for errors
- Supabase logs (Dashboard → Logs)

**Fix:**
- Verify column type is TEXT
- Check for any RLS policies blocking updates

---

## Summary

✅ **Reason fields added** to both Token and BR Package sections
✅ **Database updated** with new columns
✅ **Code updated** to save and display reasons
✅ **Auto-clear** after successful operations
✅ **Optional** - Can be left blank
✅ **Bilingual** - Works in English and Chinese

**Next Step:** Run `supabase/add-reason-columns.sql` in your Supabase SQL Editor!

🎉 **Feature Complete!**
