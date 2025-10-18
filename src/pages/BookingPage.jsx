import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BookingModal } from '@/components/BookingModal';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { roomsData } from '@/data/roomsData';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { generateReceiptNumber } from '@/lib/utils';
import { bookingService, roomService } from '@/services';

export const BookingPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, updateUserTokens } = useAuth();
  const t = translations[language];
  
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingData, setBookingData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    startTime: '',
    endTime: '',
    guests: 1,
    purpose: [],
    otherPurpose: '',
    specialRequests: '',
    agreedToTerms: false,
    bookingType: 'token',
    rentalType: 'hourly',
    bookingMonth: '',
    wantsProjector: false
  });
  const { toast } = useToast();
  const [showTermsDialog, setShowTermsDialog] = useState(false);

  useEffect(() => {
    const room = roomsData.find(r => r.id === parseInt(roomId));
    if (!room) {
      navigate('/');
      return;
    }
    setSelectedRoom(room);

    const initialBookingType = room.bookingOptions.includes('token') ? 'token' : 'cash';
    let initialRentalType = 'hourly';
    if (room.id === 9) { // One Day Pass
      initialRentalType = 'daily';
    }

    setBookingData(prev => ({
      ...prev,
      bookingType: initialBookingType,
      rentalType: initialRentalType,
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || ''
    }));
  }, [roomId, navigate, user]);

  const checkTimeConflict = async (roomId, date, startTime, endTime) => {
    if(roomId === 9) return false;

    const startDateTime = new Date(`${date}T${startTime}:00`).toISOString();
    const endDateTime = new Date(`${date}T${endTime}:00`).toISOString();

    const result = await bookingService.checkAvailability(
      roomId,
      startDateTime,
      endDateTime
    );

    if (!result.success) {
      console.error('Error checking availability:', result.error);
      return false; // Assume available if check fails (will be caught by database constraint anyway)
    }

    return !result.available; // Return true if NOT available (conflict exists)
  };

  const calculateRequiredTokens = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    const start = parseInt(startTime.split(':')[0]);
    const end = parseInt(endTime.split(':')[0]);
    const baseTokens = Math.max(0, end - start);

    // Add projector fee if selected (Room C or Room E)
    const projectorFee = bookingData.wantsProjector && (selectedRoom?.id === 2 || selectedRoom?.id === 4) ? 20 : 0;

    return baseTokens + projectorFee;
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!bookingData.name || !bookingData.email || !bookingData.phone || !bookingData.date || !bookingData.startTime || !bookingData.endTime) {
      toast({ title: t.booking.missingInfo, description: t.booking.missingDesc, variant: "destructive" });
      return;
    }
    if (bookingData.startTime >= bookingData.endTime) {
      toast({ title: language === 'zh' ? '時間錯誤' : 'Time Error', description: language === 'zh' ? '結束時間必須晚於開始時間' : 'End time must be after start time', variant: "destructive" });
      return;
    }

    // Check time conflict (now async)
    const hasConflict = await checkTimeConflict(selectedRoom.id, bookingData.date, bookingData.startTime, bookingData.endTime);
    if (hasConflict) {
      toast({ title: t.booking.timeConflict, description: t.booking.timeConflictDesc, variant: "destructive" });
      return;
    }
    setShowTermsDialog(true);
  };

  const handleSubmitBooking = async () => {
    setShowTermsDialog(false);

    try {
      // Calculate cost based on booking type and rental type
      const hours = calculateRequiredTokens(bookingData.startTime, bookingData.endTime);
      let totalCost = 0;
      let requiredTokens = 0;

      if (bookingData.bookingType === 'token') {
        // Token booking: cost is in tokens
        requiredTokens = hours;
        totalCost = hours;

        // Check if user has enough tokens
        if (!user?.isAdmin && user.tokens < requiredTokens) {
          toast({
            title: t.booking.insufficientTokens,
            description: t.booking.insufficientTokensDesc
              .replace('{required}', requiredTokens)
              .replace('{available}', user.tokens),
            variant: "destructive"
          });
          return;
        }
      } else {
        // Cash booking: calculate price from room data
        if (selectedRoom.prices && selectedRoom.prices.cash) {
          if (bookingData.rentalType === 'hourly') {
            totalCost = selectedRoom.prices.cash.hourly * hours;
          } else if (bookingData.rentalType === 'daily') {
            totalCost = selectedRoom.prices.cash.daily;
          } else if (bookingData.rentalType === 'monthly') {
            totalCost = selectedRoom.prices.cash.monthly;
          }
        }

        // Add projector fee if selected (Room C or Room E)
        if (bookingData.wantsProjector && (selectedRoom.id === 2 || selectedRoom.id === 4)) {
          totalCost += 20;
        }
      }

      // Build start and end time ISO strings
      const startDateTime = new Date(`${bookingData.date}T${bookingData.startTime}:00`).toISOString();
      const endDateTime = new Date(`${bookingData.date}T${bookingData.endTime}:00`).toISOString();

      // Prepare purpose text
      let purposeText = Array.isArray(bookingData.purpose) ? bookingData.purpose.join(', ') : bookingData.purpose;
      if (Array.isArray(bookingData.purpose) && bookingData.purpose.includes('其他') && bookingData.otherPurpose) {
        purposeText = purposeText.replace('其他', `其他: ${bookingData.otherPurpose}`);
      }

      // Build notes field
      const notes = JSON.stringify({
        name: bookingData.name,
        email: bookingData.email,
        phone: bookingData.phone,
        guests: bookingData.guests,
        purpose: purposeText,
        specialRequests: bookingData.specialRequests,
        rentalType: bookingData.rentalType,
        wantsProjector: bookingData.wantsProjector,
        projectorFee: bookingData.wantsProjector && (selectedRoom.id === 2 || selectedRoom.id === 4) ? 20 : 0,
      });

      // Create booking in Supabase
      const result = await bookingService.createBooking({
        userId: user?.id,
        roomId: selectedRoom.id,
        startTime: startDateTime,
        endTime: endDateTime,
        bookingType: bookingData.rentalType, // 'hourly', 'daily', 'monthly'
        paymentMethod: bookingData.bookingType, // 'token' or 'cash'
        paymentStatus: bookingData.bookingType === 'cash' ? 'pending' : 'completed',
        totalCost: totalCost,
        status: 'pending', // All new bookings start as pending
        notes: notes,
      });

      if (!result.success) {
        // Show specific error message for booking conflicts
        const title = result.conflict
          ? (language === 'zh' ? '時段已被預訂' : 'Time Slot Unavailable')
          : (language === 'zh' ? '預約失敗' : 'Booking Failed');

        toast({
          title: title,
          description: result.error,
          variant: "destructive",
          duration: 5000
        });
        return;
      }

      // If token booking, deduct tokens
      if (bookingData.bookingType === 'token' && !user?.isAdmin) {
        await updateUserTokens(user.id, user.tokens - requiredTokens);
        toast({
          title: t.booking.tokensDeducted,
          description: t.booking.tokensDeductedDesc.replace('{count}', requiredTokens)
        });
      }

      // Show success message
      const roomName = t.rooms.roomNames[selectedRoom.name];
      if (bookingData.bookingType === 'cash') {
        toast({
          title: language === 'zh' ? '預約已提交' : 'Booking Submitted',
          description: language === 'zh'
            ? `您的${roomName}預約已提交。${t.booking.receipt.uploadReminder}`
            : `Your ${roomName} booking has been submitted. ${t.booking.receipt.uploadReminder}`,
          duration: 8000,
        });
      } else {
        toast({
          title: t.booking.confirmed,
          description: `${t.booking.confirmedDesc.replace('{roomName}', roomName)}`,
          duration: 5000,
        });
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: language === 'zh' ? '發生錯誤' : 'Error Occurred',
        description: language === 'zh' ? '無法建立預約，請稍後再試' : 'Could not create booking. Please try again later.',
        variant: "destructive"
      });
    }
  };

  if (!selectedRoom) {
    return null; // Or a loading spinner
  }

  return (
    <>
      <Helmet>
        <title>{`${t.bookingPage.title} - ${t.rooms.roomNames[selectedRoom.name]}`}</title>
        <meta name="description" content={`${t.bookingPage.description} ${t.rooms.roomNames[selectedRoom.name]}`} />
      </Helmet>
      <Header />
      <div className="container mx-auto p-4 min-h-screen">
        <Link 
          to="/#rooms" 
          className="inline-flex items-center text-amber-700 hover:text-amber-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {language === 'zh' ? '返回房間列表' : 'Back to Rooms'}
        </Link>
        <Card className="w-full max-w-4xl mx-auto glass-effect cat-shadow border-amber-200">
          <BookingModal
            isOpen={true}
            onClose={() => navigate('/#rooms')}
            selectedRoom={selectedRoom}
            bookingData={bookingData}
            setBookingData={setBookingData}
            onSubmit={handleConfirmBooking}
          />
        </Card>
      </div>
      <Footer />
      
      <AlertDialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.booking.termsTitle}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="max-h-[60vh] overflow-y-auto text-sm whitespace-pre-wrap">
                {t.booking.terms}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'zh' ? '取消' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitBooking}>{language === 'zh' ? '同意並提交' : 'Agree & Submit'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};