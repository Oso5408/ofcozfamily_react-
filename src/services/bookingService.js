import { supabase, handleSupabaseError } from '@/lib/supabase';

/**
 * Booking Service
 * Handles all booking-related operations with Supabase
 */

export const bookingService = {
  /**
   * Create a new booking
   */
  async createBooking(bookingData) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: bookingData.userId,
          room_id: bookingData.roomId,
          start_time: bookingData.startTime,
          end_time: bookingData.endTime,
          booking_type: bookingData.bookingType,
          payment_method: bookingData.paymentMethod,
          payment_status: bookingData.paymentStatus || 'pending',
          total_cost: bookingData.totalCost,
          status: bookingData.status || 'confirmed',
          notes: bookingData.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, booking: data };
    } catch (error) {
      const errorMessage = handleSupabaseError(error);
      // Check for booking conflict
      if (error.code === '23P01') {
        return { success: false, error: 'This time slot is already booked' };
      }
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Get bookings for a user
   */
  async getUserBookings(userId, options = {}) {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          rooms (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, bookings: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Get all bookings (admin only)
   */
  async getAllBookings(options = {}) {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          users (id, email, full_name),
          rooms (*)
        `)
        .order('created_at', { ascending: false });

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.startDate) {
        query = query.gte('start_time', options.startDate);
      }

      if (options.endDate) {
        query = query.lte('end_time', options.endDate);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, bookings: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Get bookings for a specific room
   */
  async getRoomBookings(roomId, options = {}) {
    try {
      let query = supabase
        .from('bookings')
        .select('*')
        .eq('room_id', roomId)
        .neq('status', 'cancelled');

      if (options.startDate) {
        query = query.gte('start_time', options.startDate);
      }

      if (options.endDate) {
        query = query.lte('end_time', options.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, bookings: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Check room availability
   */
  async checkAvailability(roomId, startTime, endTime, excludeBookingId = null) {
    try {
      const { data, error } = await supabase
        .rpc('check_room_availability', {
          p_room_id: roomId,
          p_start_time: startTime,
          p_end_time: endTime,
          p_exclude_booking_id: excludeBookingId,
        });

      if (error) throw error;
      return { success: true, available: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Update booking
   */
  async updateBooking(bookingId, updates) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, booking: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Cancel booking
   */
  async cancelBooking(bookingId, refund = false) {
    try {
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;

      // Update booking status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          payment_status: refund ? 'refunded' : booking.payment_status
        })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      // If refund and payment was by token, refund tokens
      if (refund && booking.payment_method === 'token' && booking.payment_status === 'completed') {
        const { error: refundError } = await supabase
          .from('users')
          .update({
            tokens: supabase.raw(`tokens + ${booking.total_cost}`)
          })
          .eq('id', booking.user_id);

        if (refundError) throw refundError;

        // Create token history record
        await supabase
          .from('token_history')
          .insert({
            user_id: booking.user_id,
            change: booking.total_cost,
            new_balance: supabase.raw('(SELECT tokens FROM users WHERE id = $1)', [booking.user_id]),
            transaction_type: 'refund',
            booking_id: bookingId,
          });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Subscribe to booking changes for a room
   */
  subscribeToRoomBookings(roomId, callback) {
    return supabase
      .channel(`room-${roomId}-bookings`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `room_id=eq.${roomId}`,
        },
        callback
      )
      .subscribe();
  },
};
