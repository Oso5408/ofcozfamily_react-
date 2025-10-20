import { bookingService } from '@/services';

/**
 * Generate available time options for a given date and room
 * Now fetches from Supabase instead of localStorage
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

      // Room B (id=1) and Room C (id=2) are linked and cannot be booked at the same time
      if (roomId === 1 || roomId === 2) {
        return booking.room_id === 1 || booking.room_id === 2;
      }

      // For other rooms, only check bookings for that specific room
      return booking.room_id === roomId;
    });

    const bookedSlots = relevantBookings.map(b => ({
        start: new Date(b.start_time),
        end: new Date(b.end_time),
    }));

    const options = [];
    for (let hour = 10; hour <= 22; hour++) {
        const time = `${hour.toString().padStart(2, '0')}:00`;
        const checkTime = new Date(`${date}T${time}:00`);

        let isBooked = false;
        for (const slot of bookedSlots) {
            if (checkTime >= slot.start && checkTime < slot.end) {
                isBooked = true;
                break;
            }
        }

        if (!isBooked) {
            options.push(time);
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
    options.push(`${hour.toString().padStart(2, '0')}:00`);
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

      // Room B (id=1) and Room C (id=2) are linked
      if (roomId === 1 || roomId === 2) {
        return booking.room_id === 1 || booking.room_id === 2;
      }

      return booking.room_id === roomId;
    });

    const bookedSlots = relevantBookings.map(b => ({
      start: new Date(b.start_time),
      end: new Date(b.end_time),
    }));

    // Find the earliest booking that starts after our start time
    const startDateTime = new Date(`${date}T${startTime}:00`);
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
    const startHour = parseInt(startTime.split(':')[0]);

    // Generate end time options from start+1 hour to either:
    // - The next booking start time, OR
    // - 22:00 (closing time)
    const maxHour = maxEndTime ? maxEndTime.getHours() : 22;

    for (let hour = startHour + 1; hour <= maxHour; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      options.push(time);
    }

    return options;
  } catch (error) {
    console.error('Error generating end time options:', error);
    return generateAllEndTimeOptions(startTime);
  }
};

// Helper function to generate all possible end times after start time
const generateAllEndTimeOptions = (startTime) => {
  const options = [];
  const startHour = parseInt(startTime.split(':')[0]);
  for (let hour = startHour + 1; hour <= 22; hour++) {
    options.push(`${hour.toString().padStart(2, '0')}:00`);
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

            // Room B (id=1) and Room C (id=2) are linked
            if (roomId === 1 || roomId === 2) {
                return b.room_id === 1 || b.room_id === 2;
            }

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