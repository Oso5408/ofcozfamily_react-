import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, MapPin, Users, Clock, X, Edit, Hash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BookingModal } from '@/components/BookingModal';

export const BookingsTab = ({ bookings = [], setBookings, onUpdateBooking }) => {
  const { language } = useLanguage();
  const { user, updateUserTokens } = useAuth();
  const t = translations[language];
  const { toast } = useToast();
  const [editingBooking, setEditingBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const handleCancelBooking = (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const bookingDateTime = new Date(`${booking.date}T${booking.startTime}:00`);
    const now = new Date();
    const timeDiff = bookingDateTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    
    const allBookings = JSON.parse(localStorage.getItem('ofcoz_bookings') || '[]');
    const userBookingsThisMonth = allBookings.filter(b => b.userId === user.id && b.status === 'cancelled' && new Date(b.createdAt).getMonth() === new Date().getMonth());
    const cancellationWaiversUsed = userBookingsThisMonth.filter(b => b.waiverUsed).length;

    let refundTokens = true;
    let waiverUsed = false;

    if (hoursDiff < 48) {
      if(cancellationWaiversUsed < 1 && booking.bookingType === 'token') {
          waiverUsed = true;
          toast({
              title: t.booking.cancellationWaiverUsed,
          });
      } else {
          refundTokens = false;
      }
    }
    
    if(booking.bookingType === 'cash') {
        toast({
            title: language === 'zh' ? '現金預約取消' : 'Cash Booking Cancellation',
            description: language === 'zh' ? '時租及日租付款後取消，不獲退款，請於取消日起計90日有效期內重新預約。' : 'Hourly and daily rentals are non-refundable after cancellation. Please rebook within 90 days from the cancellation date.'
        });
        refundTokens = false;
    }

    const updatedBookings = allBookings.map(b => 
      b.id === bookingId ? { ...b, status: 'cancelled', waiverUsed: waiverUsed } : b
    );
    localStorage.setItem('ofcoz_bookings', JSON.stringify(updatedBookings));
    
    setBookings(prev => prev.map(b => 
      b.id === bookingId ? { ...b, status: 'cancelled' } : b
    ));

    if (booking.userId && booking.tokensUsed > 0 && refundTokens) {
      const allUsers = JSON.parse(localStorage.getItem('ofcoz_users') || '[]');
      const userToRefund = allUsers.find(u => u.id === booking.userId);
      if (userToRefund) {
          const newTokens = (userToRefund.tokens || 0) + booking.tokensUsed;
          updateUserTokens(booking.userId, newTokens, false);
          toast({
              title: t.booking.tokensRefunded,
              description: t.booking.tokensRefundedDesc.replace('{count}', booking.tokensUsed)
          });
      }
    }

    toast({
      title: t.booking.cancelSuccess,
      description: t.booking.cancelSuccessDesc
    });
  };

  const handleEditClick = (booking) => {
    setEditingBooking({
        ...booking,
        purpose: booking.purpose ? booking.purpose.split(', ') : [], // convert back to array
    });
    setShowBookingModal(true);
  }

  const handleSaveEdit = (e) => {
    e.preventDefault();
    onUpdateBooking(editingBooking);
    setShowBookingModal(false);
    setEditingBooking(null);
  };
  
  const canModify = (booking) => {
      const now = new Date();
      const bookingStart = new Date(`${booking.date}T${booking.startTime}:00`);
      const hoursDiff = (bookingStart.getTime() - now.getTime()) / (1000 * 3600);
      return hoursDiff >= 24;
  };

  const getStatusText = (status) => {
    return t.booking.status[status] || status;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-amber-800 mb-6">
        {t.dashboard.myBookings}
      </h2>

      {!bookings || bookings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-amber-300 mx-auto mb-4" />
          <p className="text-amber-600 text-lg mb-4">
            {t.dashboard.noBookings}
          </p>
          <Link to="/rooms">
            <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
              {t.dashboard.bookNow}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-amber-200 rounded-lg p-6 bg-white/50"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-amber-800">
                    {t.rooms.roomNames[booking.room.name]}
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
                      {language === 'zh' ? '預約於' : 'Booked on'} {new Date(booking.createdAt).toLocaleDateString()}
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
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    booking.status === 'modified' ? 'bg-purple-100 text-purple-800' :
                    booking.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {getStatusText(booking.status)}
                  </span>
                  {booking.status === 'confirmed' && canModify(booking) && (
                    <>
                      <Button
                        onClick={() => handleEditClick(booking)}
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        {t.dashboard.editBooking}
                      </Button>
                      <Button
                        onClick={() => handleCancelBooking(booking.id)}
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        {t.dashboard.cancelBooking}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center text-amber-700">
                  <Calendar className="w-4 h-4 mr-2" />
                  <div>
                    <div>{language === 'zh' ? '日期' : 'Date'}: {booking.date}</div>
                  </div>
                </div>
                
                <div className="flex items-center text-amber-700">
                  <Clock className="w-4 h-4 mr-2" />
                  <div>
                    <div>{booking.startTime} - {booking.endTime}</div>
                  </div>
                </div>
                
                <div className="flex items-center text-amber-700">
                  <Users className="w-4 h-4 mr-2" />
                  <span>
                    {booking.guests} {language === 'zh' ? '位客人' : 'guest(s)'}
                  </span>
                </div>

                <div className="flex items-center text-amber-700">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{language === 'zh' ? '九龍長沙灣' : 'Cheung Sha Wan, Kowloon'}</span>
                </div>
              </div>

              {booking.purpose && (
                <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-700">
                    <strong>{language === 'zh' ? '業務性質：' : 'Business Nature: '}</strong>
                    {booking.purpose}
                  </p>
                </div>
              )}

              {booking.specialRequests && (
                <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-700">
                    <strong>{language === 'zh' ? '特殊要求：' : 'Special Requests: '}</strong>
                    {booking.specialRequests}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
      {showBookingModal && editingBooking && (
          <BookingModal
            isOpen={showBookingModal}
            onClose={() => setShowBookingModal(false)}
            selectedRoom={editingBooking?.room}
            bookingData={editingBooking}
            setBookingData={setEditingBooking}
            onSubmit={handleSaveEdit}
            isEditing={true}
          />
      )}
    </div>
  );
};