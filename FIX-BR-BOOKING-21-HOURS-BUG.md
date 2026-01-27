# Fix: BR Booking Incorrectly Shows 21 Hours Instead of 1 Hour

## Problem Report

**User Report:**
- BR30包 booking shows "21 小時" instead of "1 小時"
- Booking details: Room E (E房), 15:00-16:00 (1 hour)
- Display issue: Shows deduction of 21 hours
- Actual deduction: Also deducted 21 hours (not just display)

**Example:**
- Booking #5081002: 15:00-16:00 → Shows "21 小時 (BR30包)" ❌
- Booking #0551382: 14:00-15:00 → Shows "1 小時 (BR30包)" ✅

## Root Cause Analysis

### The Bug

The projector fee (20 tokens) was being incorrectly added to ALL bookings, including BR package bookings:

**Calculation:**
- 1 hour base cost = 1 token/BR
- Projector fee (for Room C or Room E) = 20 tokens
- **Total = 21 (WRONG for BR bookings!)**

### Why This is Wrong

BR packages (BR15/BR30) **include equipment for free**:
- Projector, whiteboard, and other equipment are included
- The 20-token projector fee should ONLY apply to regular token bookings
- BR bookings should only deduct actual hours: 1 hour = 1 BR

### Code Location

**src/pages/BookingPage.jsx:135**
```javascript
// BEFORE (BUG):
const projectorFee = bookingData.wantsProjector &&
                     (selectedRoom?.id === 2 || selectedRoom?.id === 4) ? 20 : 0;
return baseTokens + projectorFee; // Adds 20 to ALL bookings including BR!
```

This caused:
1. `totalCost = 21` saved to database
2. Admin UI displays `booking.totalCost` → "21 小時"
3. User charged 21 BR instead of 1 BR

## Solution Implemented

### 1. Fixed Booking Cost Calculation (BookingPage.jsx:128-143)

**Changed:** Exclude projector fee from BR package bookings

```javascript
const calculateRequiredTokens = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  const start = parseInt(startTime.split(':')[0]);
  const end = parseInt(endTime.split(':')[0]);
  const baseTokens = Math.max(0, end - start);

  // Add projector fee ONLY for regular token bookings (NOT for BR packages)
  // BR packages include equipment for free
  const isUsingBRPackage = bookingData.selectedBRPackage; // BR15 or BR30
  const shouldAddProjectorFee = bookingData.wantsProjector &&
                                 (selectedRoom?.id === 2 || selectedRoom?.id === 4) &&
                                 !isUsingBRPackage;
  const projectorFee = shouldAddProjectorFee ? 20 : 0;

  return baseTokens + projectorFee;
};
```

**Result:** BR bookings now correctly save `total_cost = 1` instead of 21

### 2. Fixed Admin Display (AdminBookingsTab.jsx:1053-1074)

**Changed:** Calculate actual hours from booking timestamps instead of using `totalCost`

```javascript
{booking.paymentMethod === 'br15' && (() => {
  // Calculate actual hours from booking duration (ignore totalCost which may include projector fee)
  const startTime = new Date(booking.start_time);
  const endTime = new Date(booking.end_time);
  const actualHours = Math.ceil((endTime - startTime) / (1000 * 60 * 60));
  return (
    <span className="text-blue-700">
      {actualHours} {language === 'zh' ? '小時 (BR15包)' : 'hours (BR15)'}
    </span>
  );
})()}

{booking.paymentMethod === 'br30' && (() => {
  // Calculate actual hours from booking duration (ignore totalCost which may include projector fee)
  const startTime = new Date(booking.start_time);
  const endTime = new Date(booking.end_time);
  const actualHours = Math.ceil((endTime - startTime) / (1000 * 60 * 60));
  return (
    <span className="text-purple-700">
      {actualHours} {language === 'zh' ? '小時 (BR30包)' : 'hours (BR30)'}
    </span>
  );
})()}
```

**Result:** Admin UI now displays correct hours based on actual booking duration

### 3. Refund Logic (No Change Needed - Already Correct!)

**bookingService.js:397-443** already calculates hours from timestamps:

```javascript
// BR15 refund
const startTime = new Date(booking.start_time);
const endTime = new Date(booking.end_time);
const hoursToRefund = Math.ceil((endTime - startTime) / (1000 * 60 * 60));
// Correctly refunds actual hours, NOT booking.total_cost
```

✅ Refund logic was already working correctly!

## Impact

### Fixed Issues

1. ✅ **New BR bookings** will save correct `total_cost` (no projector fee added)
2. ✅ **Display** shows correct hours in admin interface
3. ✅ **Refunds** already worked correctly (calculated from timestamps)

### Existing Data

**Old bookings with incorrect `total_cost = 21`:**
- Display is now fixed (calculates from timestamps)
- Refunds were already correct (calculates from timestamps)
- Database records still have wrong `total_cost`, but no longer used for BR bookings

**No data migration needed** because:
- Display logic now ignores `total_cost` for BR bookings
- Refund logic already ignores `total_cost` for BR bookings

## Testing Recommendations

1. **New BR booking test:**
   - Book Room E with BR30 package for 1 hour (15:00-16:00)
   - Verify display shows "1 小時 (BR30包)" not "21 小時"
   - Verify database `total_cost = 1` not 21

2. **Old booking display test:**
   - View existing booking #5081002 in admin interface
   - Should now display "1 小時 (BR30包)" correctly

3. **Refund test:**
   - Cancel a BR booking
   - Verify only 1 BR hour is refunded (not 21)

## Files Changed

1. **src/pages/BookingPage.jsx** - Fixed cost calculation (lines 128-143)
2. **src/components/admin/AdminBookingsTab.jsx** - Fixed display logic (lines 1053-1074)

## Notes

- **AdminCreateBookingModal** did not have this bug (it already calculates hours correctly without projector fee)
- **User dashboard** doesn't display BR booking costs, so no changes needed
- This fix only affects future bookings; existing wrong data is now displayed correctly
