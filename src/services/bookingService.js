import { supabase, handleSupabaseError } from '@/lib/supabase';
import { availableDatesService } from './availableDatesService';
import { emailService } from './emailService';

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
      // Check if date is open for booking for this specific room
      const dateString = new Date(bookingData.startTime).toISOString().split('T')[0];
      const dateCheck = await availableDatesService.isDateAvailableForRoom(dateString, bookingData.roomId);

      if (!dateCheck.success) {
        return { success: false, error: 'Unable to verify date availability' };
      }

      if (!dateCheck.isAvailable) {
        return {
          success: false,
          error: 'This date is not open for booking for this room. Please contact admin to open this date.',
          unavailable: true
        };
      }

      // Double-check room availability before insert to minimize race conditions
      const roomAvailabilityCheck = await this.checkAvailability(
        bookingData.roomId,
        bookingData.startTime,
        bookingData.endTime
      );

      if (!roomAvailabilityCheck.success) {
        return { success: false, error: 'Unable to verify room availability' };
      }

      if (!roomAvailabilityCheck.available) {
        return { success: false, error: 'This time slot has just been booked by another user', conflict: true };
      }

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
          status: bookingData.status || 'pending',
          notes: bookingData.notes,
          equipment: bookingData.equipment || [],
          purpose: bookingData.purpose,
          guests: bookingData.guests || 1,
          special_requests: bookingData.specialRequests,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, booking: data };
    } catch (error) {
      const errorMessage = handleSupabaseError(error);
      // Check for booking conflict (PostgreSQL exclusion constraint)
      if (error.code === '23P01' || error.message?.includes('no_overlapping_bookings')) {
        return {
          success: false,
          error: 'This time slot is already booked. Please select a different time.',
          conflict: true
        };
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
          users!bookings_user_id_fkey (id, email, full_name, phone),
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
        .not('status', 'in', '(cancelled,rescheduled)');

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
        .select('*, rooms(*), users!bookings_user_id_fkey(*)')
        .single();

      if (error) throw error;
      return { success: true, booking: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Cancel booking - FREE cancellation for all users (policy disabled)
   */
  async cancelBooking(bookingId, userId, reason = '') {
    try {
      console.log('🚫 Starting FREE cancellation for booking:', bookingId);

      // Fetch booking details
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*, rooms(*)')
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;

      // Verify user owns this booking
      if (booking.user_id !== userId) {
        return { success: false, error: 'You can only cancel your own bookings' };
      }

      // Check if already cancelled
      if (booking.status === 'cancelled') {
        return { success: false, error: 'This booking is already cancelled' };
      }

      const now = new Date();
      const bookingStart = new Date(booking.start_time);

      // Calculate hours before booking
      const hoursBeforeBooking = Math.floor((bookingStart - now) / (1000 * 60 * 60));

      // ⚠️ POLICY DISABLED: Allow cancellation anytime, even past bookings
      // No token deduction, no time restrictions

      console.log('✅ FREE cancellation - no policy enforcement');

      // Update booking status to cancelled (NO token deduction)
      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_at: now.toISOString(),
          cancelled_by: userId,
          cancellation_hours_before: hoursBeforeBooking,
          token_deducted_for_cancellation: false, // Never deduct tokens
          cancellation_reason: reason
        })
        .eq('id', bookingId)
        .select('*, rooms(*), users!bookings_user_id_fkey(*)')
        .single();

      if (updateError) throw updateError;

      console.log('✅ Booking cancelled successfully (FREE - no charges)');

      // Send cancellation notification to admin
      try {
        await emailService.sendCancellationNotificationToAdmin(
          updatedBooking,
          'zh', // Default language
          false // User-initiated cancellation
        );
        console.log('✅ Admin notification sent for user cancellation');
      } catch (emailError) {
        console.error('⚠️ Failed to send admin notification, but cancellation succeeded:', emailError);
        // Don't fail the cancellation if email fails
      }

      return {
        success: true,
        booking: updatedBooking,
        tokenDeducted: false, // Always false - policy disabled
        hoursBeforeBooking
      };
    } catch (error) {
      console.error('❌ Error cancelling booking:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Admin cancel booking - bypasses ownership check and cancellation policy
   * @param {string} bookingId - Booking ID to cancel
   * @param {string} adminUserId - Admin user ID performing the cancellation
   * @param {string} reason - Reason for cancellation
   * @param {boolean} shouldRefund - Whether to refund tokens/packages to user
   * @returns {Promise<{success: boolean, booking?: object, error?: string}>}
   */
  async adminCancelBooking(bookingId, adminUserId, reason = 'Cancelled by admin', shouldRefund = true) {
    try {
      console.log('🔧 Admin cancelling booking:', bookingId, 'shouldRefund:', shouldRefund);

      // Fetch booking details with user info
      // Use users!bookings_user_id_fkey to specify we want the booking owner's info
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*, rooms(*), users!bookings_user_id_fkey(*)')
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;

      // Check if already cancelled
      if (booking.status === 'cancelled') {
        return { success: false, error: 'This booking is already cancelled' };
      }

      const now = new Date();
      const bookingStart = new Date(booking.start_time);
      const hoursBeforeBooking = Math.floor((bookingStart - now) / (1000 * 60 * 60));

      // Update booking status to cancelled
      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_at: now.toISOString(),
          cancelled_by: adminUserId,
          cancellation_hours_before: hoursBeforeBooking,
          token_deducted_for_cancellation: false,
          cancellation_reason: reason
        })
        .eq('id', bookingId)
        .select('*, rooms(*), users!bookings_user_id_fkey(*)')
        .single();

      if (updateError) throw updateError;

      // Handle token/package refund if requested
      if (shouldRefund && booking.payment_method) {
        const paymentMethod = booking.payment_method;
        const userId = booking.user_id;

        console.log('💰 Processing refund for payment method:', paymentMethod);

        if (paymentMethod === 'token') {
          // Refund regular tokens
          const tokensToRefund = booking.total_cost || 0;
          if (tokensToRefund > 0) {
            const { error: refundError } = await supabase.rpc('add_tokens', {
              p_user_id: userId,
              p_amount: tokensToRefund,
              p_booking_id: bookingId,
              p_description: `Refund from cancelled booking #${booking.receipt_number || bookingId}`
            });

            if (refundError) {
              console.error('❌ Failed to refund tokens:', refundError);
            } else {
              console.log(`✅ Refunded ${tokensToRefund} tokens to user`);
            }
          }
        } else if (paymentMethod === 'dp20') {
          // Refund DP20 package days (1 day per booking)
          const daysToRefund = 1;
          const { error: refundError } = await supabase.rpc('refund_dp20_days', {
            p_user_id: userId,
            p_days: daysToRefund,
            p_booking_id: bookingId
          });

          if (refundError) {
            console.error('❌ Failed to refund DP20 days:', refundError);
          } else {
            console.log(`✅ Refunded ${daysToRefund} DP20 day(s) to user`);
          }
        } else if (paymentMethod === 'br15') {
          // Refund BR15 package hours
          const hoursToRefund = booking.total_cost || 0;
          const { error: refundError } = await supabase.rpc('refund_br15_hours', {
            p_user_id: userId,
            p_hours: hoursToRefund,
            p_booking_id: bookingId
          });

          if (refundError) {
            console.error('❌ Failed to refund BR15 hours:', refundError);
          } else {
            console.log(`✅ Refunded ${hoursToRefund} BR15 hour(s) to user`);
          }
        } else if (paymentMethod === 'br30') {
          // Refund BR30 package hours
          const hoursToRefund = booking.total_cost || 0;
          const { error: refundError } = await supabase.rpc('refund_br30_hours', {
            p_user_id: userId,
            p_hours: hoursToRefund,
            p_booking_id: bookingId
          });

          if (refundError) {
            console.error('❌ Failed to refund BR30 hours:', refundError);
          } else {
            console.log(`✅ Refunded ${hoursToRefund} BR30 hour(s) to user`);
          }
        }
      } else if (!shouldRefund) {
        console.log('⏭️  Skipping refund as per admin choice');
      }

      console.log('✅ Admin cancelled booking successfully');

      // Send cancellation notification to admin
      try {
        await emailService.sendCancellationNotificationToAdmin(
          updatedBooking,
          'zh', // Default language
          true // Admin-initiated cancellation (on behalf of user)
        );
        console.log('✅ Admin notification sent for admin cancellation');
      } catch (emailError) {
        console.error('⚠️ Failed to send admin notification, but cancellation succeeded:', emailError);
        // Don't fail the cancellation if email fails
      }

      return {
        success: true,
        booking: updatedBooking
      };
    } catch (error) {
      console.error('❌ Error in admin cancel booking:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Mark cancellation as reviewed by admin
   * @param {string} bookingId - Booking ID to mark as reviewed
   * @returns {Promise<{success: boolean, booking?: object, error?: string}>}
   */
  async markCancellationReviewed(bookingId) {
    try {
      console.log('✅ Marking cancellation as reviewed:', bookingId);

      const { data, error } = await supabase
        .from('bookings')
        .update({ cancellation_reviewed: true })
        .eq('id', bookingId)
        .eq('status', 'cancelled')
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Cancellation marked as reviewed');
      return { success: true, booking: data };
    } catch (error) {
      console.error('❌ Error marking cancellation as reviewed:', error);
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

  /**
   * Get bookings pending payment (admin only)
   */
  async getPendingPayments() {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          users (id, email, full_name, phone),
          rooms (*)
        `)
        .eq('payment_status', 'pending')
        .eq('status', 'pending_payment')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, bookings: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Mark booking as paid (admin only)
   */
  async markAsPaid(bookingId, adminUserId, adminNotes = '') {
    try {
      console.log('🔧 markAsPaid called with:', { bookingId, adminUserId, adminNotes });

      // First, update the booking
      const { data: updateData, error: updateError } = await supabase
        .from('bookings')
        .update({
          payment_status: 'completed',
          status: 'confirmed', // Admin manual confirmation goes directly to confirmed
          payment_confirmed_at: new Date().toISOString(),
          payment_confirmed_by: adminUserId,
          admin_notes: adminNotes,
        })
        .eq('id', bookingId)
        .select();

      console.log('📝 Update result:', { updateData, updateError });

      if (updateError) {
        console.error('❌ Update error:', updateError);
        throw updateError;
      }

      if (!updateData || updateData.length === 0) {
        console.error('⚠️ Update succeeded but no rows affected - possible RLS issue');
        throw new Error('Update failed - no rows affected. Check RLS policies.');
      }

      // Then fetch the updated booking with relations
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          users!bookings_user_id_fkey (id, email, full_name, phone),
          rooms (*)
        `)
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;
      return { success: true, booking: data };
    } catch (error) {
      console.error('markAsPaid error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Get bookings by date range
   * Gets all bookings that overlap with the specified date range
   */
  async getBookingsByDateRange(startDate, endDate, options = {}) {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          users!bookings_user_id_fkey (id, email, full_name),
          rooms (*)
        `)
        // Get bookings that overlap with the date range:
        // Booking overlaps if: booking.start_time < endDate AND booking.end_time > startDate
        .lt('start_time', endDate)
        .gt('end_time', startDate)
        .order('start_time', { ascending: true });

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.roomId) {
        query = query.eq('room_id', options.roomId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, bookings: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Upload receipt for a booking
   */
  async uploadReceiptForBooking(bookingId, receiptUrl) {
    try {
      const { data, error} = await supabase
        .from('bookings')
        .update({
          receipt_url: receiptUrl,
          receipt_uploaded_at: new Date().toISOString(),
          status: 'to_be_confirmed'
        })
        .eq('id', bookingId)
        .select(`
          *,
          users!bookings_user_id_fkey (
            email,
            full_name,
            phone
          ),
          rooms (
            name
          )
        `)
        .single();

      if (error) throw error;

      // Format date and time from timestamps
      const startDate = new Date(data.start_time);
      const endDate = new Date(data.end_time);

      const formattedDate = startDate.toLocaleDateString('zh-HK', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });

      const formattedStartTime = startDate.toLocaleTimeString('zh-HK', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      const formattedEndTime = endDate.toLocaleTimeString('zh-HK', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      // Flatten the user data for easier access
      const booking = {
        ...data,
        email: data.users?.email,
        name: data.users?.full_name,
        phone: data.users?.phone,
        room: data.rooms,
        date: formattedDate,
        startTime: formattedStartTime,
        endTime: formattedEndTime
      };

      return { success: true, booking };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Get booking with receipt info
   */
  async getBookingWithReceipt(bookingId) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          users!bookings_user_id_fkey (id, email, full_name, phone),
          rooms (*)
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      return { success: true, booking: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Admin create booking on behalf of user
   * Auto-confirms booking without payment verification
   */
  async adminCreateBooking(bookingData, adminUserId) {
    try {
      console.log('🔧 Admin creating booking:', bookingData);

      // Check if date is open for booking for this specific room
      const dateString = new Date(bookingData.startTime).toISOString().split('T')[0];
      const dateCheck = await availableDatesService.isDateAvailableForRoom(dateString, bookingData.roomId);

      if (!dateCheck.success) {
        return { success: false, error: 'Unable to verify date availability' };
      }

      if (!dateCheck.isAvailable) {
        return {
          success: false,
          error: 'This date is not open for booking for this room.',
          unavailable: true
        };
      }

      // Check room availability
      const roomAvailabilityCheck = await this.checkAvailability(
        bookingData.roomId,
        bookingData.startTime,
        bookingData.endTime
      );

      if (!roomAvailabilityCheck.success) {
        return { success: false, error: 'Unable to verify room availability' };
      }

      if (!roomAvailabilityCheck.available) {
        return { success: false, error: 'This time slot is already booked', conflict: true };
      }

      // Prepare booking data
      const bookingInsertData = {
        user_id: bookingData.userId,
        room_id: bookingData.roomId,
        start_time: bookingData.startTime,
        end_time: bookingData.endTime,
        booking_type: bookingData.bookingType,
        payment_method: bookingData.paymentMethod,
        payment_status: 'completed', // Auto-complete for admin bookings
        total_cost: bookingData.totalCost,
        status: 'confirmed', // Auto-confirm for admin bookings
        notes: bookingData.notes,
        equipment: bookingData.equipment || [],
        purpose: bookingData.purpose,
        guests: bookingData.guests || 1,
        special_requests: bookingData.specialRequests,
      };

      // Add created_by_admin if the column exists (for tracking purposes)
      // This is optional to support databases that haven't run the migration yet
      if (adminUserId) {
        bookingInsertData.created_by_admin = adminUserId;
      }

      // Create booking with auto-confirmed status
      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingInsertData)
        .select(`
          *,
          users!bookings_user_id_fkey (id, email, full_name, phone),
          rooms (*)
        `)
        .single();

      if (error) throw error;

      console.log('✅ Admin booking created successfully');
      return { success: true, booking: data };
    } catch (error) {
      const errorMessage = handleSupabaseError(error);
      console.error('❌ Admin create booking error:', errorMessage);

      // Check for booking conflict
      if (error.code === '23P01' || error.message?.includes('no_overlapping_bookings')) {
        return {
          success: false,
          error: 'This time slot is already booked. Please select a different time.',
          conflict: true
        };
      }

      return { success: false, error: errorMessage };
    }
  },
};
