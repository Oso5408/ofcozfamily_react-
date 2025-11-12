import { supabase, handleSupabaseError } from '@/lib/supabase';

/**
 * Blocked Dates Service
 * Handles operations for blocking specific dates from booking
 */

export const blockedDatesService = {
  /**
   * Get all blocked dates
   * @returns {Promise<{success: boolean, dates?: Array, error?: string}>}
   */
  async getBlockedDates() {
    try {
      const { data, error } = await supabase
        .from('blocked_dates')
        .select('*')
        .order('blocked_date', { ascending: true });

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
   * Get all blocked dates as simple date strings (YYYY-MM-DD)
   * Useful for quick lookups in booking forms
   * @returns {Promise<{success: boolean, dateStrings?: Array<string>, error?: string}>}
   */
  async getBlockedDateStrings() {
    try {
      const result = await this.getBlockedDates();
      if (!result.success) return result;

      const dateStrings = result.dates.map(d => d.blocked_date);
      return {
        success: true,
        dateStrings
      };
    } catch (error) {
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  },

  /**
   * Check if a specific date is blocked
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<{success: boolean, isBlocked?: boolean, error?: string}>}
   */
  async isDateBlocked(date) {
    try {
      const { data, error } = await supabase
        .from('blocked_dates')
        .select('id')
        .eq('blocked_date', date)
        .maybeSingle();

      if (error) throw error;

      return {
        success: true,
        isBlocked: !!data
      };
    } catch (error) {
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  },

  /**
   * Block a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} [reason] - Optional reason for blocking
   * @returns {Promise<{success: boolean, blockedDate?: object, error?: string}>}
   */
  async blockDate(date, reason = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('blocked_dates')
        .insert({
          blocked_date: date,
          reason,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        blockedDate: data
      };
    } catch (error) {
      // Handle unique constraint violation (date already blocked)
      if (error.code === '23505') {
        return {
          success: false,
          error: 'This date is already blocked'
        };
      }
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  },

  /**
   * Unblock a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async unblockDate(date) {
    try {
      const { error } = await supabase
        .from('blocked_dates')
        .delete()
        .eq('blocked_date', date);

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
   * Used to warn admin before blocking a date with existing bookings
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
