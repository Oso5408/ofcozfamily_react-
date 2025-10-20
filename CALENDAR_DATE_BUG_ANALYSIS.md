# Calendar Date Bug: Root Cause Analysis & Prevention Guide

**Date**: 2025-10-20
**Issue**: Calendar export showing wrong year (2026) and incorrect date
**Severity**: High - User-facing data corruption
**Status**: ✅ Fixed in commit `7067725`

---

## 🔍 Bug Summary

When users clicked "Add to Calendar" from the admin bookings page, Google Calendar showed the wrong date and year (e.g., date "21/10/2025" appeared as February 10, 2026).

**Example:**
- **Expected**: October 21, 2025 at 10:00-13:00
- **Actual**: February 10, 2026 at 10:00-13:00 ❌

---

## 📊 Root Cause Analysis

### The Bug Timeline

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Database stores dates in ISO format: "2025-10-21"       │
│    (YYYY-MM-DD - International standard)                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. AdminBookingsTab.jsx formats for display:                │
│    formatDate() converts to "21/10/2025"                    │
│    (DD/MM/YYYY - Common in HK/UK/Europe)                    │
│    Line 48: return `${day}/${month}/${year}`;               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. User clicks "Add to Calendar"                            │
│    booking.date = "21/10/2025"  ← Now in DD/MM/YYYY format │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. calendarUtils.js receives "21/10/2025"                   │
│    BUT assumes "/" means MM/DD/YYYY (American format) ❌    │
│    Line 29-32:                                               │
│      month = parts[0];  // 21 ← WRONG!                      │
│      day = parts[1];    // 10                                │
│      year = parts[2];   // 2025                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Google Calendar receives invalid date                    │
│    new Date(2025, 21, 10) → Month 21 doesn't exist!        │
│    JavaScript overflows to next year → Shows 2026 ❌        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🐛 Why This Bug Happened

### 1. Inconsistent Date Formats Across Codebase
- **Database**: `YYYY-MM-DD` (ISO 8601)
- **Display Layer**: `DD/MM/YYYY` (Hong Kong/European format)
- **Calendar Input**: Expected `YYYY-MM-DD` but received `DD/MM/YYYY`
- **No single source of truth** for date format

### 2. Implicit Format Assumptions
```javascript
// src/lib/calendarUtils.js:28-32 (BEFORE FIX)
if (bookingDate.includes('/')) {
  // Format: MM/DD/YYYY  ← DANGEROUS ASSUMPTION!
  const parts = bookingDate.split('/');
  month = parts[0];  // Assumes American format
  day = parts[1];
  year = parts[2];
}
```

**Problem**: Code assumed "/" always means American format (MM/DD/YYYY), but Hong Kong uses DD/MM/YYYY.

### 3. Data Transformation Without Normalization
- `formatDate()` in AdminBookingsTab transformed data for **display only**
- But this **transformed data was then passed to other functions** expecting original format
- **No clear boundary** between display formatting and data processing

**Anti-pattern:**
```javascript
// AdminBookingsTab.jsx - Transforms data
const normalizedBookings = bookings.map(booking => ({
  ...booking,
  date: formatDate(booking.start_time)  // "21/10/2025" for display
}));

// Later in BookingsTab.jsx - Uses transformed data
openGoogleCalendar(normalizedBookings[0]);  // ❌ Expects ISO format!
```

### 4. Lack of Type Safety
```javascript
// JavaScript allows all of these - no compile-time checks:
booking.date = "21/10/2025";    // DD/MM/YYYY string
booking.date = "2025-10-21";    // YYYY-MM-DD string
booking.date = "10/21/2025";    // MM/DD/YYYY string
booking.date = new Date();      // Date object
// All valid! No way to enforce format at compile time
```

### 5. Silent Failures
JavaScript's `Date` constructor is too forgiving:
```javascript
new Date(2025, 21, 10)  // Month 21 doesn't exist
// ❌ Doesn't throw error! Just overflows to next year
// Result: February 10, 2026
```

**Why it overflows:**
- Month 21 = 12 months + 9 months = January 2026 + 9 months = October 2026
- But with day=10, becomes February 10, 2026
- **No error, no warning, just wrong data**

---

## ✅ The Fix

### Code Changes
**File**: `src/lib/calendarUtils.js`
**Lines**: 22-37

```javascript
// BEFORE (WRONG):
if (bookingDate.includes('/')) {
  // Format: MM/DD/YYYY  ← WRONG ASSUMPTION
  const parts = bookingDate.split('/');
  month = parts[0];  // Thought 21 was the month!
  day = parts[1];
  year = parts[2];
}

// AFTER (CORRECT):
if (bookingDate.includes('/')) {
  // Format: DD/MM/YYYY (formatted for display)
  const parts = bookingDate.split('/');
  day = parts[0];    // Day is first in DD/MM/YYYY
  month = parts[1];  // Month is second
  year = parts[2];   // Year is last
}
```

### What Changed
1. ✅ Corrected the date parsing order for DD/MM/YYYY format
2. ✅ Added clear comments documenting expected formats
3. ✅ Enhanced debug logging to show input date format
4. ✅ Now handles both YYYY-MM-DD (database) and DD/MM/YYYY (display)

---

## 🛡️ Prevention Strategies

### 1. Use a Single Source of Truth for Dates

**❌ Bad (Current Pattern):**
```javascript
// Data layer: YYYY-MM-DD
const dbDate = "2025-10-21";

// Display layer: DD/MM/YYYY
const displayDate = "21/10/2025";

// Different formats everywhere! Confusing!
```

**✅ Good (Recommended):**
```javascript
// ALWAYS store/pass dates in ISO format
const booking = {
  date: "2025-10-21",  // ISO 8601 - ALWAYS
  startTime: "10:00",
  endTime: "13:00"
};

// Only format when displaying to user
const displayDate = formatDateForDisplay(booking.date, language);

// Pass raw ISO date to calendar
openGoogleCalendar(booking);  // booking.date still "2025-10-21"
```

---

### 2. Create a Central Date Utilities Module

**Create**: `/src/lib/dateUtils.js`

```javascript
/**
 * Central date utilities - ALL date operations go through here
 * Prevents inconsistent date handling across the app
 *
 * RULE: All dates in the app should be ISO 8601 (YYYY-MM-DD)
 * Only format for display when rendering to user
 */

// Parse ISO date string to Date object
export const parseISODate = (isoString) => {
  if (!isoString) return null;
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid ISO date: ${isoString}`);
  }
  return date;
};

// Format date for display (localized)
export const formatDateForDisplay = (isoDate, language = 'en') => {
  const date = parseISODate(isoDate);
  if (!date) return '';

  return date.toLocaleDateString(
    language === 'zh' ? 'zh-HK' : 'en-US',
    { year: 'numeric', month: '2-digit', day: '2-digit' }
  );
};

// Format for Google Calendar (always ISO)
export const formatForGoogleCalendar = (isoDate, time) => {
  if (!isValidISODate(isoDate)) {
    throw new Error(`Expected ISO date (YYYY-MM-DD), got: ${isoDate}`);
  }

  const [year, month, day] = isoDate.split('-');
  const [hour, minute] = time.split(':');
  return `${year}${month}${day}T${hour}${minute}00`;
};

// Validate date string is ISO format
export const isValidISODate = (dateString) => {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
};

// Convert DD/MM/YYYY to YYYY-MM-DD (for migration)
export const convertDisplayToISO = (displayDate) => {
  if (!displayDate.includes('/')) return displayDate;  // Already ISO

  const [day, month, year] = displayDate.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};
```

**Usage:**
```javascript
// Display
<div>{formatDateForDisplay(booking.date, language)}</div>

// Calendar
const startDateTime = formatForGoogleCalendar(booking.date, booking.startTime);

// Validation
if (!isValidISODate(booking.date)) {
  throw new Error('Date must be in ISO format');
}
```

---

### 3. Use TypeScript or PropTypes

**Option A: TypeScript (Recommended)**
```typescript
// types/booking.ts
interface Booking {
  id: string;
  date: string;        // ISO format: YYYY-MM-DD
  startTime: string;   // 24h format: HH:MM
  endTime: string;     // 24h format: HH:MM
  room: Room;
  userEmail: string;
  status: BookingStatus;
}

// calendarUtils.ts
function openGoogleCalendar(
  booking: Booking,
  language: 'en' | 'zh',
  translations: Translations
): void {
  // TypeScript enforces the contract
  if (!isValidISODate(booking.date)) {
    throw new Error('Date must be in YYYY-MM-DD format');
  }
  // ...
}
```

**Option B: JSDoc + PropTypes (Minimal change)**
```javascript
import PropTypes from 'prop-types';

/**
 * Open Google Calendar with booking event
 * @param {Object} booking
 * @param {string} booking.date - ISO format YYYY-MM-DD (e.g., "2025-10-21")
 * @param {string} booking.startTime - 24h format HH:MM (e.g., "10:00")
 * @param {string} booking.endTime - 24h format HH:MM (e.g., "13:00")
 * @param {string} language - Language code ('en' or 'zh')
 * @param {Object} translations - Translation object
 */
export const openGoogleCalendar = (booking, language, translations) => {
  // Document expectations clearly
  if (!isValidISODate(booking.date)) {
    throw new Error(`Expected ISO date, got: ${booking.date}`);
  }
  // ...
};

openGoogleCalendar.propTypes = {
  booking: PropTypes.shape({
    date: PropTypes.string.isRequired,  // YYYY-MM-DD
    startTime: PropTypes.string.isRequired,  // HH:MM
    endTime: PropTypes.string.isRequired,  // HH:MM
  }).isRequired,
  language: PropTypes.oneOf(['en', 'zh']).isRequired,
  translations: PropTypes.object.isRequired,
};
```

---

### 4. Add Input Validation Guards

```javascript
export const generateGoogleCalendarUrl = (booking, language, translations) => {
  // GUARD: Validate inputs before processing
  if (!booking.date) {
    throw new Error('Booking date is required');
  }

  if (!booking.startTime || !booking.endTime) {
    throw new Error('Start and end times are required');
  }

  // Normalize to ISO format if needed
  let isoDate = booking.date;
  if (booking.date.includes('/')) {
    console.warn(`⚠️ Non-ISO date detected: ${booking.date}, converting...`);
    isoDate = convertDisplayToISO(booking.date);
  }

  if (!isValidISODate(isoDate)) {
    throw new Error(
      `Invalid date format: ${booking.date}. ` +
      `Expected YYYY-MM-DD or DD/MM/YYYY`
    );
  }

  // Now safely parse
  const [year, month, day] = isoDate.split('-');
  // ...
};
```

---

### 5. Use Date Libraries (date-fns or dayjs)

**❌ Manual parsing (error-prone):**
```javascript
const parts = date.split('/');
const month = parts[0];  // Is this MM/DD or DD/MM? Who knows!
```

**✅ Use `date-fns` (explicit format):**
```javascript
import { parse, format, isValid } from 'date-fns';

// Explicit format specification - no ambiguity
const date = parse('21/10/2025', 'dd/MM/yyyy', new Date());

// Validate
if (!isValid(date)) {
  throw new Error('Invalid date');
}

// Format for calendar (unambiguous)
const isoDate = format(date, 'yyyy-MM-dd');  // "2025-10-21"
```

**Installation:**
```bash
npm install date-fns
```

---

### 6. Separate Display Logic from Data Logic

**❌ Bad (Current pattern):**
```javascript
// normalizeBooking transforms data for display AND passes to other functions
const normalizedBookings = bookings.map(booking => ({
  ...booking,
  date: formatDate(booking.start_time)  // "21/10/2025" for display
}));

// Later used in calendar (expects YYYY-MM-DD!)
openGoogleCalendar(normalizedBookings[0]);  // ❌ Breaks!
```

**✅ Good (Separation of concerns):**
```javascript
// Keep raw data untouched
const booking = {
  id: 1,
  date: "2025-10-21",  // ALWAYS ISO
  startTime: "10:00",
  endTime: "13:00"
};

// Create separate display object if needed
const displayBooking = {
  ...booking,
  displayDate: formatDateForDisplay(booking.date, language),
  displayTime: formatTimeForDisplay(booking.startTime, language)
};

// Render in UI
<div>
  <div>Date: {displayBooking.displayDate}</div>
  <div>Time: {displayBooking.displayTime}</div>
  <button onClick={() => openGoogleCalendar(booking)}>
    {/* Always pass original data with ISO date */}
    Add to Calendar
  </button>
</div>
```

---

### 7. Add Unit Tests for Date Parsing

**Create**: `tests/dateUtils.test.js`

```javascript
import { describe, test, expect } from 'vitest';
import {
  parseISODate,
  formatDateForDisplay,
  formatForGoogleCalendar,
  isValidISODate,
  convertDisplayToISO
} from '@/lib/dateUtils';

describe('Date Utilities', () => {
  describe('parseISODate', () => {
    test('should parse valid ISO date', () => {
      const date = parseISODate('2025-10-21');
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(9);  // 0-indexed
      expect(date.getDate()).toBe(21);
    });

    test('should throw error for invalid date', () => {
      expect(() => parseISODate('not-a-date')).toThrow();
    });

    test('should return null for empty string', () => {
      expect(parseISODate('')).toBeNull();
    });
  });

  describe('formatDateForDisplay', () => {
    test('should format date for English locale', () => {
      const result = formatDateForDisplay('2025-10-21', 'en');
      expect(result).toBe('10/21/2025');  // MM/DD/YYYY in en-US
    });

    test('should format date for Chinese locale', () => {
      const result = formatDateForDisplay('2025-10-21', 'zh');
      expect(result).toMatch(/2025/);  // Contains year
      expect(result).toMatch(/10/);    // Contains month
      expect(result).toMatch(/21/);    // Contains day
    });
  });

  describe('formatForGoogleCalendar', () => {
    test('should format date and time correctly', () => {
      const result = formatForGoogleCalendar('2025-10-21', '10:00');
      expect(result).toBe('20251021T100000');
    });

    test('should throw error for non-ISO date', () => {
      expect(() =>
        formatForGoogleCalendar('21/10/2025', '10:00')
      ).toThrow('Expected ISO date');
    });
  });

  describe('isValidISODate', () => {
    test('should validate correct ISO dates', () => {
      expect(isValidISODate('2025-10-21')).toBe(true);
      expect(isValidISODate('2025-01-01')).toBe(true);
    });

    test('should reject invalid formats', () => {
      expect(isValidISODate('21/10/2025')).toBe(false);
      expect(isValidISODate('2025/10/21')).toBe(false);
      expect(isValidISODate('10-21-2025')).toBe(false);
      expect(isValidISODate('not-a-date')).toBe(false);
    });
  });

  describe('convertDisplayToISO', () => {
    test('should convert DD/MM/YYYY to YYYY-MM-DD', () => {
      expect(convertDisplayToISO('21/10/2025')).toBe('2025-10-21');
      expect(convertDisplayToISO('01/01/2025')).toBe('2025-01-01');
    });

    test('should return ISO dates unchanged', () => {
      expect(convertDisplayToISO('2025-10-21')).toBe('2025-10-21');
    });
  });
});

describe('Calendar Integration', () => {
  test('should generate correct Google Calendar URL', () => {
    const booking = {
      date: '2025-10-21',
      startTime: '10:00',
      endTime: '13:00',
      room: { name: 'Room A' },
      userEmail: 'test@example.com'
    };

    const url = generateGoogleCalendarUrl(booking, 'en', mockTranslations);

    // Verify date is correctly formatted
    expect(url).toContain('20251021T100000');  // Start: Oct 21, 10:00
    expect(url).toContain('20251021T130000');  // End: Oct 21, 13:00
    expect(url).not.toContain('20260210');     // Not Feb 10, 2026!
  });

  test('should handle DD/MM/YYYY format gracefully', () => {
    const booking = {
      date: '21/10/2025',  // Display format
      startTime: '10:00',
      endTime: '13:00'
    };

    // Should either convert or throw clear error
    expect(() => {
      const url = generateGoogleCalendarUrl(booking, 'en', mockTranslations);
    }).not.toThrow();
  });
});
```

**Run tests:**
```bash
npm test dateUtils
```

---

### 8. Add Development Warnings

```javascript
export const normalizeBooking = (booking) => {
  const formatDate = (isoString) => {
    if (!isoString) return '';

    // Development warning
    if (process.env.NODE_ENV === 'development') {
      const datePart = isoString.split('T')[0];
      if (!isValidISODate(datePart)) {
        console.warn(
          `⚠️ Non-ISO date detected in normalizeBooking:`,
          `\n  Input: ${isoString}`,
          `\n  Expected: YYYY-MM-DD format`,
          `\n  Location: ${new Error().stack.split('\n')[2]}`
        );
      }
    }

    // Format for display
    const datePart = isoString.split('T')[0];
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year}`;
  };

  return {
    ...booking,
    // Keep BOTH raw and formatted
    rawDate: extractDate(booking.start_time),      // YYYY-MM-DD
    displayDate: formatDate(booking.start_time),   // DD/MM/YYYY
  };
};

// Usage
<div>{booking.displayDate}</div>  // Show to user

// Pass raw data to functions
openGoogleCalendar({
  ...booking,
  date: booking.rawDate  // Use rawDate, not displayDate!
});
```

---

## 📋 Best Practices Checklist

### Code Review Checklist
When reviewing date-related code, check:

- [ ] **Format Consistency**: Are dates always in ISO 8601 (YYYY-MM-DD)?
- [ ] **No Format Mixing**: Is display formatting kept separate from data processing?
- [ ] **Clear Documentation**: Are expected formats documented in comments?
- [ ] **Input Validation**: Are date strings validated before parsing?
- [ ] **Type Safety**: Are types/PropTypes used to enforce format?
- [ ] **No Assumptions**: Does code explicitly handle format instead of assuming?
- [ ] **Localization**: Are locale-specific formats only used for display?
- [ ] **Error Handling**: Do invalid dates throw clear errors?
- [ ] **Testing**: Are there unit tests for date parsing edge cases?

### Architecture Principles

| Principle | Description | Example |
|-----------|-------------|---------|
| **Single Source of Truth** | Use one standard format internally (ISO 8601) | `date: "2025-10-21"` everywhere |
| **Separation of Concerns** | Display formatting ≠ Data processing | Keep raw data, format only in UI |
| **Explicit over Implicit** | Validate format instead of assuming | Use `isValidISODate()` check |
| **Fail Fast** | Throw errors immediately on invalid input | Don't let bad data propagate |
| **Type Safety** | Enforce contracts at compile time | TypeScript or PropTypes |
| **Centralization** | All date logic in one utils module | `src/lib/dateUtils.js` |
| **Testing** | Unit test date parsing thoroughly | Edge cases, invalid inputs |

---

## 🎓 Key Takeaways

### The Bug Pattern
```
Data (ISO) → Transform for Display (DD/MM) → Use Transformed Data → 💥 BUG
```

### The Solution Pattern
```
Data (ISO) ──────────────────────────────────────→ Process (ISO) ✅
         ↓                                              ↑
    Format for Display (DD/MM)                   Always use raw data
```

### Golden Rules

1. **Keep data layer and presentation layer separate**
2. **Never use display-formatted data for processing**
3. **Always validate assumptions with explicit checks**
4. **Document expected formats clearly in code**
5. **Use a single standard internally (ISO 8601)**
6. **Only format for display when rendering to user**

---

## 📚 Related Files

- **Bug Location**: `src/lib/calendarUtils.js:22-37`
- **Display Formatting**: `src/components/admin/AdminBookingsTab.jsx:43-49`
- **Fix Commit**: `7067725`
- **Date Utilities** (recommended): `src/lib/dateUtils.js` (to be created)

---

## 🔗 References

- [ISO 8601 Date Format](https://en.wikipedia.org/wiki/ISO_8601)
- [MDN: Date.parse()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse)
- [date-fns Documentation](https://date-fns.org/)
- [Google Calendar API - Date Format](https://developers.google.com/calendar/api/v3/reference/events)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-20
**Maintained By**: Development Team
