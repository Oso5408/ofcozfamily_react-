import { supabase, handleSupabaseError } from '@/lib/supabase';

/**
 * Available Dates Service
 * Handles operations for opening specific dates for booking
 *
 * IMPORTANT: By default, ALL dates are CLOSED for booking
 * Only dates in the available_dates table can be booked
 */

export const availableDatesService = {
  /**
   * Get all available dates
   * @returns {Promise<{success: boolean, dates?: Array, error?: string}>}
   */
  async getAvailableDates() {
    try {
      const { data, error } = await supabase
        .from('available_dates')
        .select('*')
        .order('available_date', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        dates: data || []
      };
    } catch (error) {
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  },

  /**
   * Get all available dates as simple date strings (YYYY-MM-DD)
   * @param {number} [roomId] - Optional room ID to filter by specific room
   * @returns {Promise<{success: boolean, dateStrings?: Array<string>, error?: string}>}
   */
  async getAvailableDateStrings(roomId = null) {
    try {
      // Get dates that are either for all rooms (room_id IS NULL) or for the specific room
      let query = supabase
        .from('available_dates')
        .select('available_date')
        .order('available_date', { ascending: true });

      if (roomId) {
        // Get dates where room_id IS NULL (all rooms) OR room_id = roomId (specific room)
        query = query.or(`room_id.is.null,room_id.eq.${roomId}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Remove duplicates (same date might appear for "all rooms" and "specific room")
      const uniqueDateStrings = [...new Set(data.map(d => d.available_date))];

      return {
        success: true,
        dateStrings: uniqueDateStrings
      };
    } catch (error) {
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  },

  /**
   * Check if a specific date is available for booking (any room)
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<{success: boolean, isAvailable?: boolean, error?: string}>}
   */
  async isDateAvailable(date) {
    try {
      const { data, error } = await supabase
        .from('available_dates')
        .select('id')
        .eq('available_date', date)
        .maybeSingle();

      if (error) throw error;

      return {
        success: true,
        isAvailable: !!data
      };
    } catch (error) {
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  },

  /**
   * Check if a specific date is available for a specific room
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {number} roomId - Room ID
   * @returns {Promise<{success: boolean, isAvailable?: boolean, error?: string}>}
   */
  async isDateAvailableForRoom(date, roomId) {
    try {
      // Date is available if: room_id IS NULL (all rooms) OR room_id = roomId (specific room)
      const { data, error } = await supabase
        .from('available_dates')
        .select('id')
        .eq('available_date', date)
        .or(`room_id.is.null,room_id.eq.${roomId}`);

      if (error) throw error;

      return {
        success: true,
        isAvailable: data && data.length > 0
      };
    } catch (error) {
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  },

  /**
   * Open a specific date for booking (all rooms or specific room)
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} [reason] - Optional reason for opening this date
   * @param {number} [roomId] - Optional room ID (NULL = all rooms)
   * @returns {Promise<{success: boolean, availableDate?: object, error?: string}>}
   */
  async openDate(date, reason = null, roomId = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('available_dates')
        .insert({
          available_date: date,
          reason,
          room_id: roomId,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        availableDate: data
      };
    } catch (error) {
      // Handle unique constraint violation (date + room combination already open)
      if (error.code === '23505') {
        return {
          success: false,
          error: roomId
            ? 'This date is already open for this room'
            : 'This date is already open for all rooms'
        };
      }
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  },

  /**
   * Close a specific date (remove from available dates)
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async closeDate(date) {
    try {
      const { error } = await supabase
        .from('available_dates')
        .delete()
        .eq('available_date', date);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  },

  /**
   * Open a range of dates for booking (all rooms or specific room)
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @param {string} [reason] - Optional reason for opening these dates
   * @param {number} [roomId] - Optional room ID (NULL = all rooms)
   * @returns {Promise<{success: boolean, count?: number, error?: string}>}
   */
  async openDateRange(startDate, endDate, reason = null, roomId = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Generate array of dates between start and end
      const dates = [];
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateString = d.toISOString().split('T')[0];
        dates.push({
          available_date: dateString,
          reason,
          room_id: roomId,
          created_by: user.id
        });
      }

      // Insert all dates (ignore duplicates based on date+room combination)
      const { data, error } = await supabase
        .from('available_dates')
        .upsert(dates, { onConflict: 'available_date,room_id', ignoreDuplicates: true })
        .select();

      if (error) throw error;

      return {
        success: true,
        count: data.length
      };
    } catch (error) {
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  },

  /**
   * Close a range of dates (remove from available dates)
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async closeDateRange(startDate, endDate) {
    try {
      const { error } = await supabase
        .from('available_dates')
        .delete()
        .gte('available_date', startDate)
        .lte('available_date', endDate);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  },

  /**
   * Count existing bookings on a specific date
   * Used to warn admin before closing a date with existing bookings
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<{success: boolean, count?: number, error?: string}>}
   */
  async countBookingsOnDate(date) {
    try {
      const startOfDay = `${date}T00:00:00Z`;
      const endOfDay = `${date}T23:59:59Z`;

      const { count, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .neq('status', 'cancelled');

      if (error) throw error;

      return {
        success: true,
        count: count || 0
      };
    } catch (error) {
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }
};
