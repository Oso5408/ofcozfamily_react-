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
    bookingMonth: ''
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

  const checkTimeConflict = (roomId, date, startTime, endTime) => {
    if(roomId === 9) return false;
    const allBookings = JSON.parse(localStorage.getItem('ofcoz_bookings') || '[]');
    let roomBookings = allBookings.filter(booking => 
      booking.room.id === roomId && 
      booking.date === date && 
      booking.status === 'confirmed'
    );

    const newStart = new Date(`${date}T${startTime}:00`);
    const newEnd = new Date(`${date}T${endTime}:00`);

    if (roomId === 1) { // Room B
        const roomCBookings = allBookings.filter(b => b.room.id === 2 && b.date === date && b.status === 'confirmed');
        roomBookings = [...roomBookings, ...roomCBookings];
    } else if (roomId === 2) { // Room C
        const roomBBookings = allBookings.filter(b => b.room.id === 1 && b.date === date && b.status === 'confirmed');
        roomBookings = [...roomBookings, ...roomBBookings];
    }

    return roomBookings.some(booking => {
      const existingStart = new Date(`${booking.date}T${booking.startTime}:00`);
      const existingEnd = new Date(`${booking.date}T${booking.endTime}:00`);
      return (newStart < existingEnd && newEnd > existingStart);
    });
  };

  const calculateRequiredTokens = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    const start = parseInt(startTime.split(':')[0]);
    const end = parseInt(endTime.split(':')[0]);
    return Math.max(0, end - start);
  };

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    if (!bookingData.name || !bookingData.email || !bookingData.phone || !bookingData.date || !bookingData.startTime || !bookingData.endTime) {
      toast({ title: t.booking.missingInfo, description: t.booking.missingDesc, variant: "destructive" });
      return;
    }
    if (bookingData.startTime >= bookingData.endTime) {
      toast({ title: language === 'zh' ? '時間錯誤' : 'Time Error', description: language === 'zh' ? '結束時間必須晚於開始時間' : 'End time must be after start time', variant: "destructive" });
      return;
    }
    if (checkTimeConflict(selectedRoom.id, bookingData.date, bookingData.startTime, bookingData.endTime)) {
      toast({ title: t.booking.timeConflict, description: t.booking.timeConflictDesc, variant: "destructive" });
      return;
    }
    setShowTermsDialog(true);
  };

  const handleSubmitBooking = () => {
    setShowTermsDialog(false);
    
    let requiredTokens = 0;
    if (bookingData.bookingType === 'token' && !user?.isAdmin) {
      requiredTokens = calculateRequiredTokens(bookingData.startTime, bookingData.endTime);
      if (user.tokens < requiredTokens) {
        toast({ title: t.booking.insufficientTokens, description: t.booking.insufficientTokensDesc.replace('{required}', requiredTokens).replace('{available}', user.tokens), variant: "destructive" });
        return;
      }
      updateUserTokens(user.id, user.tokens - requiredTokens);
      toast({ title: t.booking.tokensDeducted, description: t.booking.tokensDeductedDesc.replace('{count}', requiredTokens) });
    }

    let purposeText = Array.isArray(bookingData.purpose) ? bookingData.purpose.join(', ') : bookingData.purpose;
    if (Array.isArray(bookingData.purpose) && bookingData.purpose.includes('其他') && bookingData.otherPurpose) {
        purposeText = purposeText.replace('其他', `其他: ${bookingData.otherPurpose}`);
    }

    const booking = {
      id: Date.now().toString(),
      userId: user?.id || null,
      room: selectedRoom,
      ...bookingData,
      purpose: purposeText,
      tokensUsed: requiredTokens,
      status: 'pending',
      createdAt: new Date().toISOString(),
      receiptNumber: generateReceiptNumber()
    };

    const existingBookings = JSON.parse(localStorage.getItem('ofcoz_bookings') || '[]');
    existingBookings.push(booking);
    localStorage.setItem('ofcoz_bookings', JSON.stringify(existingBookings));

    const roomName = t.rooms.roomNames[selectedRoom.name];
    toast({
      title: t.booking.confirmed,
      description: `${t.booking.confirmedDesc.replace('{roomName}', roomName)} ${t.booking.confirmedEmailDesc}`
    });
    
    navigate('/dashboard');
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