# Room Description Edit Fix

## Problem
Admin could not edit room descriptions without uploading images. The Edit Room Modal only showed image upload functionality, not description editing fields.

## Solution Implemented

### 1. Database Migration
**File**: `supabase/add-room-description-columns.sql`

Added two new columns to the `rooms` table:
- `description_en` (TEXT) - English description
- `description_zh` (TEXT) - Chinese description

**To Apply**:
```sql
-- Run this SQL in Supabase SQL Editor
-- See: supabase/add-room-description-columns.sql
```

### 2. Room Service Update
**File**: `src/services/roomService.js`

Added new method `updateRoomDescriptions()`:
- Updates both English and Chinese descriptions
- Works independently of image uploads
- Returns updated room object

### 3. Edit Room Modal Updates
**File**: `src/components/admin/EditRoomModal.jsx`

**Changes Made**:
1. Added two Textarea fields for descriptions (English & Chinese)
2. Loads descriptions from database (`description_en`, `description_zh`)
3. Falls back to translation files if database fields are empty
4. Saves descriptions FIRST, then handles images
5. Success messages updated to reflect description saves

**New Behavior**:
- ✅ Can edit descriptions without uploading images
- ✅ Can edit images without changing descriptions
- ✅ Can edit both at the same time
- ✅ Descriptions always save when clicking "Save" button
- ✅ Images can be reordered/hidden without re-uploading

## Files Modified

1. `supabase/add-room-description-columns.sql` - NEW database migration
2. `src/services/roomService.js` - Added `updateRoomDescriptions()` method
3. `src/components/admin/EditRoomModal.jsx` - Added description fields and save logic

## Testing Steps

1. **Apply Database Migration**:
   - Go to Supabase Dashboard → SQL Editor
   - Run the migration file: `supabase/add-room-description-columns.sql`

2. **Test Description Editing**:
   - Go to Admin Panel → 房間管理 (Room Management)
   - Click "編輯房間" (Edit Room) on any room
   - You should see two new text areas:
     - 房間描述（英文）
     - 房間描述（中文）
   - Edit the descriptions
   - Click "儲存" (Save) WITHOUT uploading new images
   - ✅ Should show success message: "房間描述已成功更新"

3. **Test Image Reordering Without Description Change**:
   - Open Edit Room Modal
   - Use arrow buttons to reorder images
   - Click "儲存" (Save)
   - ✅ Images should reorder, descriptions remain unchanged

4. **Test Combined Save**:
   - Edit descriptions AND upload new images
   - Click "儲存" (Save)
   - ✅ Both should save successfully

## Bug Fixes Included

### Bug #1: Lobby Seat DP20 Booking Error
**File**: `src/pages/BookingPage.jsx`
- Added DP20 cost calculation logic
- Fixed `total_cost` null error
- Lobby Seat bookings with DP20 now work correctly

### Bug #2: Room Description Edit Without Images
**File**: `src/components/admin/EditRoomModal.jsx`
- Added description input fields
- Separated description save from image save
- Can now save descriptions independently

## Next Steps

1. Apply the database migration in Supabase
2. Refresh the admin panel
3. Test description editing functionality
4. All changes are ready to commit to GitHub when you say so!
