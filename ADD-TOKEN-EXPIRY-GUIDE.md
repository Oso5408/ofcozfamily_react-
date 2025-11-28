# Add Token Expiry Dates - Quick Guide

## What This Does

Adds expiry date display for BR15 and BR30 packages on the user dashboard (matching the existing DP20 expiry display).

## Current Status

- ✅ **Frontend**: Already built and ready
- ✅ **DP20**: Already has expiry dates working
- ❌ **BR15 & BR30**: Missing database columns (what we're fixing)

## How to Enable

### Step 1: Run SQL Migration

1. **Open Supabase Dashboard** → Your Project → SQL Editor
2. **Copy the entire content** of:
   ```
   supabase/add-br-expiry-columns.sql
   ```
3. **Paste and Click "Run"**
4. Wait for success message: "🎉 BR15 and BR30 expiry columns migration complete!"

### Step 2: Test It (Optional)

Assign a test BR15 package with expiry to see it work:

```sql
-- Replace 'user-email@example.com' with a real user email
UPDATE public.users
SET
  br15_balance = 15,
  br15_expiry = NOW() + INTERVAL '180 days'
WHERE email = 'user-email@example.com';
```

Then visit the user detail page in admin panel and you'll see:
```
BR 15 小時
15
有效期至: 23/05/2025
```

## What Gets Added

### Database Columns

| Table | Column | Type | Description |
|-------|--------|------|-------------|
| `users` | `br15_expiry` | TIMESTAMP | BR15 package expiry date |
| `users` | `br30_expiry` | TIMESTAMP | BR30 package expiry date |

### Helper Functions

- `check_br15_valid(user_id)` - Returns true if user has valid BR15 (balance > 0 and not expired)
- `check_br30_valid(user_id)` - Returns true if user has valid BR30 (balance > 0 and not expired)

### Indexes

- `idx_users_br15_expiry` - Fast queries for BR15 expiry
- `idx_users_br30_expiry` - Fast queries for BR30 expiry

## Visual Result

**Before** (current):
```
┌──────────────────────────┐
│ BR 15 小時               │
│ 尚餘代幣數量              │
│                          │
│ 15                       │
│                          │  ← No expiry shown
│ [+ 增值] [- 扣除]        │
└──────────────────────────┘
```

**After** (with migration):
```
┌──────────────────────────┐
│ BR 15 小時               │
│ 尚餘代幣數量              │
│                          │
│ 15                       │
│ 有效期至: 23/05/2025     │  ← Expiry shown!
│ [+ 增值] [- 扣除]        │
└──────────────────────────┘
```

## When Assigning Packages

When you add BR15/BR30 packages via the admin panel, make sure to also set the expiry:

```sql
-- 180 days is standard for BR packages
UPDATE public.users
SET
  br15_balance = br15_balance + 15,
  br15_expiry = NOW() + INTERVAL '180 days'
WHERE id = 'user-uuid';

-- Or 30 days for BR30
UPDATE public.users
SET
  br30_balance = br30_balance + 30,
  br30_expiry = NOW() + INTERVAL '180 days'
WHERE id = 'user-uuid';
```

## Expiry Display Logic

- **If expiry is set**: Shows "有效期至: dd/mm/yyyy"
- **If expired**: Shows "有效期至: dd/mm/yyyy (已過期)" in red
- **If no expiry set**: Shows nothing (package never expires)

## No Code Changes Needed!

The frontend already has all the code to display expiry dates - it's just waiting for the database columns to exist. Once you run the SQL migration, the expiry dates will automatically appear! 🎉
