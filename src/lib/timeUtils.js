import { bookingService } from '@/services';

/**
 * Get current time in Hong Kong timezone (UTC+8)
 * @returns {Date} Current time in Hong Kong
 */
const getHongKongTime = () => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' }));
};

/**
 * Check if a date string (YYYY-MM-DD) is today in Hong Kong timezone
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {boolean} True if the date is today in Hong Kong
 */
const isToday = (dateString) => {
  const hkNow = getHongKongTime();
  const todayString = hkNow.toISOString().split('T')[0]; // YYYY-MM-DD
  return dateString === todayString;
};

/**
 * Generate available time options for a given date and room
 * Now fetches from Supabase instead of localStorage
 * Filters out past time slots on current day (Hong Kong timezone UTC+8)
 */
export const generateTimeOptions = async (date, roomId, bookingIdToExclude = null) => {
  if (!date) return [];

  try {
    // Fetch bookings from Supabase for this specific date and room
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await bookingService.getBookingsByDateRange(
      startOfDay.toISOString(),
      endOfDay.toISOString(),
      { roomId } // This will be handled in the filter below for linked rooms
    );

    if (!result.success) {
      console.error('Failed to fetch bookings:', result.error);
      return generateAllTimeOptions(); // Return all times if fetch fails
    }

    const allBookings = result.bookings || [];

    // Filter relevant bookings
    let relevantBookings = allBookings.filter(booking => {
      const bookingDate = new Date(booking.start_time).toISOString().split('T')[0];
      const isSameDate = bookingDate === date;
      const isConfirmed = booking.status !== 'cancelled';
      const isNotExcluded = booking.id !== bookingIdToExclude;

      if (!isSameDate || !isConfirmed || !isNotExcluded) return false;

      // Check bookings for the specific room only - no room linking
      return booking.room_id === roomId;
    });

    const bookedSlots = relevantBookings.map(b => ({
        start: new Date(b.start_time),
        end: new Date(b.end_time),
    }));

    // Check if the selected date is today (in Hong Kong timezone)
    const isTodayInHK = isToday(date);
    let currentTotalMinutes = 0;

    if (isTodayInHK) {
      const hkNow = getHongKongTime();
      const currentHour = hkNow.getHours();
      const currentMinute = hkNow.getMinutes();
      // Add 30-minute buffer to prevent last-second bookings
      currentTotalMinutes = currentHour * 60 + currentMinute + 30;
    }

    const options = [];
    for (let hour = 10; hour <= 22; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            // Skip 22:30 - venue closes at 22:00, last booking can only be until 22:00
            if (hour === 22 && minute === 30) continue;

            // Skip past time slots if booking for today
            if (isTodayInHK) {
              const slotTotalMinutes = hour * 60 + minute;
              if (slotTotalMinutes <= currentTotalMinutes) {
                continue; // Skip this past time slot
              }
            }

            const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const checkTime = new Date(`${date}T${time}:00`);

            // Check if we can book at least 30 minutes from this start time
            const checkEndTime = new Date(checkTime);
            checkEndTime.setMinutes(checkEndTime.getMinutes() + 30);

            let isBooked = false;
            for (const slot of bookedSlots) {
                // Use proper overlap detection: (start1 < end2) && (end1 > start2)
                // Proposed booking: [checkTime, checkEndTime]
                // Existing booking: [slot.start, slot.end]
                if (checkTime < slot.end && checkEndTime > slot.start) {
                    isBooked = true;
                    break;
                }
            }

            if (!isBooked) {
                options.push(time);
            }
        }
    }
    return options;
  } catch (error) {
    console.error('Error generating time options:', error);
    return generateAllTimeOptions(); // Return all times if error occurs
  }
};

// Helper function to generate all time options (fallback)
const generateAllTimeOptions = () => {
  const options = [];
  for (let hour = 10; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      // Skip 22:30 - venue closes at 22:00
      if (hour === 22 && minute === 30) continue;
      options.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  return options;
};

/**
 * Generate available end time options based on selected start time
 * Ensures no overlap with existing bookings
 */
export const generateEndTimeOptions = async (date, roomId, startTime, bookingIdToExclude = null) => {
  if (!date || !startTime) return [];

  try {
    // Fetch bookings from Supabase for this specific date and room
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await bookingService.getBookingsByDateRange(
      startOfDay.toISOString(),
      endOfDay.toISOString(),
      { roomId }
    );

    if (!result.success) {
      console.error('Failed to fetch bookings:', result.error);
      return generateAllEndTimeOptions(startTime); // Return all times if fetch fails
    }

    const allBookings = result.bookings || [];

    // Filter relevant bookings
    let relevantBookings = allBookings.filter(booking => {
      const bookingDate = new Date(booking.start_time).toISOString().split('T')[0];
      const isSameDate = bookingDate === date;
      const isConfirmed = booking.status !== 'cancelled';
      const isNotExcluded = booking.id !== bookingIdToExclude;

      if (!isSameDate || !isConfirmed || !isNotExcluded) return false;

      // Check bookings for the specific room only - no room linking
      return booking.room_id === roomId;
    });

    const bookedSlots = relevantBookings.map(b => ({
      start: new Date(b.start_time),
      end: new Date(b.end_time),
    }));

    // Check for overlap with existing bookings
    const startDateTime = new Date(`${date}T${startTime}:00`);

    // First, check if there's already a booking in progress at the start time
    for (const slot of bookedSlots) {
      if (slot.start <= startDateTime && slot.end > startDateTime) {
        // There's a booking already in progress at this start time
        console.warn(`Booking in progress at ${startTime}: ${slot.start} - ${slot.end}`);
        return []; // No valid end times
      }
    }

    // Find the earliest booking that starts after our start time
    let maxEndTime = null;
    for (const slot of bookedSlots) {
      if (slot.start > startDateTime) {
        // Found a booking that starts after our start time
        if (!maxEndTime || slot.start < maxEndTime) {
          maxEndTime = slot.start;
        }
      }
    }

    const options = [];
    const [startHourStr, startMinuteStr] = startTime.split(':');
    const startHour = parseInt(startHourStr);
    const startMinute = parseInt(startMinuteStr);

    // Convert start time to total minutes from midnight
    const startTotalMinutes = startHour * 60 + startMinute;

    // Determine max end time (either next booking or closing time 22:00)
    let maxTotalMinutes;
    if (maxEndTime) {
      maxTotalMinutes = maxEndTime.getHours() * 60 + maxEndTime.getMinutes();
    } else {
      maxTotalMinutes = 22 * 60; // 22:00
    }

    // Generate end time options in 30-minute increments from start+60min (1 hour minimum) to max
    for (let totalMinutes = startTotalMinutes + 60; totalMinutes <= maxTotalMinutes; totalMinutes += 30) {
      const hour = Math.floor(totalMinutes / 60);
      const minute = totalMinutes % 60;
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      options.push(time);
    }

    return options;
  } catch (error) {
    console.error('Error generating end time options:', error);
    return generateAllEndTimeOptions(startTime);
  }
};

// Helper function to generate all possible end times after start time (1 hour minimum)
const generateAllEndTimeOptions = (startTime) => {
  const options = [];
  const [startHourStr, startMinuteStr] = startTime.split(':');
  const startHour = parseInt(startHourStr);
  const startMinute = parseInt(startMinuteStr || '0');
  const startTotalMinutes = startHour * 60 + startMinute;

  // Generate all 30-minute slots from start+60min (1 hour minimum) to 22:00
  for (let totalMinutes = startTotalMinutes + 60; totalMinutes <= 22 * 60; totalMinutes += 30) {
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    options.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
  }
  return options;
};

/**
 * Check if a daily slot conflicts with existing bookings
 * Now fetches from Supabase instead of localStorage
 */
export const checkDailySlotConflict = async (roomId, date, slot) => {
    if (!date || !slot) return false;

    try {
        const [slotStartStr, slotEndStr] = slot.split('-');
        const slotStartTime = new Date(`${date}T${slotStartStr}:00`);
        const slotEndTime = new Date(`${date}T${slotEndStr}:00`);

        // Fetch bookings from Supabase for this date
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const result = await bookingService.getBookingsByDateRange(
            startOfDay.toISOString(),
            endOfDay.toISOString()
        );

        if (!result.success) {
            console.error('Failed to fetch bookings for conflict check:', result.error);
            return false; // Assume no conflict if fetch fails
        }

        const allBookings = result.bookings || [];

        // Filter room bookings
        const roomBookings = allBookings.filter(b => {
            const bookingDate = new Date(b.start_time).toISOString().split('T')[0];
            const isSameDate = bookingDate === date;
            const isConfirmed = b.status !== 'cancelled';

            if (!isSameDate || !isConfirmed) return false;

            // Check bookings for the specific room only - no room linking
            return b.room_id === roomId;
        });

        // Check for overlaps
        for (const booking of roomBookings) {
            const bookingStartTime = new Date(booking.start_time);
            const bookingEndTime = new Date(booking.end_time);

            // Check for any overlap
            if (slotStartTime < bookingEndTime && slotEndTime > bookingStartTime) {
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Error checking daily slot conflict:', error);
        return false; // Assume no conflict if error occurs
    }
};