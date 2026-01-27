import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, MapPin, Users, Clock, Mail, Phone, Edit, CheckCircle, Trash2, Hash, DollarSign, Eye, FileText, CalendarPlus, Plus, Send } from 'lucide-react';
import { EditBookingModal } from './EditBookingModal';
import { PaymentConfirmModal } from './PaymentConfirmModal';
import { ReceiptViewModal } from './ReceiptViewModal';
import { AdminCreateBookingModal } from './AdminCreateBookingModal';
import { Checkbox } from '@/components/ui/checkbox';
import { sendBookingConfirmationEmail } from '@/lib/email';
import { generateReceiptNumber } from '@/lib/utils';
import { bookingService, emailService, roomService } from '@/services';
import { openGoogleCalendar } from '@/lib/calendarUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


// Helper function to normalize booking data from Supabase or localStorage
const normalizeBooking = (booking) => {
  // Format dates for display
  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const formatDate = (isoString, includeWeekday = false) => {
    if (!isoString) return '';
    // Extract date parts directly from ISO string to avoid timezone issues
    const datePart = isoString.split('T')[0]; // Get YYYY-MM-DD
    const [year, month, day] = datePart.split('-');
    const dateString = `${day}/${month}/${year}`;

    if (!includeWeekday) {
      return dateString;
    }

    // Add day of week
    const date = new Date(year, month - 1, day);
    const weekdays = {
      zh: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
      en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    };
    const dayOfWeek = date.getDay();

    return `${dateString} (${weekdays.zh[dayOfWeek]})`;
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Extract user info from embedded users object or direct fields
  const userInfo = booking.users || booking.user || {};

  return {
    ...booking,
    // Normalize room data (Supabase uses 'rooms', localStorage uses 'room')
    room: booking.rooms || booking.room,
    // Normalize date fields with proper formatting
    createdAt: booking.created_at || booking.createdAt,
    confirmedAt: booking.confirmed_at || booking.confirmedAt,
    cancelledAt: booking.cancelled_at || booking.cancelledAt,
    date: booking.start_time ? formatDate(booking.start_time, true) : booking.date, // Include weekday
    startTime: booking.start_time ? formatTime(booking.start_time) : booking.startTime,
    endTime: booking.end_time ? formatTime(booking.end_time) : booking.endTime,
    // For display in date-time format
    startTimeFormatted: booking.start_time ? formatDateTime(booking.start_time) : null,
    endTimeFormatted: booking.end_time ? formatDateTime(booking.end_time) : null,
    bookingType: booking.booking_type || booking.bookingType,
    paymentMethod: booking.payment_method || booking.paymentMethod,
    paymentStatus: booking.payment_status || booking.paymentStatus,
    totalCost: booking.total_cost || booking.totalCost,
    userId: booking.user_id || booking.userId,
    roomId: booking.room_id || booking.roomId,
    // Map receipt number
    receiptNumber: booking.receipt_number || booking.receiptNumber,
    // Extract user data
    name: userInfo.full_name || booking.name || 'N/A',
    email: userInfo.email || booking.email || '',
    phone: userInfo.phone || booking.phone || '',
    // Other fields - handle notes which might be JSON
    guests: booking.guests || (() => {
      try {
        const notesData = typeof booking.notes === 'string' ? JSON.parse(booking.notes) : booking.notes;
        return notesData?.guests || 1;
      } catch {
        return 1;
      }
    })(),
    purpose: booking.purpose || (() => {
      try {
        const notesData = typeof booking.notes === 'string' ? JSON.parse(booking.notes) : booking.notes;
        return notesData?.purpose || '';
      } catch {
        return '';
      }
    })(),
    specialRequests: booking.special_requests || booking.specialRequests || (() => {
      try {
        const notesData = typeof booking.notes === 'string' ? JSON.parse(booking.notes) : booking.notes;
        return notesData?.specialRequests || '';
      } catch {
        return '';
      }
    })(),
    // Admin notes
    admin_notes: booking.admin_notes || '',
    // Normalize user data (Supabase embeds user object)
    user: userInfo,
  };
};

export const AdminBookingsTab = ({ bookings = [], setBookings, users = [], setUsers, filterStatus }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [editingBooking, setEditingBooking] = useState(null);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [bookingToConfirmPayment, setBookingToConfirmPayment] = useState(null);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [specificDate, setSpecificDate] = useState('');
  const [showCreateBookingModal, setShowCreateBookingModal] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [sendingEmailForBooking, setSendingEmailForBooking] = useState(null);
  const [shouldRefundTokens, setShouldRefundTokens] = useState(true);

  // Helper function to sort bookings based on filter status
  // For cancelled/confirmed filters: sort by action timestamp (newest first)
  // For other filters: sort by created_at (newest first)
  const sortBookings = (bookingsToSort, currentFilter) => {
    return [...bookingsToSort].sort((a, b) => {
      // Sort by cancelled_at when viewing cancelled filter
      if (currentFilter === 'cancelled' && a.status === 'cancelled' && b.status === 'cancelled') {
        const aDate = new Date(a.cancelled_at || a.created_at);
        const bDate = new Date(b.cancelled_at || b.created_at);
        return bDate - aDate; // Most recent cancellation first
      }

      // Sort by confirmed_at when viewing confirmed filter
      if (currentFilter === 'confirmed' && a.status === 'confirmed' && b.status === 'confirmed') {
        const aDate = new Date(a.confirmed_at || a.created_at);
        const bDate = new Date(b.confirmed_at || b.created_at);
        return bDate - aDate; // Most recent confirmation first
      }

      // Default: sort by created_at (newest first)
      return new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt);
    });
  };

  // Normalize and sort all bookings
  // useMemo ensures sorting is applied when bookings or filterStatus changes
  const normalizedBookings = useMemo(() => {
    const normalized = bookings.map(normalizeBooking);
    return sortBookings(normalized, filterStatus);
  }, [bookings, filterStatus]);

  // Load rooms on component mount
  useEffect(() => {
    const loadRooms = async () => {
      const result = await roomService.getRooms(true); // Include hidden rooms for admin
      if (result.success) {
        setRooms(result.rooms);
      }
    };
    loadRooms();
  }, []);

  const handleAddToCalendar = (booking) => {
    try {
      openGoogleCalendar(booking, language, t);
      toast({
        title: t.booking.calendar.addSuccess,
        description: t.booking.calendar.addSuccessDesc,
      });
    } catch (error) {
      console.error('Failed to open Google Calendar:', error);
      toast({
        title: t.booking.calendar.addError,
        description: t.booking.calendar.addErrorDesc,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateBookingStatus = (bookingId, newStatus) => {
    const allBookings = JSON.parse(localStorage.getItem('ofcoz_bookings') || '[]');
    const bookingToUpdate = allBookings.find(b => b.id === bookingId);
    
    if (!bookingToUpdate) return;

    let updatedBooking = { ...bookingToUpdate, status: newStatus };
    if (!updatedBooking.receiptNumber) {
      updatedBooking.receiptNumber = generateReceiptNumber();
    }

    const updatedBookings = allBookings.map(b =>
      b.id === bookingId ? updatedBooking : b
    );
    localStorage.setItem('ofcoz_bookings', JSON.stringify(updatedBookings));
    setBookings(sortBookings(updatedBookings, filterStatus));
    
    if (newStatus === 'confirmed') {
      sendBookingConfirmationEmail(updatedBooking, language);
      toast({
        title: language === 'zh' ? '預約已確認' : 'Booking Confirmed',
        description: language === 'zh' ? '確認電郵已發送給用戶。' : 'A confirmation email has been sent to the user.'
      });
    } else {
      toast({
        title: language === 'zh' ? '狀態已更新' : 'Status Updated',
        description: language === 'zh' ? '預約狀態已成功更新' : 'Booking status has been successfully updated'
      });
    }
  };

  const handleAdminCancelBooking = async () => {
    if (!bookingToCancel || !currentUser?.id) return;

    try {
      // Call the admin cancel booking service
      const result = await bookingService.adminCancelBooking(
        bookingToCancel.id,
        currentUser.id,
        'Cancelled by admin',
        shouldRefundTokens
      );

      if (!result.success) {
        toast({
          title: language === 'zh' ? '取消失敗' : 'Cancellation Failed',
          description: result.error,
          variant: 'destructive'
        });
        return;
      }

      // Update local bookings state with sorting
      setBookings(prevBookings => {
        const updatedBookings = prevBookings.map(b =>
          b.id === bookingToCancel.id
            ? { ...b, status: 'cancelled', cancelled_at: new Date().toISOString(), cancellation_reviewed: false }
            : b
        );
        return sortBookings(updatedBookings, filterStatus);
      });

      // Send cancellation email to user
      try {
        const cancelledBooking = result.booking;
        if (cancelledBooking) {
          console.log('📧 Sending cancellation email to user...');
          const normalizedBooking = normalizeBooking(cancelledBooking);
          const emailResult = await emailService.sendCancellationEmailToUser(normalizedBooking, language);

          if (!emailResult.success) {
            console.error('❌ Failed to send user cancellation email:', emailResult.error);
            // Show warning but don't fail the cancellation
            toast({
              title: t.booking.cancelSuccess,
              description: language === 'zh'
                ? '預約已取消，但電郵發送失敗。請手動通知用戶。'
                : 'Booking cancelled, but email failed to send. Please notify user manually.',
              variant: 'warning',
            });
          } else {
            console.log('✅ User cancellation email sent successfully');
            toast({
              title: t.booking.cancelSuccess,
              description: language === 'zh'
                ? '預約已取消，取消確認郵件已發送給用戶。'
                : 'Booking cancelled. Cancellation email has been sent to the user.'
            });
          }
        }
      } catch (emailError) {
        console.error('❌ Error sending user cancellation email:', emailError);
        // Show success for cancellation but note email issue
        toast({
          title: t.booking.cancelSuccess,
          description: language === 'zh'
            ? '預約已取消，但電郵發送失敗。'
            : 'Booking cancelled, but email failed to send.',
        });
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: language === 'zh' ? '取消失敗' : 'Cancellation Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setBookingToCancel(null);
      setShouldRefundTokens(true); // Reset to default
    }
  };
  
  const handleSaveBooking = async (updatedBooking) => {
    try {
      // Convert date and time to ISO timestamps for database
      const startTime = `${updatedBooking.date}T${updatedBooking.startTime}:00`;
      const endTime = `${updatedBooking.date}T${updatedBooking.endTime}:00`;

      // Prepare update data
      const updates = {
        room_id: updatedBooking.room.id,
        start_time: startTime,
        end_time: endTime,
        admin_notes: updatedBooking.admin_notes || null
      };

      // Update booking in database
      const result = await bookingService.updateBooking(updatedBooking.id, updates);

      if (!result.success) {
        toast({
          title: language === 'zh' ? '更新失敗' : 'Update Failed',
          description: result.error,
          variant: "destructive"
        });
        return;
      }

      // Refresh bookings list
      const refreshResult = await bookingService.getAllBookings();
      if (refreshResult.success) {
        setBookings(sortBookings(refreshResult.bookings, filterStatus));
      }
      setEditingBooking(null);

      toast({
        title: t.admin.bookingUpdated,
        description: t.admin.bookingUpdatedDesc
      });
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: language === 'zh' ? '更新失敗' : 'Update Failed',
        description: error.message || (language === 'zh' ? '無法更新預約' : 'Failed to update booking'),
        variant: "destructive"
      });
    }
  };

  // Handle payment confirmation for cash bookings
  const handleConfirmPayment = async (adminNotes) => {
    if (!bookingToConfirmPayment || !currentUser) return;

    setIsConfirmingPayment(true);

    try {
      const result = await bookingService.markAsPaid(
        bookingToConfirmPayment.id,
        currentUser.id,
        adminNotes
      );

      if (!result.success) {
        toast({
          title: language === 'zh' ? '操作失敗' : 'Operation Failed',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      // Reload all bookings from Supabase to get fresh data
      const bookingsResult = await bookingService.getAllBookings();
      if (bookingsResult.success) {
        setBookings(sortBookings(bookingsResult.bookings, filterStatus));
        console.log('✅ Bookings reloaded after payment confirmation');
      }

      // Send payment confirmed email notification
      console.log('📧 Sending payment confirmed email to user...');
      const normalizedBooking = normalizeBooking(result.booking || bookingToConfirmPayment);
      const emailResult = await emailService.sendPaymentConfirmedEmail(normalizedBooking, language);

      if (!emailResult.success) {
        console.error('❌ Failed to send payment confirmed email:', emailResult.error);
      } else {
        console.log('✅ Payment confirmed email sent successfully');
      }

      toast({
        title: language === 'zh' ? '付款已確認' : 'Payment Confirmed',
        description: language === 'zh'
          ? '預約已確認，客戶將收到通知。'
          : 'Booking confirmed. Customer will be notified.',
      });

      setBookingToConfirmPayment(null);
    } catch (error) {
      console.error('Payment confirmation error:', error);
      toast({
        title: language === 'zh' ? '發生錯誤' : 'Error Occurred',
        description: language === 'zh'
          ? '無法確認付款，請稍後再試。'
          : 'Could not confirm payment. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  // Handle viewing receipt
  const handleViewReceipt = (booking) => {
    setViewingReceipt(booking);
    setShowReceiptModal(true);
  };

  // Handle confirming payment from receipt modal
  const handleConfirmPaymentFromReceipt = async (booking) => {
    if (!booking || !currentUser) return;

    try {
      // Admin confirmation always goes directly to 'confirmed'
      const now = new Date().toISOString();
      const result = await bookingService.updateBooking(booking.id, {
        status: 'confirmed',
        payment_status: 'completed',
        payment_confirmed_at: now,
        payment_confirmed_by: currentUser.id,
        confirmed_at: now, // Track when booking was confirmed
      });

      if (!result.success) {
        toast({
          title: language === 'zh' ? '操作失敗' : 'Operation Failed',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      // Send confirmation email notification
      console.log('📧 Sending booking confirmation email to user...');
      const normalizedBooking = normalizeBooking(result.booking || booking);
      const emailResult = await emailService.sendPaymentConfirmedEmail(normalizedBooking, language);

      if (!emailResult.success) {
        console.error('❌ Failed to send confirmation email:', emailResult.error);
        toast({
          title: language === 'zh' ? '預約已確認' : 'Booking Confirmed',
          description: language === 'zh'
            ? '預約已確認，但電郵發送失敗。請手動通知客戶。'
            : 'Booking confirmed, but email failed to send. Please notify customer manually.',
          variant: 'warning',
        });
      } else {
        console.log('✅ Confirmation email sent successfully');
        toast({
          title: language === 'zh' ? '預約已確認' : 'Booking Confirmed',
          description: language === 'zh'
            ? '預約已確認，確認電郵已發送給客戶。'
            : 'Booking confirmed. Confirmation email has been sent to customer.',
        });
      }

      // Reload all bookings from Supabase
      const bookingsResult = await bookingService.getAllBookings();
      if (bookingsResult.success) {
        setBookings(sortBookings(bookingsResult.bookings, filterStatus));
      }

      // Close the modal
      setShowReceiptModal(false);
      setViewingReceipt(null);
    } catch (error) {
      console.error('Payment confirmation error:', error);
      toast({
        title: language === 'zh' ? '發生錯誤' : 'Error Occurred',
        description: error.message || (language === 'zh' ? '無法確認付款，請稍後再試。' : 'Could not confirm payment. Please try again later.'),
        variant: 'destructive',
      });
    }
  };

  // Handle sending cancellation email to user
  const handleSendCancellationEmail = async (booking) => {
    if (!booking) return;

    setSendingEmailForBooking(booking.id);

    try {
      const normalizedBooking = normalizeBooking(booking);
      const result = await emailService.sendCancellationEmailToUser(normalizedBooking, language);

      if (!result.success) {
        toast({
          title: language === 'zh' ? '發送失敗' : 'Send Failed',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: t.admin.cancellationEmailSent,
        description: t.admin.cancellationEmailSentDesc,
      });
    } catch (error) {
      console.error('Error sending cancellation email:', error);
      toast({
        title: language === 'zh' ? '發生錯誤' : 'Error Occurred',
        description: error.message || (language === 'zh' ? '無法發送郵件' : 'Could not send email'),
        variant: 'destructive',
      });
    } finally {
      setSendingEmailForBooking(null);
    }
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : (language === 'zh' ? '訪客' : 'Guest');
  };

  // Date filtering helper functions
  const isToday = (dateString) => {
    if (!dateString) return false;
    const bookingDate = new Date(dateString);
    const today = new Date();
    return bookingDate.toDateString() === today.toDateString();
  };

  const isThisWeek = (dateString) => {
    if (!dateString) return false;
    const bookingDate = new Date(dateString);
    const today = new Date();

    // Get the start of this week (Monday)
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Sunday
    startOfWeek.setDate(today.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // Get the end of this week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return bookingDate >= startOfWeek && bookingDate <= endOfWeek;
  };

  const isThisMonth = (dateString) => {
    if (!dateString) return false;
    const bookingDate = new Date(dateString);
    const today = new Date();
    return bookingDate.getMonth() === today.getMonth() &&
           bookingDate.getFullYear() === today.getFullYear();
  };

  const isSpecificDate = (dateString, targetDate) => {
    if (!dateString || !targetDate) return false;
    const bookingDate = new Date(dateString);
    const target = new Date(targetDate);
    return bookingDate.toDateString() === target.toDateString();
  };

  const matchesDateFilter = (booking) => {
    if (dateFilter === 'all') return true;

    const dateToCheck = booking.start_time || booking.startTimeFormatted;

    switch (dateFilter) {
      case 'today':
        return isToday(dateToCheck);
      case 'thisWeek':
        return isThisWeek(dateToCheck);
      case 'thisMonth':
        return isThisMonth(dateToCheck);
      case 'specific':
        return isSpecificDate(dateToCheck, specificDate);
      default:
        return true;
    }
  };

  const getStatusText = (status) => {
    return t.booking.status[status] || status;
  };
  
  const filterTitles = {
    all: language === 'zh' ? '所有預約' : 'All Bookings',
    confirmed: language === 'zh' ? '已確認預約' : 'Confirmed Bookings',
    pending: language === 'zh' ? '待確認預約' : 'Pending Bookings',
    to_be_confirmed: language === 'zh' ? '待確認預約' : 'To Be Confirmed',
    cancelled: language === 'zh' ? '已取消預約' : 'Cancelled Bookings',
    pending_cancellation_review: language === 'zh' ? '待確認取消' : 'Pending Cancellation Review',
    modified: language === 'zh' ? '已修改預約' : 'Modified Bookings',
    paid: language === 'zh' ? '已付款預約' : 'Paid Bookings',
  };

  // Apply date filtering
  const filteredByDateBookings = normalizedBookings.filter(matchesDateFilter);

  const handleBookingCreated = (newBooking) => {
    // Add the new booking to the list with sorting
    setBookings(sortBookings([newBooking, ...bookings], filterStatus));
    toast({
      title: t.admin.bookingCreatedSuccess,
      description: language === 'zh' ? '預約已成功建立' : 'Booking created successfully',
    });
  };

  // Track previous filter status and unreviewed cancellations to detect when admin navigates away
  const prevFilterStatusRef = useRef(filterStatus);
  const unreviewedCancellationsRef = useRef([]);

  // Auto-mark cancelled bookings as reviewed when LEAVING the pending_cancellation_review filter
  useEffect(() => {
    const prevFilterStatus = prevFilterStatusRef.current;

    // If we're LEAVING the pending_cancellation_review filter, mark all as reviewed
    if (prevFilterStatus === 'pending_cancellation_review' && filterStatus !== 'pending_cancellation_review') {
      const cancellationsToReview = unreviewedCancellationsRef.current;

      if (cancellationsToReview.length > 0) {
        console.log(`🔍 Admin leaving pending cancellation review - marking ${cancellationsToReview.length} cancellations as reviewed`);

        // Mark all viewed cancellations as reviewed
        cancellationsToReview.forEach(async (booking) => {
          const result = await bookingService.markCancellationReviewed(booking.id);

          if (result.success) {
            // Update local state to reflect the change
            setBookings(prevBookings =>
              prevBookings.map(b =>
                b.id === booking.id
                  ? { ...b, cancellation_reviewed: true }
                  : b
              )
            );
          }
        });

        // Clear the ref after marking as reviewed
        unreviewedCancellationsRef.current = [];
      }
    }

    // Store the current unreviewed cancellations when ENTERING pending_cancellation_review
    if (filterStatus === 'pending_cancellation_review') {
      unreviewedCancellationsRef.current = filteredByDateBookings.filter(
        b => b.status === 'cancelled' && b.cancellation_reviewed === false
      );
    }

    // Update ref for next render
    prevFilterStatusRef.current = filterStatus;
  }, [filterStatus, filteredByDateBookings]); // Re-run when filter changes or bookings update

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-amber-800">
          {filterTitles[filterStatus]}
        </h2>
        <Button
          onClick={() => setShowCreateBookingModal(true)}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t.admin.createBooking}
        </Button>
      </div>

      {/* Date Filter Buttons */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setDateFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            dateFilter === 'all'
              ? 'bg-amber-500 text-white'
              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
          }`}
        >
          {t.booking.dateFilters.allDates}
        </button>
        <button
          onClick={() => setDateFilter('today')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            dateFilter === 'today'
              ? 'bg-amber-500 text-white'
              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
          }`}
        >
          {t.booking.dateFilters.today}
        </button>
        <button
          onClick={() => setDateFilter('thisWeek')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            dateFilter === 'thisWeek'
              ? 'bg-amber-500 text-white'
              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
          }`}
        >
          {t.booking.dateFilters.thisWeek}
        </button>
        <button
          onClick={() => setDateFilter('thisMonth')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            dateFilter === 'thisMonth'
              ? 'bg-amber-500 text-white'
              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
          }`}
        >
          {t.booking.dateFilters.thisMonth}
        </button>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={specificDate}
            onChange={(e) => {
              setSpecificDate(e.target.value);
              if (e.target.value) {
                setDateFilter('specific');
              }
            }}
            className="px-4 py-2 rounded-lg border border-amber-200 focus:border-amber-400 focus:outline-none"
          />
          {specificDate && (
            <button
              onClick={() => {
                setSpecificDate('');
                setDateFilter('all');
              }}
              className="px-3 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors text-sm"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Show count of filtered bookings */}
      {dateFilter !== 'all' && (
        <div className="mb-4 text-sm text-amber-700">
          {language === 'zh' ? '顯示' : 'Showing'} {filteredByDateBookings.length} {language === 'zh' ? '個預約' : 'bookings'}
        </div>
      )}

      {!bookings || bookings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-amber-300 mx-auto mb-4" />
          <p className="text-amber-600 text-lg">
            {language === 'zh' ? '此類別暫無預約記錄' : 'No bookings in this category yet'}
          </p>
        </div>
      ) : filteredByDateBookings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-amber-300 mx-auto mb-4" />
          <p className="text-amber-600 text-lg">
            {language === 'zh' ? '所選日期範圍內無預約記錄' : 'No bookings found for the selected date range'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredByDateBookings.map((booking) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-amber-200 rounded-lg p-6 bg-white/50"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-amber-800">
                    {booking.room?.name ? t.rooms.roomNames[booking.room.name] : 'Unknown Room'}
                  </h3>
                  {booking.receiptNumber && (
                    <div className="flex items-center text-gray-500 text-sm mt-1">
                      <Hash className="w-3 h-3 mr-1" />
                      <span>{booking.receiptNumber}</span>
                    </div>
                  )}
                  {/* Show action date with time for cancelled/confirmed filters */}
                  {filterStatus === 'cancelled' && booking.cancelled_at ? (
                    <div className="flex flex-col text-amber-600 mt-1 space-y-0.5">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="text-sm font-semibold">
                          {language === 'zh' ? '取消於' : 'Cancelled on'} {new Date(booking.cancelled_at).toLocaleString(language === 'zh' ? 'zh-HK' : 'en-GB', {
                            year: 'numeric', month: '2-digit', day: '2-digit',
                            hour: '2-digit', minute: '2-digit', hour12: false
                          })}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 ml-5">
                        {language === 'zh' ? '預約於' : 'Booked on'} {new Date(booking.createdAt).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                  ) : filterStatus === 'confirmed' && booking.confirmedAt ? (
                    <div className="flex flex-col text-amber-600 mt-1 space-y-0.5">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="text-sm font-semibold">
                          {language === 'zh' ? '確認於' : 'Confirmed on'} {new Date(booking.confirmedAt).toLocaleString(language === 'zh' ? 'zh-HK' : 'en-GB', {
                            year: 'numeric', month: '2-digit', day: '2-digit',
                            hour: '2-digit', minute: '2-digit', hour12: false
                          })}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 ml-5">
                        {language === 'zh' ? '預約於' : 'Booked on'} {new Date(booking.createdAt).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center text-amber-600 mt-1">
                      <Clock className="w-4 h-4 mr-1" />
                      <span className="text-sm">
                        {language === 'zh' ? '預約於' : 'Booked on'} {new Date(booking.createdAt).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  )}
                  {booking.bookingType === 'token' && booking.tokensUsed > 0 && (
                    <div className="flex items-center mt-1">
                      <span className="token-badge text-xs">
                        <span className="token-icon"></span>
                        {booking.tokensUsed} {language === 'zh' ? '代幣已使用' : 'tokens used'}
                      </span>
                    </div>
                  )}
                   {booking.bookingType === 'cash' && (
                    <div className="flex items-center mt-1">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{language === 'zh' ? '現金支付' : 'Cash Payment'}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'to_be_confirmed' ? 'bg-blue-100 text-blue-800' :
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    booking.status === 'rescheduled' ? 'bg-purple-100 text-purple-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getStatusText(booking.status)}
                  </span>
                  {/* Show "Cancelled on behalf" indicator if admin cancelled for user */}
                  {booking.status === 'cancelled' && booking.cancelled_by && booking.user_id && booking.cancelled_by !== booking.user_id && (
                    <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800 font-medium">
                      {language === 'zh' ? '代用戶取消' : 'Cancelled on behalf'}
                    </span>
                  )}
                  {/* Send Cancellation Email button for cancelled bookings */}
                  {booking.status === 'cancelled' && (
                    booking.cancellation_email_sent ? (
                      <span className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-600 font-medium">
                        {t.admin.emailSent}
                      </span>
                    ) : (
                      <Button
                        onClick={() => handleSendCancellationEmail(booking)}
                        size="sm"
                        disabled={sendingEmailForBooking === booking.id}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                      >
                        <Send className="w-4 h-4 mr-1" />
                        {sendingEmailForBooking === booking.id ? t.admin.sendingEmail : t.admin.sendCancellationEmail}
                      </Button>
                    )
                  )}
                  {booking.receipt_url && (
                    <Button
                      onClick={() => handleViewReceipt(booking)}
                      size="sm"
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {t.booking.receipt.viewReceipt}
                    </Button>
                  )}
                  {booking.status === 'to_be_confirmed' && booking.receipt_url && (
                    <Button onClick={() => handleViewReceipt(booking)} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {t.admin.confirmBooking}
                    </Button>
                  )}
                  {/* Only show "waiting for receipt" message for CASH payments without receipts */}
                  {booking.status === 'to_be_confirmed' && !booking.receipt_url && booking.paymentMethod === 'cash' && (
                    <span className="text-sm text-yellow-600 italic">{language === 'zh' ? '等待收據上傳' : 'Awaiting receipt upload'}</span>
                  )}
                  {/* For token/DP20/BR15/BR30 payments with to_be_confirmed status, show confirmation button */}
                  {booking.status === 'to_be_confirmed' && ['token', 'dp20', 'br15', 'br30'].includes(booking.paymentMethod) && (
                    <Button onClick={() => handleViewReceipt(booking)} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {t.admin.confirmBooking}
                    </Button>
                  )}
                  {booking.status === 'pending' && !booking.receipt_url && booking.paymentMethod === 'cash' && (
                    <span className="text-sm text-yellow-600 italic">{language === 'zh' ? '等待收據上傳' : 'Awaiting receipt upload'}</span>
                  )}
                  {booking.status === 'pending' && booking.payment_status === 'pending' && (
                    <Button
                      onClick={() => setBookingToConfirmPayment(booking)}
                      size="sm"
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                    >
                      <DollarSign className="w-4 h-4 mr-1" />
                      {language === 'zh' ? '確認收款' : 'Mark as Paid'}
                    </Button>
                  )}
                  {(booking.status === 'confirmed' || booking.status === 'to_be_confirmed') && (
                    <Button
                      onClick={() => handleAddToCalendar(booking)}
                      size="sm"
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <CalendarPlus className="w-4 h-4 mr-1" />
                      {t.booking.calendar.addToCalendar}
                    </Button>
                  )}
                   {booking.status !== 'cancelled' && (
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button size="sm" variant="destructive" onClick={() => setBookingToCancel(booking)}>
                              <Trash2 className="w-4 h-4 mr-1" />
                              {language === 'zh' ? '取消' : 'Cancel'}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{language === 'zh' ? '確認取消' : 'Confirm Cancellation'}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {language === 'zh' ? '您確定要取消此預約嗎？此操作無法撤銷。' : 'Are you sure you want to cancel this booking? This action cannot be undone.'}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          {/* Show refund checkbox only for token/package payments */}
                          {bookingToCancel && ['token', 'dp20', 'br15', 'br30'].includes(bookingToCancel.paymentMethod) && (
                            <div className="flex items-start space-x-3 px-6 py-4">
                              <Checkbox
                                id="refund-tokens"
                                checked={shouldRefundTokens}
                                onCheckedChange={(newValue) => setShouldRefundTokens(newValue)}
                                defaultChecked={true}
                              />
                              <div className="grid gap-1.5 leading-none">
                                <label
                                  htmlFor="refund-tokens"
                                  className="text-sm font-medium leading-none cursor-pointer select-none"
                                >
                                  {t.admin.refundTokens}
                                </label>
                                <p className="text-sm text-gray-600">
                                  {t.admin.refundTokensDesc}
                                </p>
                              </div>
                            </div>
                          )}
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => {
                              setBookingToCancel(null);
                              setShouldRefundTokens(true);
                            }}>
                              {language === 'zh' ? '返回' : 'Back'}
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={handleAdminCancelBooking}>{language === 'zh' ? '確認取消' : 'Confirm Cancel'}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  )}
                  <Button onClick={() => setEditingBooking(booking)} size="sm" variant="outline" className="border-amber-300 text-amber-700">
                    <Edit className="w-4 h-4 mr-1" />
                    {t.admin.editBooking}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-4">
                {/* 1. Date */}
                <div className="flex items-center text-amber-700">
                  <Calendar className="w-4 h-4 mr-2" />
                  <div>{language === 'zh' ? '日期' : 'Date'}: {booking.date}</div>
                </div>

                {/* 2. Time */}
                <div className="flex items-center text-amber-700">
                  <Clock className="w-4 h-4 mr-2" />
                  <div>{booking.startTime} - {booking.endTime}</div>
                </div>

                {/* 3. User name */}
                <div className="flex items-center text-amber-700">
                  <Users className="w-4 h-4 mr-2" />
                  <div>
                    <div className="font-medium">{booking.name}</div>
                  </div>
                </div>

                {/* 4. Email */}
                <div className="flex items-center text-amber-700">
                  <Mail className="w-4 h-4 mr-2" />
                  <div>{booking.email}</div>
                </div>

                {/* 5. Phone */}
                {booking.phone && (
                  <div className="flex items-center text-amber-700">
                    <Phone className="w-4 h-4 mr-2" />
                    <div>{booking.phone}</div>
                  </div>
                )}

                {/* 6. Number of guests */}
                <div className="flex items-center text-amber-700">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{booking.guests} {language === 'zh' ? '位客人' : 'guest(s)'}</span>
                </div>

                {/* 7. Tokens/Credits Used */}
                {booking.totalCost && (
                  <div className="flex items-center text-amber-700">
                    <DollarSign className="w-4 h-4 mr-2" />
                    <div className="font-medium">
                      {booking.paymentMethod === 'token' && (
                        <span>{booking.totalCost} {language === 'zh' ? '代幣已使用 (Token)' : 'tokens used (Token)'}</span>
                      )}
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
                      {booking.paymentMethod === 'dp20' && (
                        <span className="text-green-700">
                          1 {language === 'zh' ? '日 (DP20包)' : 'day (DP20)'}
                        </span>
                      )}
                      {booking.paymentMethod === 'cash' && (
                        <span className="text-gray-700">
                          ${Number(booking.totalCost).toFixed(2)} {language === 'zh' ? '現金' : 'Cash'}
                        </span>
                      )}
                      {!['token', 'br15', 'br30', 'dp20', 'cash'].includes(booking.paymentMethod) && (
                        <span>${Number(booking.totalCost).toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {booking.purpose && (
                <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-700"><strong>{t.booking.purpose}: </strong>{booking.purpose}</p>
                </div>
              )}
              {booking.equipment && booking.equipment.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 font-semibold mb-2">
                    {language === 'zh' ? '設備需求：' : 'Equipment Required:'}
                  </p>
                  <div className="space-y-1">
                    {booking.equipment.map((item, index) => {
                      const equipmentLabel = t.booking.equipmentOptions[item.type] || item.type;
                      const quantity = item.quantity || item.amount || 0;
                      return (
                        <p key={index} className="text-sm text-blue-700">
                          • {equipmentLabel}: <span className="font-semibold">{quantity}</span> {language === 'zh' ? '個' : 'pc(s)'}
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}
              {booking.specialRequests && (
                <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-700"><strong>{language === 'zh' ? '備註：' : 'Remarks: '}</strong>{booking.specialRequests}</p>
                </div>
              )}
              {booking.admin_notes && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>{language === 'zh' ? '📝 管理員備註：' : '📝 Admin Notes: '}</strong>
                    {booking.admin_notes}
                  </p>
                </div>
              )}
              {booking.status === 'cancelled' && booking.cancelled_at && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm text-red-800 space-y-1">
                    <p><strong>{t.booking.cancellation.cancelledAt}:</strong> {new Date(booking.cancelled_at).toLocaleString(language === 'zh' ? 'zh-HK' : 'en-US')}</p>
                    {booking.cancellation_hours_before !== null && (
                      <p><strong>{language === 'zh' ? '提前時間：' : 'Hours before: '}</strong>
                        {booking.cancellation_hours_before} {language === 'zh' ? '小時' : 'hours'}
                        {booking.cancellation_hours_before >= 48 ?
                          ` (${t.booking.cancellation.moreThan48h})` :
                          ` (${t.booking.cancellation.lessThan48h})`
                        }
                      </p>
                    )}
                    {booking.token_deducted_for_cancellation && (
                      <p className="font-semibold text-orange-700">
                        ⚠️ {t.booking.cancellation.tokenDeducted}
                      </p>
                    )}
                    {booking.cancellation_reason && (
                      <p><strong>{language === 'zh' ? '取消原因：' : 'Reason: '}</strong>{booking.cancellation_reason}</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
      {editingBooking && (
        <EditBookingModal
          isOpen={!!editingBooking}
          onClose={() => setEditingBooking(null)}
          booking={editingBooking}
          onSave={handleSaveBooking}
        />
      )}
      <PaymentConfirmModal
        isOpen={!!bookingToConfirmPayment}
        onClose={() => setBookingToConfirmPayment(null)}
        booking={bookingToConfirmPayment}
        onConfirm={handleConfirmPayment}
        isLoading={isConfirmingPayment}
      />
      <ReceiptViewModal
        isOpen={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setViewingReceipt(null);
        }}
        booking={viewingReceipt}
        onConfirm={handleConfirmPaymentFromReceipt}
      />
      <AdminCreateBookingModal
        isOpen={showCreateBookingModal}
        onClose={() => setShowCreateBookingModal(false)}
        users={users}
        rooms={rooms}
        onBookingCreated={handleBookingCreated}
      />
    </div>
  );
};