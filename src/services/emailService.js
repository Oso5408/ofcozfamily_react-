import { supabase } from '@/lib/supabase';
import { translations } from '@/data/translations';

/**
 * Email Service
 * Sends booking confirmation emails via Supabase Edge Function
 */

export const emailService = {
  /**
   * Send booking confirmation email when status changes to 'confirmed'
   * @param {Object} booking - The booking object with user and room details
   * @param {string} language - Language code ('en' or 'zh')
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async sendBookingConfirmation(booking, language = 'zh') {
    try {
      const t = translations[language];

      // Ensure booking has all required fields
      if (!booking.email) {
        console.error('Cannot send email: booking email is missing');
        return { success: false, error: 'Booking email is missing' };
      }

      if (!booking.room) {
        console.error('Cannot send email: booking room is missing');
        return { success: false, error: 'Booking room is missing' };
      }

      // Prepare booking data for email template
      const emailData = {
        to: booking.email,
        language: language,
        booking: {
          name: booking.name || booking.users?.full_name || 'Valued Customer',
          receiptNumber: booking.receiptNumber || booking.receipt_number || 'N/A',
          room: {
            name: booking.room.name,
          },
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          specialRequests: booking.specialRequests || booking.special_requests || '',
        },
        roomNameTranslated: t.rooms.roomNames[booking.room.name] || booking.room.name,
      };

      console.log('📧 Sending booking confirmation email to:', emailData.to);

      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-booking-confirmation', {
        body: emailData,
      });

      if (error) {
        console.error('❌ Error sending email:', error);
        return { success: false, error: error.message };
      }

      if (!data.success) {
        console.error('❌ Email sending failed:', data.error);
        return { success: false, error: data.error };
      }

      console.log('✅ Email sent successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Exception in sendBookingConfirmation:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Test email sending (for debugging)
   * Sends a test email to verify SMTP configuration
   */
  async sendTestEmail(to, language = 'zh') {
    const testBooking = {
      email: to,
      name: 'Test User',
      receiptNumber: 'TEST-12345',
      room: {
        name: 'roomA'
      },
      date: '01/01/2025',
      startTime: '10:00',
      endTime: '12:00',
      specialRequests: 'This is a test email',
    };

    return await this.sendBookingConfirmation(testBooking, language);
  },
};
