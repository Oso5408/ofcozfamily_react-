# Auto-Clear Expired Packages Setup Guide

## Overview

This guide explains how to set up automatic deduction of expired package balances (BR15, BR30, DP20) in your system.

## What This Does

When a package expires:
1. ✅ Balance is automatically set to **0**
2. ✅ Transaction is logged in `package_history` with reason "Expired on [date]"
3. ✅ User can no longer use the expired credits
4. ✅ Admin can see the expiry history in the package records

---

## Step 1: Run the SQL Migration

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy the entire contents of `supabase/auto-clear-expired-packages.sql`
3. Click **Run**

### What It Creates:

**Functions:**
- `clear_expired_packages(user_id)` - Clears expired packages for one user
- `clear_all_expired_packages()` - Batch clears expired packages for all users
- `trigger_clear_expired_packages()` - Trigger function that runs automatically

**Trigger:**
- `auto_clear_expired_packages_on_update` - Runs when user data is updated

---

## Step 2: Set Up Automatic Daily Cleanup (Recommended)

### Option A: Supabase Edge Functions (Recommended)

Create a scheduled Edge Function that runs daily:

```typescript
// supabase/functions/clear-expired-packages/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Run the batch clear function
    const { data, error } = await supabaseClient.rpc("clear_all_expired_packages");

    if (error) throw error;

    console.log("✅ Cleared expired packages:", data);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleared expired packages for ${data?.length || 0} users`,
        data,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
```

**Deploy:**
```bash
supabase functions deploy clear-expired-packages
```

**Schedule (using Supabase Cron or external service):**
- Set up a daily cron job to call this function at midnight
- Use services like Vercel Cron, GitHub Actions, or Supabase Cron Jobs

### Option B: GitHub Actions (Free)

Create `.github/workflows/clear-expired-packages.yml`:

```yaml
name: Clear Expired Packages

on:
  schedule:
    # Run daily at 00:00 UTC
    - cron: '0 0 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  clear-expired:
    runs-on: ubuntu-latest
    steps:
      - name: Clear Expired Packages
        run: |
          curl -X POST \
            '${{ secrets.SUPABASE_URL }}/rest/v1/rpc/clear_all_expired_packages' \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json"
```

### Option C: Manual Run (For Testing)

Run manually in Supabase SQL Editor:

```sql
-- Clear expired packages for all users
SELECT * FROM clear_all_expired_packages();
```

---

## Step 3: Test the Auto-Clear Functionality

### Test 1: Create a User with Expired Package

```sql
-- Create test user with expired BR15 package
UPDATE public.users
SET
  br15_balance = 10,
  br15_expiry = NOW() - INTERVAL '1 day' -- Expired yesterday
WHERE email = 'test@example.com';

-- Verify expiry
SELECT
  email,
  br15_balance,
  br15_expiry,
  br15_expiry <= NOW() AS is_expired
FROM public.users
WHERE email = 'test@example.com';
```

### Test 2: Manually Clear Expired Packages

```sql
-- Clear expired packages for this user
SELECT * FROM clear_expired_packages(
  (SELECT id FROM public.users WHERE email = 'test@example.com')
);

-- Verify balance is now 0
SELECT
  email,
  br15_balance,
  br15_expiry
FROM public.users
WHERE email = 'test@example.com';

-- Check package_history for expiry log
SELECT
  package_type,
  br_amount,
  reason,
  notes,
  created_at
FROM public.package_history
WHERE user_id = (SELECT id FROM public.users WHERE email = 'test@example.com')
ORDER BY created_at DESC
LIMIT 5;
```

Expected result:
- ✅ `br15_balance` should be **0**
- ✅ `package_history` should have a new record with negative amount
- ✅ `notes` should say "Auto-cleared: Package expired"

### Test 3: Batch Clear All Expired Packages

```sql
-- Find all users with expired packages
SELECT
  email,
  br15_balance,
  br15_expiry,
  br30_balance,
  br30_expiry,
  dp20_balance,
  dp20_expiry
FROM public.users
WHERE
  (br15_balance > 0 AND br15_expiry <= NOW()) OR
  (br30_balance > 0 AND br30_expiry <= NOW()) OR
  (dp20_balance > 0 AND dp20_expiry <= NOW());

-- Clear all expired packages
SELECT * FROM clear_all_expired_packages();

-- Verify all balances are 0
SELECT
  email,
  br15_balance,
  br30_balance,
  dp20_balance
FROM public.users
WHERE
  (br15_expiry IS NOT NULL AND br15_expiry <= NOW()) OR
  (br30_expiry IS NOT NULL AND br30_expiry <= NOW()) OR
  (dp20_expiry IS NOT NULL AND dp20_expiry <= NOW());
```

---

## How It Works

### Automatic Clearing (Trigger-based)

The trigger runs **BEFORE UPDATE** on the `users` table:

1. **When user data is updated** (e.g., balance change, profile update):
   - Trigger checks if any packages are expired
   - If expired, automatically clears the balance
   - Logs the expiry to `package_history`

2. **When does it run?**
   - When admin assigns new packages
   - When user attempts to book
   - When profile is updated
   - When any UPDATE query hits the `users` table

### Manual Clearing (Scheduled Job)

For comprehensive cleanup, run `clear_all_expired_packages()` daily:

1. Scans all users with expired packages
2. Clears each expired balance
3. Logs to package_history
4. Returns summary of cleared packages

---

## Package History Logging

When a package expires and is cleared, a new record is added to `package_history`:

| Field | Value |
|-------|-------|
| `package_type` | BR15, BR30, or DP20 |
| `br_amount` | **Negative** (e.g., -15 for BR15) |
| `notes` | "Auto-cleared: Package expired" |
| `reason` | "Expired on 2025-12-09 00:00:00+00" |
| `created_at` | Timestamp when cleared |

This appears in the admin UI under "代幣記錄" with:
- ✅ Package type and negative amount in red
- ✅ Details showing "Auto-cleared: Package expired"
- ✅ **No expiry date** (because it's a deduction, not a purchase)

---

## Monitoring & Maintenance

### Check for Upcoming Expiries (7 days warning)

```sql
-- Find users with packages expiring in next 7 days
SELECT
  email,
  full_name,
  br15_balance,
  br15_expiry,
  (br15_expiry - NOW())::TEXT AS time_remaining
FROM public.users
WHERE br15_expiry BETWEEN NOW() AND NOW() + INTERVAL '7 days'
AND br15_balance > 0
ORDER BY br15_expiry ASC;
```

### View Expiry Statistics

```sql
-- Count users with expired packages
SELECT
  COUNT(*) FILTER (WHERE br15_balance > 0 AND br15_expiry <= NOW()) AS expired_br15_count,
  COUNT(*) FILTER (WHERE br30_balance > 0 AND br30_expiry <= NOW()) AS expired_br30_count,
  COUNT(*) FILTER (WHERE dp20_balance > 0 AND dp20_expiry <= NOW()) AS expired_dp20_count
FROM public.users;
```

### View Recent Auto-Clearances

```sql
-- Show recent auto-cleared packages
SELECT
  u.email,
  ph.package_type,
  ph.br_amount,
  ph.reason,
  ph.created_at
FROM public.package_history ph
JOIN public.users u ON ph.user_id = u.id
WHERE ph.notes = 'Auto-cleared: Package expired'
ORDER BY ph.created_at DESC
LIMIT 20;
```

---

## Troubleshooting

### Issue: Balances not clearing automatically

**Solution:**
1. Check if the trigger is enabled:
   ```sql
   SELECT * FROM pg_trigger
   WHERE tgname = 'auto_clear_expired_packages_on_update';
   ```

2. Manually run the clear function:
   ```sql
   SELECT * FROM clear_all_expired_packages();
   ```

### Issue: Permission errors

**Solution:**
```sql
-- Grant execute permissions
GRANT EXECUTE ON FUNCTION clear_expired_packages TO authenticated;
GRANT EXECUTE ON FUNCTION clear_all_expired_packages TO authenticated;
```

### Issue: Trigger not firing

**Note:** PostgreSQL triggers only run on INSERT/UPDATE/DELETE, not SELECT.
The trigger runs when user data is **updated**, which happens frequently in normal operations.

For guaranteed daily cleanup, use the scheduled job approach (Step 2).

---

## Summary

✅ **Automatic on user updates:** Trigger clears expired packages whenever user data is modified
✅ **Daily batch cleanup:** Scheduled job ensures all expired packages are cleared
✅ **Full audit trail:** All expiries are logged to `package_history`
✅ **Admin visibility:** Expired packages show as deductions in the UI

**Next Steps:**
1. Run `supabase/auto-clear-expired-packages.sql` in Supabase
2. Set up daily scheduled job (GitHub Actions or Edge Function)
3. Test with a user that has an expired package
4. Monitor the package_history table for auto-clear logs
