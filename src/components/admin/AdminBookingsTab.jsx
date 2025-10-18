import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, MapPin, Users, Clock, Mail, Phone, Edit, CheckCircle, Trash2, Hash, DollarSign, Eye, FileText, CalendarPlus } from 'lucide-react';
import { EditBookingModal } from './EditBookingModal';
import { PaymentConfirmModal } from './PaymentConfirmModal';
import { ReceiptViewModal } from './ReceiptViewModal';
import { sendBookingConfirmationEmail } from '@/lib/email';
import { generateReceiptNumber } from '@/lib/utils';
import { bookingService } from '@/services';
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

  const formatDate = (isoString) => {
    if (!isoString) return '';
    // Extract date parts directly from ISO string to avoid timezone issues
    const datePart = isoString.split('T')[0]; // Get YYYY-MM-DD
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year}`;
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
    date: booking.start_time ? formatDate(booking.start_time) : booking.date,
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

  // Normalize all bookings
  const normalizedBookings = bookings.map(normalizeBooking);

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
    setBookings(updatedBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    
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

  const handleAdminCancelBooking = () => {
    if (!bookingToCancel) return;
    const allBookings = JSON.parse(localStorage.getItem('ofcoz_bookings') || '[]');
    const bookingToCancelData = allBookings.find(b => b.id === bookingToCancel);

    if (!bookingToCancelData) return;

    if (bookingToCancelData.bookingType === 'token' && bookingToCancelData.userId && bookingToCancelData.tokensUsed > 0) {
      const allUsers = JSON.parse(localStorage.getItem('ofcoz_users') || '[]');
      const userIndex = allUsers.findIndex(u => u.id === bookingToCancelData.userId);
      if (userIndex !== -1) {
        allUsers[userIndex].tokens += bookingToCancelData.tokensUsed;
        localStorage.setItem('ofcoz_users', JSON.stringify(allUsers));
        setUsers(allUsers);
        toast({ title: t.booking.tokensRefunded, description: t.booking.tokensRefundedDesc.replace('{count}', bookingToCancelData.tokensUsed) });
      }
    }

    const updatedBookings = allBookings.map(b =>
      b.id === bookingToCancel ? { ...b, status: 'cancelled' } : b
    );
    localStorage.setItem('ofcoz_bookings', JSON.stringify(updatedBookings));
    setBookings(updatedBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

    toast({ title: t.booking.cancelSuccess, description: t.booking.cancelSuccessDesc });
    setBookingToCancel(null);
  };
  
  const handleSaveBooking = (updatedBooking) => {
    const allBookings = JSON.parse(localStorage.getItem('ofcoz_bookings') || '[]');
    let hasConflict = false;

    const roomBookings = allBookings.filter(booking =>
      booking.room.id === updatedBooking.room.id &&
      booking.date === updatedBooking.date &&
      booking.status === 'confirmed' &&
      booking.id !== updatedBooking.id
    );

    const newStart = new Date(`${updatedBooking.date}T${updatedBooking.startTime}:00`);
    const newEnd = new Date(`${updatedBooking.date}T${updatedBooking.endTime}:00`);

    hasConflict = roomBookings.some(booking => {
      const existingStart = new Date(`${booking.date}T${booking.startTime}:00`);
      const existingEnd = new Date(`${booking.date}T${booking.endTime}:00`);
      return (newStart < existingEnd && newEnd > existingStart);
    });

    if (updatedBooking.room.id === 1) { // B&C
        const roomCBookings = allBookings.filter(b => b.room.id === 2 && b.date === updatedBooking.date && b.status === 'confirmed' && b.id !== updatedBooking.id);
        if(roomCBookings.some(b => (newStart < new Date(`${b.date}T${b.endTime}:00`) && newEnd > new Date(`${b.date}T${b.startTime}:00`)))) {
            hasConflict = true;
        }
    } else if (updatedBooking.room.id === 2) { // C
        const roomBCBookings = allBookings.filter(b => b.room.id === 1 && b.date === updatedBooking.date && b.status === 'confirmed' && b.id !== updatedBooking.id);
        if(roomBCBookings.some(b => (newStart < new Date(`${b.date}T${b.endTime}:00`) && newEnd > new Date(`${b.date}T${b.startTime}:00`)))) {
            hasConflict = true;
        }
    }

    if (hasConflict) {
      toast({
        title: t.booking.timeConflict,
        description: t.booking.timeConflictDesc,
        variant: "destructive"
      });
      return;
    }

    const originalBooking = allBookings.find(b => b.id === updatedBooking.id);
    const requiresReconfirmation = !originalBooking.userId || originalBooking.userId !== updatedBooking.userId || originalBooking.date !== updatedBooking.date || originalBooking.startTime !== updatedBooking.startTime || originalBooking.endTime !== updatedBooking.endTime;

    let finalBooking = { ...updatedBooking, status: 'modified' };
    if (!finalBooking.receiptNumber) {
      finalBooking.receiptNumber = generateReceiptNumber();
    }

    const updatedBookingsList = allBookings.map(b => b.id === finalBooking.id ? finalBooking : b);
    localStorage.setItem('ofcoz_bookings', JSON.stringify(updatedBookingsList));
    setBookings(updatedBookingsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    setEditingBooking(null);

    toast({
      title: t.admin.bookingUpdated,
      description: requiresReconfirmation ? (language === 'zh' ? '訂單已修改，等待客戶重新確認。' : 'Booking modified and awaiting re-confirmation.') : t.admin.bookingUpdatedDesc
    });
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
        setBookings(bookingsResult.bookings);
        console.log('✅ Bookings reloaded after payment confirmation');
      }

      // Send confirmation email (optional)
      // sendBookingConfirmationEmail(result.booking, language);

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
      const result = await bookingService.updateBooking(booking.id, {
        status: 'confirmed',
        payment_status: 'completed',
        payment_confirmed_at: new Date().toISOString(),
        payment_confirmed_by: currentUser.id,
      });

      if (!result.success) {
        toast({
          title: language === 'zh' ? '操作失敗' : 'Operation Failed',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      // Reload all bookings from Supabase
      const bookingsResult = await bookingService.getAllBookings();
      if (bookingsResult.success) {
        setBookings(bookingsResult.bookings);
      }

      toast({
        title: language === 'zh' ? '付款已確認' : 'Payment Confirmed',
        description: language === 'zh'
          ? '預約已確認，客戶將收到通知。'
          : 'Booking confirmed. Customer will be notified.',
      });

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

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : (language === 'zh' ? '訪客' : 'Guest');
  };

  const getStatusText = (status) => {
    return t.booking.status[status] || status;
  };
  
  const filterTitles = {
    all: language === 'zh' ? '所有預約' : 'All Bookings',
    confirmed: language === 'zh' ? '已確認預約' : 'Confirmed Bookings',
    pending: language === 'zh' ? '待確認預約' : 'Pending Bookings',
    cancelled: language === 'zh' ? '已取消預約' : 'Cancelled Bookings',
    modified: language === 'zh' ? '已修改預約' : 'Modified Bookings',
    paid: language === 'zh' ? '已付款預約' : 'Paid Bookings',
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-amber-800 mb-6">
        {filterTitles[filterStatus]}
      </h2>

      {!bookings || bookings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-amber-300 mx-auto mb-4" />
          <p className="text-amber-600 text-lg">
            {language === 'zh' ? '此類別暫無預約記錄' : 'No bookings in this category yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {normalizedBookings.map((booking) => (
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
                  <div className="flex items-center text-amber-600 mt-1">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="text-sm">
                      {language === 'zh' ? '預約於' : 'Booked on'} {new Date(booking.createdAt).toLocaleDateString('en-GB')}
                    </span>
                  </div>
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
                  {booking.status === 'to_be_confirmed' && !booking.receipt_url && (
                    <span className="text-sm text-yellow-600 italic">{language === 'zh' ? '等待收據上傳' : 'Awaiting receipt upload'}</span>
                  )}
                  {booking.status === 'pending' && !booking.receipt_url && (
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
                           <Button size="sm" variant="destructive" onClick={() => setBookingToCancel(booking.id)}>
                              <Trash2 className="w-4 h-4 mr-1" />
                              {language === 'zh' ? '取消' : 'Cancel'}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{language === 'zh' ? '確認取消' : 'Confirm Cancellation'}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {language === 'zh' ? '您確定要取消此預約嗎？如果使用代幣預約，代幣將會退還。此操作無法撤銷。' : 'Are you sure you want to cancel this booking? If tokens were used, they will be refunded. This action cannot be undone.'}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setBookingToCancel(null)}>{language === 'zh' ? '返回' : 'Back'}</AlertDialogCancel>
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
                <div className="flex items-center text-amber-700">
                  <Users className="w-4 h-4 mr-2" />
                  <div>
                    <div className="font-medium">{getUserName(booking.userId)}</div>
                    <div className="text-xs">{booking.name}</div>
                  </div>
                </div>
                <div className="flex items-center text-amber-700">
                  <Mail className="w-4 h-4 mr-2" />
                  <div>
                    <div>{booking.email}</div>
                    {booking.phone && <div className="flex items-center text-xs"><Phone className="w-3 h-3 mr-1" />{booking.phone}</div>}
                  </div>
                </div>
                <div className="flex items-center text-amber-700">
                  <Calendar className="w-4 h-4 mr-2" />
                  <div>{language === 'zh' ? '日期' : 'Date'}: {booking.date}</div>
                </div>
                <div className="flex items-center text-amber-700">
                  <Clock className="w-4 h-4 mr-2" />
                  <div>{booking.startTime} - {booking.endTime}</div>
                </div>
                <div className="flex items-center text-amber-700">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{booking.guests} {language === 'zh' ? '位客人' : 'guest(s)'}</span>
                </div>
              </div>
              {booking.purpose && (
                <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-700"><strong>{language === 'zh' ? '預約目的：' : 'Purpose: '}</strong>{booking.purpose}</p>
                </div>
              )}
              {booking.specialRequests && (
                <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-700"><strong>{language === 'zh' ? '特殊要求：' : 'Special Requests: '}</strong>{booking.specialRequests}</p>
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
    </div>
  );
};