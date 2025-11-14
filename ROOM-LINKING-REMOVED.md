# Room B and Room C Linking - REMOVED

## Summary
Room B (id=1) and Room C (id=2) linking has been **completely removed**. They can now be booked at the same time independently.

## Changes Made

### 1. Database Function Updated ✅
**File:** `supabase/remove-room-linking.sql`

**Action Required:** Run this SQL in your Supabase SQL Editor:

```sql
-- Drop the existing function
DROP FUNCTION IF EXISTS check_room_availability(INTEGER, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, UUID);

-- Create updated function WITHOUT linked room logic
CREATE OR REPLACE FUNCTION check_room_availability(
  p_room_id INTEGER,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  -- Check for overlapping bookings in the SAME room only
  -- No more linked room logic - each room is independent
  SELECT COUNT(*) INTO conflict_count
  FROM public.bookings
  WHERE room_id = p_room_id  -- Only check the specific room
    AND status NOT IN ('cancelled')
    AND (id IS DISTINCT FROM p_exclude_booking_id)
    AND tstzrange(start_time, end_time) && tstzrange(p_start_time, p_end_time);

  -- Return true if no conflicts found
  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;
```

### 2. Frontend Code Updated ✅
**File:** `src/lib/timeUtils.js`

Removed linked room logic from three functions:
- `generateTimeOptions()` (line 40-43)
- `generateEndTimeOptions()` (line 140-143)
- `checkDailySlotConflict()` (line 263-266)

**Before:**
```javascript
// Room B (id=1) and Room C (id=2) are linked
if (roomId === 1 || roomId === 2) {
  return booking.room_id === 1 || booking.room_id === 2;
}
return booking.room_id === roomId;
```

**After:**
```javascript
// Check bookings for the specific room only - no room linking
return booking.room_id === roomId;
```

## Testing Instructions

### Test Case: Book Room B and Room C at Same Time

1. **Book Room B:**
   - Date: 2025-12-04 (or any future date)
   - Time: 19:30 - 21:30
   - Complete the booking

2. **Book Room C (same time):**
   - Date: 2025-12-04 (same date)
   - Time: 19:30 - 21:30
   - This should now **succeed** ✅

3. **Expected Result:**
   - Both bookings should be created successfully
   - No "already booked" error
   - Both rooms show as booked in admin calendar

### What Was Fixed

**Problem:** When Room B was booked from 19:30-21:30, Room C was automatically blocked for the same time period (and vice versa).

**Root Cause:** The system had linked room logic treating Room B and Room C as one combined space with a removable partition wall.

**Solution:** Removed all linking logic from both database and frontend. Each room is now completely independent.

## Verification Queries

Run these in Supabase SQL Editor to verify the fix:

```sql
-- Check current function definition
SELECT prosrc
FROM pg_proc
WHERE proname = 'check_room_availability';
-- Should NOT contain "ARRAY[1, 2]" or linked room logic

-- Test availability check for Room C when Room B is booked
SELECT check_room_availability(
  2,  -- Room C
  '2025-12-04 19:30:00+00',
  '2025-12-04 21:30:00+00'
);
-- Should return TRUE (available) even if Room B is booked at this time
```

## Notes

- No migration needed for existing bookings
- Changes take effect immediately after applying SQL
- Frontend changes are already live (hot reload in dev mode)
- This change is **irreversible** - if you need to re-link rooms later, you'll need to reapply the linking logic
