import { supabase } from '@/lib/supabase';
import { translations } from '@/data/translations';

/**
 * Email Service
 * Sends booking confirmation emails via Supabase Edge Function
 *
 * All emails are BCC'd to admin: ofcozfamily@gmail.com
 */

// Admin email that receives a copy of all outgoing emails
const ADMIN_EMAIL = 'ofcozfamily@gmail.com';

export const emailService = {
  /**
   * Send booking created email when user creates a new booking
   * @param {Object} booking - The booking object with user and room details
   * @param {string} language - Language code ('en' or 'zh')
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async sendBookingCreatedEmail(booking, language = 'zh') {
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
        bcc: ADMIN_EMAIL, // Admin receives copy of all emails
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
          paymentMethod: booking.paymentMethod || 'cash',
          totalCost: booking.totalCost || booking.total_cost || 0,
          specialRequests: booking.specialRequests || booking.special_requests || '',
        },
        roomNameTranslated: t.rooms.roomNames[booking.room.name] || booking.room.name,
      };

      console.log('📧 Sending booking created email to:', emailData.to, '(BCC:', ADMIN_EMAIL, ')');

      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-booking-created', {
        body: emailData,
      });

      if (error) {
        console.error('❌ Error sending email:', error);

        // Extract actual error details from error.context (for non-2xx responses)
        // See: https://github.com/supabase/functions-js/issues/45#issuecomment-2068191215
        if (error.context) {
          try {
            const errorBody = await error.context.text();
            console.error('❌ Edge Function error details:', errorBody);
            return { success: false, error: `Edge Function error: ${errorBody}` };
          } catch (e) {
            console.error('❌ Could not read error context:', e);
          }
        }

        return { success: false, error: error.message };
      }

      if (!data.success) {
        console.error('❌ Email sending failed:', data.error);
        return { success: false, error: data.error };
      }

      console.log('✅ Booking created email sent successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Exception in sendBookingCreatedEmail:', error);
      return { success: false, error: error.message };
    }
  },

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
        bcc: ADMIN_EMAIL, // Admin receives copy of all emails
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

      console.log('📧 Sending booking confirmation email to:', emailData.to, '(BCC:', ADMIN_EMAIL, ')');

      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-booking-confirmation', {
        body: emailData,
      });

      if (error) {
        console.error('❌ Error sending email:', error);

        // Extract actual error details from error.context (for non-2xx responses)
        if (error.context) {
          try {
            const errorBody = await error.context.text();
            console.error('❌ Edge Function error details:', errorBody);
            return { success: false, error: `Edge Function error: ${errorBody}` };
          } catch (e) {
            console.error('❌ Could not read error context:', e);
          }
        }

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
   * Send receipt received notification when status changes to 'to_be_confirmed'
   * @param {Object} booking - The booking object with user and room details
   * @param {string} language - Language code ('en' or 'zh')
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async sendReceiptReceivedEmail(booking, language = 'zh') {
    try {
      const t = translations[language];

      // Extract email from various possible locations
      let userEmail = booking.email || booking.users?.email;

      // If still not found, try to parse from notes JSON
      if (!userEmail && booking.notes) {
        try {
          const notes = typeof booking.notes === 'string' ? JSON.parse(booking.notes) : booking.notes;
          userEmail = notes.email;
        } catch (e) {
          console.warn('Could not parse booking notes for email');
        }
      }

      if (!userEmail) {
        console.error('Cannot send email: booking email is missing', { booking });
        return { success: false, error: 'Booking email is missing' };
      }

      // Extract name from various possible locations
      let userName = booking.name || booking.users?.full_name || booking.users?.name;
      if (!userName && booking.notes) {
        try {
          const notes = typeof booking.notes === 'string' ? JSON.parse(booking.notes) : booking.notes;
          userName = notes.name;
        } catch (e) {
          // Ignore parsing errors
        }
      }
      userName = userName || 'Valued Customer';

      // Get room name safely
      const roomName = booking.room?.name || booking.rooms?.name || 'Room';

      // Get translated room name safely
      let roomNameTranslated = roomName;
      try {
        if (t && t.rooms && t.rooms.roomNames && roomName) {
          roomNameTranslated = t.rooms.roomNames[roomName] || roomName;
        }
      } catch (e) {
        console.warn('Could not translate room name, using original:', roomName);
      }

      const emailData = {
        to: userEmail,
        bcc: ADMIN_EMAIL, // Admin receives copy of all emails
        language: language,
        type: 'receiptReceived',
        booking: {
          name: userName,
          receiptNumber: booking.receiptNumber || booking.receipt_number || 'N/A',
          room: {
            name: roomName,
          },
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
        },
        roomNameTranslated: roomNameTranslated,
      };

      console.log('📧 Sending receipt received email to:', emailData.to, '(BCC:', ADMIN_EMAIL, ')');

      const { data, error } = await supabase.functions.invoke('send-status-notification', {
        body: emailData,
      });

      if (error) {
        console.error('❌ Error sending email:', error);

        // Extract actual error details from error.context (for non-2xx responses)
        if (error.context) {
          try {
            const errorBody = await error.context.text();
            console.error('❌ Edge Function error details:', errorBody);
            return { success: false, error: `Edge Function error: ${errorBody}` };
          } catch (e) {
            console.error('❌ Could not read error context:', e);
          }
        }

        return { success: false, error: error.message || String(error) };
      }

      if (!data) {
        console.error('❌ Email sending failed: No response data');
        return { success: false, error: 'No response from email service' };
      }

      if (!data.success) {
        console.error('❌ Email sending failed:', data.error);
        return { success: false, error: data.error || 'Email sending failed' };
      }

      console.log('✅ Receipt received email sent successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Exception in sendReceiptReceivedEmail:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send payment confirmed notification when status changes to 'confirmed'
   * @param {Object} booking - The booking object with user and room details
   * @param {string} language - Language code ('en' or 'zh')
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async sendPaymentConfirmedEmail(booking, language = 'zh') {
    try {
      const t = translations[language];

      // Extract email from various possible locations
      let userEmail = booking.email || booking.users?.email;

      // If still not found, try to parse from notes JSON
      if (!userEmail && booking.notes) {
        try {
          const notes = typeof booking.notes === 'string' ? JSON.parse(booking.notes) : booking.notes;
          userEmail = notes.email;
        } catch (e) {
          console.warn('Could not parse booking notes for email');
        }
      }

      if (!userEmail) {
        console.error('Cannot send email: booking email is missing', { booking });
        return { success: false, error: 'Booking email is missing' };
      }

      // Extract name from various possible locations
      let userName = booking.name || booking.users?.full_name || booking.users?.name;
      if (!userName && booking.notes) {
        try {
          const notes = typeof booking.notes === 'string' ? JSON.parse(booking.notes) : booking.notes;
          userName = notes.name;
        } catch (e) {
          // Ignore parsing errors
        }
      }
      userName = userName || 'Valued Customer';

      // Get room name safely
      const roomName = booking.room?.name || booking.rooms?.name || 'Room';

      // Get translated room name safely
      let roomNameTranslated = roomName;
      try {
        if (t && t.rooms && t.rooms.roomNames && roomName) {
          roomNameTranslated = t.rooms.roomNames[roomName] || roomName;
        }
      } catch (e) {
        console.warn('Could not translate room name, using original:', roomName);
      }

      const emailData = {
        to: userEmail,
        bcc: ADMIN_EMAIL, // Admin receives copy of all emails
        language: language,
        type: 'paymentConfirmed',
        booking: {
          name: userName,
          receiptNumber: booking.receiptNumber || booking.receipt_number || 'N/A',
          room: {
            name: roomName,
          },
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          confirmedAt: booking.payment_confirmed_at || new Date().toISOString(),
        },
        roomNameTranslated: roomNameTranslated,
      };

      console.log('📧 Sending payment confirmed email to:', emailData.to, '(BCC:', ADMIN_EMAIL, ')');

      const { data, error } = await supabase.functions.invoke('send-status-notification', {
        body: emailData,
      });

      if (error) {
        console.error('❌ Error sending email:', error);

        // Extract actual error details from error.context (for non-2xx responses)
        if (error.context) {
          try {
            const errorBody = await error.context.text();
            console.error('❌ Edge Function error details:', errorBody);
            return { success: false, error: `Edge Function error: ${errorBody}` };
          } catch (e) {
            console.error('❌ Could not read error context:', e);
          }
        }

        return { success: false, error: error.message || String(error) };
      }

      if (!data) {
        console.error('❌ Email sending failed: No response data');
        return { success: false, error: 'No response from email service' };
      }

      if (!data.success) {
        console.error('❌ Email sending failed:', data.error);
        return { success: false, error: data.error || 'Email sending failed' };
      }

      console.log('✅ Payment confirmed email sent successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Exception in sendPaymentConfirmedEmail:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send package assigned notification
   * @param {string} userEmail - User's email address
   * @param {string} userName - User's name
   * @param {string} packageType - Package type (BR15, BR30, DP20)
   * @param {number} amount - Amount added
   * @param {number} newBalance - New balance after assignment
   * @param {string} reason - Reason for assignment
   * @param {string|null} expiryDate - Expiry date (for DP20)
   * @param {string} language - Language code ('en' or 'zh')
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async sendPackageAssignedEmail(userEmail, userName, packageType, amount, newBalance, reason, expiryDate = null, language = 'zh') {
    try {
      if (!userEmail) {
        console.error('Cannot send email: user email is missing');
        return { success: false, error: 'User email is missing' };
      }

      const emailData = {
        to: userEmail,
        bcc: ADMIN_EMAIL, // Admin receives copy of all emails
        language: language,
        package: {
          name: userName || 'Valued Customer',
          packageType: packageType,
          amount: amount,
          newBalance: newBalance,
          reason: reason || 'Package purchase',
          expiryDate: expiryDate,
        },
      };

      console.log('📧 Sending package assigned email to:', emailData.to, '(BCC:', ADMIN_EMAIL, ')');
      console.log('📦 Package details:', { packageType, amount, newBalance, reason });

      const { data, error } = await supabase.functions.invoke('send-package-notification', {
        body: emailData,
      });

      if (error) {
        console.error('❌ Error sending email:', error);

        // Extract actual error details from error.context (for non-2xx responses)
        if (error.context) {
          try {
            const errorBody = await error.context.text();
            console.error('❌ Edge Function error details:', errorBody);
            return { success: false, error: `Edge Function error: ${errorBody}` };
          } catch (e) {
            console.error('❌ Could not read error context:', e);
          }
        }

        return { success: false, error: error.message };
      }

      if (!data?.success) {
        console.error('❌ Email sending failed:', data?.error);
        return { success: false, error: data?.error };
      }

      console.log('✅ Package assigned email sent successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Exception in sendPackageAssignedEmail:', error);
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

  /**
   * Send cancellation notification to admin when a booking is cancelled
   * @param {Object} booking - The cancelled booking object
   * @param {string} language - Language code ('en' or 'zh')
   * @param {boolean} cancelledByAdmin - True if admin cancelled on behalf of user
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async sendCancellationNotificationToAdmin(booking, language = 'zh', cancelledByAdmin = false) {
    try {
      const t = translations[language];

      // Extract user info
      let userName = booking.name || booking.users?.full_name || booking.users?.name;
      if (!userName && booking.notes) {
        try {
          const notes = typeof booking.notes === 'string' ? JSON.parse(booking.notes) : booking.notes;
          userName = notes.name;
        } catch (e) {
          // Ignore parsing errors
        }
      }
      userName = userName || 'Customer';

      // Extract email
      let userEmail = booking.email || booking.users?.email;
      if (!userEmail && booking.notes) {
        try {
          const notes = typeof booking.notes === 'string' ? JSON.parse(booking.notes) : booking.notes;
          userEmail = notes.email;
        } catch (e) {
          // Ignore parsing errors
        }
      }

      // Get room name safely
      const roomName = booking.room?.name || booking.rooms?.name || 'Room';

      // Get translated room name safely
      let roomNameTranslated = roomName;
      try {
        if (t && t.rooms && t.rooms.roomNames && roomName) {
          roomNameTranslated = t.rooms.roomNames[roomName] || roomName;
        }
      } catch (e) {
        console.warn('Could not translate room name, using original:', roomName);
      }

      // Format dates
      const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleDateString('en-GB');
      };

      const formatTime = (isoString) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      };

      // Prepare email data
      const emailData = {
        to: ADMIN_EMAIL, // Always send to admin
        language: language,
        booking: {
          name: userName,
          email: userEmail || 'N/A',
          receiptNumber: booking.receiptNumber || booking.receipt_number || 'N/A',
          room: {
            name: roomName,
          },
          date: booking.date || formatDate(booking.start_time),
          startTime: booking.startTime || formatTime(booking.start_time),
          endTime: booking.endTime || formatTime(booking.end_time),
          cancelledAt: formatDate(booking.cancelled_at) + ' ' + formatTime(booking.cancelled_at),
          cancellationReason: booking.cancellation_reason || (language === 'zh' ? '無原因提供' : 'No reason provided'),
          cancelledBy: cancelledByAdmin ? (language === 'zh' ? '管理員代取消' : 'Admin (on behalf)') : (language === 'zh' ? '用戶自行取消' : 'User cancelled'),
        },
        roomNameTranslated: roomNameTranslated,
      };

      console.log('📧 Sending cancellation notification to admin:', ADMIN_EMAIL);

      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-cancellation-notification', {
        body: emailData,
      });

      if (error) {
        console.error('❌ Error sending admin cancellation notification:', error);

        // Extract actual error details from error.context (for non-2xx responses)
        if (error.context) {
          try {
            const errorBody = await error.context.text();
            console.error('❌ Edge Function error details:', errorBody);
            return { success: false, error: `Edge Function error: ${errorBody}` };
          } catch (e) {
            console.error('❌ Could not read error context:', e);
          }
        }

        return { success: false, error: error.message || String(error) };
      }

      if (!data) {
        console.error('❌ Email sending failed: No response data');
        return { success: false, error: 'No response from email service' };
      }

      if (!data.success) {
        console.error('❌ Email sending failed:', data.error);
        return { success: false, error: data.error || 'Email sending failed' };
      }

      console.log('✅ Admin cancellation notification sent successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Exception in sendCancellationNotificationToAdmin:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send cancellation confirmation email to user (manually triggered by admin)
   * @param {Object} booking - The cancelled booking object
   * @param {string} language - Language code ('en' or 'zh')
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async sendCancellationEmailToUser(booking, language = 'zh') {
    try {
      const t = translations[language];

      // Extract user info
      let userName = booking.name || booking.users?.full_name || booking.users?.name;
      if (!userName && booking.notes) {
        try {
          const notes = typeof booking.notes === 'string' ? JSON.parse(booking.notes) : booking.notes;
          userName = notes.name;
        } catch (e) {
          // Ignore parsing errors
        }
      }
      userName = userName || 'Valued Customer';

      // Extract email
      let userEmail = booking.email || booking.users?.email;
      if (!userEmail && booking.notes) {
        try {
          const notes = typeof booking.notes === 'string' ? JSON.parse(booking.notes) : booking.notes;
          userEmail = notes.email;
        } catch (e) {
          // Ignore parsing errors
        }
      }

      if (!userEmail) {
        console.error('Cannot send email: user email is missing');
        return { success: false, error: 'User email is missing' };
      }

      // Get room name safely
      const roomName = booking.room?.name || booking.rooms?.name || 'Room';

      // Get translated room name safely
      let roomNameTranslated = roomName;
      try {
        if (t && t.rooms && t.rooms.roomNames && roomName) {
          roomNameTranslated = t.rooms.roomNames[roomName] || roomName;
        }
      } catch (e) {
        console.warn('Could not translate room name, using original:', roomName);
      }

      // Format dates
      const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleDateString('en-GB');
      };

      const formatTime = (isoString) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      };

      // Prepare email data
      const emailData = {
        to: userEmail,
        bcc: ADMIN_EMAIL, // Admin receives copy
        language: language,
        booking: {
          name: userName,
          receiptNumber: booking.receiptNumber || booking.receipt_number || 'N/A',
          room: {
            name: roomName,
          },
          date: booking.date || formatDate(booking.start_time),
          startTime: booking.startTime || formatTime(booking.start_time),
          endTime: booking.endTime || formatTime(booking.end_time),
          cancelledAt: formatDate(booking.cancelled_at) + ' ' + formatTime(booking.cancelled_at),
          cancellationReason: booking.cancellation_reason || (language === 'zh' ? '無原因提供' : 'No reason provided'),
          paymentMethod: booking.payment_method || booking.paymentMethod || 'cash',
          totalCost: booking.total_cost || booking.totalCost || 0,
        },
        roomNameTranslated: roomNameTranslated,
      };

      console.log('📧 Sending cancellation confirmation to user:', userEmail, '(BCC:', ADMIN_EMAIL, ')');

      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-cancellation-email', {
        body: emailData,
      });

      if (error) {
        console.error('❌ Error sending user cancellation email:', error);

        // Extract actual error details from error.context (for non-2xx responses)
        if (error.context) {
          try {
            const errorBody = await error.context.text();
            console.error('❌ Edge Function error details:', errorBody);
            return { success: false, error: `Edge Function error: ${errorBody}` };
          } catch (e) {
            console.error('❌ Could not read error context:', e);
          }
        }

        return { success: false, error: error.message || String(error) };
      }

      if (!data) {
        console.error('❌ Email sending failed: No response data');
        return { success: false, error: 'No response from email service' };
      }

      if (!data.success) {
        console.error('❌ Email sending failed:', data.error);
        return { success: false, error: data.error || 'Email sending failed' };
      }

      console.log('✅ User cancellation confirmation email sent successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Exception in sendCancellationEmailToUser:', error);
      return { success: false, error: error.message };
    }
  },
};
