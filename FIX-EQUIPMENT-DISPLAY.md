# Fix: Equipment Not Showing in Admin Panel

## Problem
When users select equipment during booking (table, chair, beauty bed, massage bed, whiteboard), the equipment information is not displayed in the admin panel booking details.

## Root Cause
The `bookings` table in the database was missing columns to store:
- `equipment` - Array of equipment items with quantities
- `purpose` - Booking purpose/business nature
- `guests` - Number of guests
- `special_requests` - Special requests/notes

## Solution

### 1. Database Migration (REQUIRED)

Run this SQL migration in Supabase SQL Editor:

```bash
supabase/add-booking-details-columns.sql
```

This will add the following columns to the `bookings` table:
- `equipment` (JSONB) - Stores equipment as: `[{"type": "table", "quantity": 2}]`
- `purpose` (TEXT) - Stores booking purpose
- `guests` (INTEGER) - Stores number of guests (default: 1)
- `special_requests` (TEXT) - Stores special requests

### 2. Code Changes (COMPLETED ✅)

**a) Updated `src/services/bookingService.js`**
   - `createBooking()` (lines 47-66): Now saves equipment, purpose, guests, special_requests
   - `adminCreateBooking()` (lines 732-747): Also saves equipment, purpose, guests, special_requests

**b) Updated `src/pages/BookingPage.jsx`** (lines 314-331)
   - Now passes equipment, purpose, guests, specialRequests to createBooking service
   - Previously only passed basic booking info

**c) Updated `src/components/admin/AdminCreateBookingModal.jsx`** (lines 373-400)
   - Extracts equipment, purpose, guests, specialRequests from notes JSON
   - Passes them as separate fields to adminCreateBooking service
   - Keeps only user contact info in notes field

**d) Updated `src/components/admin/AdminBookingsTab.jsx`** (lines 1005-1021)
   - Added equipment display section with blue background
   - Shows each equipment item with quantity
   - Format: "• 枱: 2 個" or "• Table: 2 pc(s)"

**e) Updated `src/components/BookingModal.jsx`** (lines 891-978)
   - Changed token payment equipment UI from simple input to +/- buttons
   - Now consistent with cash/DP20 payment methods

## How to Apply the Fix

### Step 1: Run Database Migration
1. Go to Supabase Dashboard → SQL Editor
2. Open and run `supabase/add-booking-details-columns.sql`
3. Verify columns were added (query at end of script shows results)

### Step 2: Test the Fix
1. Create a new booking with equipment selection
2. Check equipment items (e.g., 2 tables, 4 chairs)
3. Go to Admin Panel → Bookings
4. Verify equipment shows in blue box:
   ```
   設備需求：
   • 枱: 2 個
   • 椅: 4 個
   ```

## Display Format

### Admin Panel
- **Section Title**: "設備需求：" (Equipment Required:)
- **Background**: Blue (bg-blue-50, border-blue-200)
- **Format**: Bullet list with equipment name and quantity
- **Example**:
  ```
  設備需求：
  • 枱: 2 個
  • 椅: 4 個
  • 按摩床: 1 個
  ```

### User Dashboard
- Same format as admin panel
- Shows in user's booking details

## Technical Details

### Equipment Data Structure
Stored as JSONB array in database:
```json
[
  {"type": "table", "quantity": 2},
  {"type": "chair", "quantity": 4},
  {"type": "massageBed", "quantity": 1}
]
```

### Translation Keys
Equipment labels from `src/data/translations/zh/booking.js`:
```javascript
equipmentOptions: {
  "table": "枱",
  "chair": "椅",
  "beautyBed": "美容床",
  "massageBed": "按摩床",
  "whiteboard": "白板"
}
```

## What Was Fixed

1. ✅ Database schema - Added missing columns
2. ✅ Booking creation - Now saves equipment data
3. ✅ Admin panel - Displays equipment in booking details
4. ✅ Token payment UI - Added +/- buttons for equipment quantity
5. ✅ Consistency - All payment methods now show same equipment interface

## Status

- **Database Migration**: ✅ COMPLETED (columns added)
- **Code Changes**: ✅ COMPLETED
- **Testing**: ⏳ READY TO TEST

## Notes

- Old bookings (before migration) will have empty equipment array
- New bookings will include full equipment details
- Equipment display only shows if equipment array is not empty
- Purpose, guests, and special_requests also now saved and can be displayed
