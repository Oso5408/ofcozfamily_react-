# Fix: Package History Expiry Date Cannot Be Updated

## Problem
When admin tries to edit the expiry date (到期日) in the package history table, it still shows "無限期" (Unlimited) after saving. This is because the database is missing the UPDATE policy for admins.

## Root Cause
The `package_history` table has RLS (Row Level Security) enabled, but only has these policies:
- ✅ SELECT policy for users (read their own)
- ✅ SELECT policy for admins (read all)
- ✅ INSERT policy for admins (create new)
- ❌ **MISSING: UPDATE policy for admins** (edit existing)

Without an UPDATE policy, even admins cannot modify the `expiry_date` field.

## Solution

### Step 1: Run the Migration SQL

Go to your Supabase dashboard:
1. Open your project
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase/add-package-history-update-policy.sql`
5. Click **Run**

The SQL file will:
- Ensure the `expiry_date` column exists
- Create an UPDATE policy that allows admins to edit package history records

### Step 2: Verify the Policy Was Created

After running the migration, you should see output showing the policies for `package_history`. You should now see:
- `Users can view own package history` (SELECT)
- `Admins can view all package history` (SELECT)
- `Admins can insert package history` (INSERT)
- **`Admins can update package history` (UPDATE)** ← NEW!

### Step 3: Test the Feature

1. Log in as admin
2. Go to a user detail page (e.g., `/admin_test`)
3. Scroll to the **代幣記錄** (Package History) section
4. Click the edit icon (✏️) next to any expiry date
5. Select a new date from the date picker
6. Click **保存** (Save)
7. The date should now update successfully! 🎉

## What Each File Does

### Backend (Database):
- `supabase/add-package-history-columns.sql` - Adds `expiry_date` column to `package_history` table
- `supabase/add-package-history-update-policy.sql` - **NEW!** Adds UPDATE policy for admins

### Frontend (UI):
- `src/pages/UserDetailPage.jsx` - Shows edit button and handles the update logic
- Functions added:
  - `handleEditExpiry()` - Opens edit mode for a row
  - `handleSaveExpiry()` - Saves the new expiry date to Supabase
  - `handleCancelEdit()` - Cancels editing

## Common Issues

### Issue 1: "Permission denied" error
**Cause:** The UPDATE policy wasn't created successfully
**Fix:** Re-run the SQL migration and check for errors

### Issue 2: Still shows "無限期" after update
**Cause:** The expiry_date column might not exist
**Fix:** Run this SQL to check:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'package_history'
AND column_name = 'expiry_date';
```

### Issue 3: Update seems to work but date doesn't change
**Cause:** Browser cache
**Fix:** Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

## Testing Checklist

- [ ] SQL migration runs without errors
- [ ] Policy appears in Supabase dashboard
- [ ] Admin can click edit icon on expiry date
- [ ] Date picker appears with current date pre-filled
- [ ] Admin can select a new date
- [ ] Clicking "保存" shows success toast
- [ ] Expiry date updates in the table
- [ ] Refreshing the page shows the new date

## Summary

The edit expiry date feature was implemented in the frontend but was missing the backend permission. After running the SQL migration, admins will be able to update expiry dates for all package history records.
