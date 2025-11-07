import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from "react-helmet-async";
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
import { bookingService, roomService, storageService, emailService } from '@/services';

export const BookingPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, updateUserTokens, deductBRBalance, deductDP20Balance } = useAuth();
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
    // Check if user is logged in - redirect to login if not
    if (!user) {
      toast({
        title: language === 'zh' ? '需要登入' : 'Login Required',
        description: language === 'zh' ? '請先登入以進行預約' : 'Please sign in to make a booking',
        variant: 'default',
      });
      navigate('/login', { state: { returnUrl: `/booking/${roomId}` } });
      return;
    }

    const room = roomsData.find(r => r.id === parseInt(roomId));
    if (!room) {
      navigate('/');
      return;
    }
    setSelectedRoom(room);

    // Set initial booking type based on available options
    let initialBookingType = 'cash'; // Default to cash
    if (room.bookingOptions.includes('token')) {
      initialBookingType = 'token';
    } else if (room.bookingOptions.includes('cash')) {
      initialBookingType = 'cash';
    } else if (room.bookingOptions.includes('dp20')) {
      initialBookingType = 'dp20';
    }

    let initialRentalType = 'hourly';
    if (room.id === 9) { // Day Pass - always daily (but user selects time)
      initialRentalType = 'daily';
    }

    setBookingData(prev => ({
      ...prev,
      bookingType: initialBookingType,
      rentalType: initialRentalType,
      guests: room.id === 9 ? 1 : prev.guests || 1,
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      // Auto-set fixed times for Day Pass (10:00 AM - 6:30 PM)
      startTime: room.id === 9 ? '10:00' : prev.startTime || '',
      endTime: room.id === 9 ? '18:30' : prev.endTime || ''
    }));
  }, [roomId, navigate, user, language, toast]);

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

    // Debug logging
    console.log('=== BOOKING VALIDATION DEBUG ===');
    console.log('📋 Current booking data:', bookingData);
    console.log('✅ Name:', bookingData.name, '| Has value:', !!bookingData.name);
    console.log('✅ Email:', bookingData.email, '| Has value:', !!bookingData.email);
    console.log('✅ Phone:', bookingData.phone, '| Has value:', !!bookingData.phone);
    console.log('✅ Date:', bookingData.date, '| Has value:', !!bookingData.date);
    console.log('✅ Start Time:', bookingData.startTime, '| Has value:', !!bookingData.startTime);
    console.log('✅ End Time:', bookingData.endTime, '| Has value:', !!bookingData.endTime);
    console.log('✅ Purpose:', bookingData.purpose, '| Has value:', !!bookingData.purpose);
    console.log('✅ Special Requests:', bookingData.specialRequests, '| Has value:', !!bookingData.specialRequests);
    console.log('✅ Agreed to Terms:', bookingData.agreedToTerms);
    console.log('🏠 Selected Room:', selectedRoom?.name, '| ID:', selectedRoom?.id);
    console.log('================================');

    // Basic validation
    if (!bookingData.name || !bookingData.email || !bookingData.phone || !bookingData.date) {
      console.error('❌ VALIDATION FAILED: Missing required fields');
      toast({ title: t.booking.missingInfo, description: t.booking.missingDesc, variant: "destructive" });
      return;
    }

    // Time validation (Day Pass has fixed times auto-set, so times should always be present)
    if (!bookingData.startTime || !bookingData.endTime) {
      console.error('❌ VALIDATION FAILED: Missing time selection');
      toast({ title: t.booking.missingInfo, description: t.booking.missingDesc, variant: "destructive" });
      return;
    }

    if (bookingData.startTime >= bookingData.endTime) {
      console.error('❌ VALIDATION FAILED: End time must be after start time');
      toast({ title: language === 'zh' ? '時間錯誤' : 'Time Error', description: language === 'zh' ? '結束時間必須晚於開始時間' : 'End time must be after start time', variant: "destructive" });
      return;
    }

    console.log('✅ All validations passed, proceeding with booking...');

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

        // Check if user has enough tokens (ONLY if not using BR package)
        // If using BR package, the balance check happens in deductBRBalance()
        if (!user?.isAdmin && !bookingData.selectedBRPackage && user.tokens < requiredTokens) {
          console.log('⚠️ Insufficient regular tokens:', { required: requiredTokens, available: user.tokens });
          toast({
            title: t.booking.insufficientTokens,
            description: t.booking.insufficientTokensDesc
              .replace('{required}', requiredTokens)
              .replace('{available}', user.tokens),
            variant: "destructive"
          });
          return;
        }

        // If using BR package, check BR balance instead
        if (!user?.isAdmin && bookingData.selectedBRPackage) {
          const brBalance = bookingData.selectedBRPackage === 'BR15'
            ? (user?.br15_balance || 0)
            : (user?.br30_balance || 0);

          console.log('💰 Checking BR balance:', {
            package: bookingData.selectedBRPackage,
            balance: brBalance,
            required: requiredTokens
          });

          if (brBalance < requiredTokens) {
            const packageName = bookingData.selectedBRPackage === 'BR15'
              ? (language === 'zh' ? 'BR15套票' : 'BR15 Package')
              : (language === 'zh' ? 'BR30套票' : 'BR30 Package');

            toast({
              title: language === 'zh' ? 'BR 餘額不足' : 'Insufficient BR Balance',
              description: language === 'zh'
                ? `您的${packageName}餘額不足。此預約需要 ${requiredTokens} BR，但您只有 ${brBalance} BR。`
                : `Your ${packageName} balance is insufficient. This booking requires ${requiredTokens} BR, but you only have ${brBalance} BR.`,
              variant: 'destructive',
              duration: 8000
            });
            return;
          }
        }
      } else if (bookingData.bookingType === 'dp20') {
        // DP20 booking: set cash equivalent cost for reference
        if (selectedRoom.prices && selectedRoom.prices.cash && selectedRoom.prices.cash.daily) {
          totalCost = selectedRoom.prices.cash.daily;

          // For Lobby Seat (room 9), multiply by number of guests ($100 per person)
          if (selectedRoom.id === 9) {
            totalCost = totalCost * (bookingData.guests || 1);
          }
        }
      } else {
        // Cash booking: calculate price from room data
        if (selectedRoom.prices && selectedRoom.prices.cash) {
          if (bookingData.rentalType === 'hourly') {
            totalCost = selectedRoom.prices.cash.hourly * hours;
          } else if (bookingData.rentalType === 'daily') {
            totalCost = selectedRoom.prices.cash.daily;

            // For Lobby Seat (room 9), multiply by number of guests ($100 per person)
            if (selectedRoom.id === 9) {
              totalCost = totalCost * (bookingData.guests || 1);
            }
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

      // If token booking, deduct tokens or BR balance
      if (bookingData.bookingType === 'token' && !user?.isAdmin) {
        console.log('💳 Processing payment:', {
          selectedBRPackage: bookingData.selectedBRPackage,
          requiredTokens
        });

        if (bookingData.selectedBRPackage) {
          // Deduct from BR balance
          console.log('🎫 Deducting from BR package:', bookingData.selectedBRPackage);
          const brResult = await deductBRBalance(user.id, requiredTokens, bookingData.selectedBRPackage);

          if (!brResult.success) {
            console.error('❌ BR deduction failed:', brResult.error);
            const currentBalance = bookingData.selectedBRPackage === 'BR15'
              ? (user?.br15_balance || 0)
              : (user?.br30_balance || 0);
            const packageName = bookingData.selectedBRPackage === 'BR15'
              ? (language === 'zh' ? 'BR15套票' : 'BR15 Package')
              : (language === 'zh' ? 'BR30套票' : 'BR30 Package');

            toast({
              title: language === 'zh' ? 'BR 餘額不足' : 'Insufficient BR Balance',
              description: language === 'zh'
                ? `您的${packageName}餘額不足。此預約需要 ${requiredTokens} BR，但您只有 ${currentBalance} BR。`
                : `Your ${packageName} balance is insufficient. This booking requires ${requiredTokens} BR, but you only have ${currentBalance} BR.`,
              variant: 'destructive',
              duration: 8000
            });
            // Delete the booking since payment failed
            await bookingService.deleteBooking(result.booking.id);
            return;
          }

          console.log('✅ BR balance deducted successfully');
          toast({
            title: language === 'zh' ? 'BR 已扣除' : 'BR Deducted',
            description: language === 'zh'
              ? `已從 ${bookingData.selectedBRPackage} 扣除 ${requiredTokens} BR`
              : `${requiredTokens} BR deducted from ${bookingData.selectedBRPackage}`
          });
        } else {
          // Deduct from regular tokens
          console.log('🪙 Deducting from regular tokens');
          await updateUserTokens(user.id, user.tokens - requiredTokens);
          toast({
            title: t.booking.tokensDeducted,
            description: t.booking.tokensDeductedDesc.replace('{count}', requiredTokens)
          });
        }
      }

      // Handle DP20 payment
      if (bookingData.bookingType === 'dp20' && !user?.isAdmin) {
        console.log('🎫 Processing DP20 payment');

        const dp20Result = await deductDP20Balance(user.id);

        if (!dp20Result.success) {
          console.error('❌ DP20 deduction failed:', dp20Result.error);

          toast({
            title: language === 'zh' ? 'DP20 餘額不足或已過期' : 'Insufficient DP20 Balance or Expired',
            description: language === 'zh'
              ? `無法使用 DP20 套票。${dp20Result.error}`
              : `Cannot use DP20 package. ${dp20Result.error}`,
            variant: 'destructive',
            duration: 8000
          });

          // Delete the booking since payment failed
          await bookingService.deleteBooking(result.booking.id);
          return;
        }

        console.log('✅ DP20 visit deducted successfully');
        toast({
          title: language === 'zh' ? 'DP20 已扣除' : 'DP20 Deducted',
          description: language === 'zh'
            ? `已從 DP20 套票扣除 1 次使用。剩餘 ${dp20Result.profile?.dp20_balance || 0} 次。`
            : `1 visit deducted from DP20 package. ${dp20Result.profile?.dp20_balance || 0} visits remaining.`
        });
      }

      // Upload receipt if provided (for cash bookings)
      if (bookingData.bookingType === 'cash' && bookingData.receiptImage) {
        console.log('📤 Uploading receipt for booking:', result.booking.id);

        // Upload receipt to Supabase Storage
        const uploadResult = await storageService.uploadReceipt(result.booking.id, bookingData.receiptImage);

        if (uploadResult.success) {
          console.log('✅ Receipt uploaded successfully:', uploadResult.url);

          // Update booking with receipt URL and change status to to_be_confirmed
          const updateResult = await bookingService.uploadReceiptForBooking(
            result.booking.id,
            uploadResult.url
          );

          if (updateResult.success) {
            console.log('✅ Booking updated with receipt URL and status changed to to_be_confirmed');

            // Send receipt received email
            console.log('📧 Sending receipt received email...');
            try {
              const emailResult = await emailService.sendReceiptReceivedEmail(
                updateResult.booking,
                language
              );

              if (emailResult.success) {
                console.log('✅ Receipt received email sent successfully');
              } else {
                console.error('❌ Failed to send receipt received email:', emailResult.error);
              }
            } catch (emailError) {
              console.error('❌ Email service error:', emailError);
            }
          } else {
            console.error('❌ Failed to update booking with receipt:', updateResult.error);
          }
        } else {
          console.error('❌ Receipt upload failed:', uploadResult.error);
        }
      }

      // Show success message
      const roomName = t.rooms.roomNames[selectedRoom.name];
      if (bookingData.bookingType === 'cash') {
        const hasReceipt = bookingData.receiptImage;
        toast({
          title: language === 'zh' ? '預約已提交' : 'Booking Submitted',
          description: hasReceipt
            ? (language === 'zh'
              ? `您的${roomName}預約已提交，收據已上傳。我們將在24小時內審核。`
              : `Your ${roomName} booking has been submitted with receipt. We'll review within 24 hours.`)
            : (language === 'zh'
              ? `您的${roomName}預約已提交。${t.booking.receipt.uploadReminder}`
              : `Your ${roomName} booking has been submitted. ${t.booking.receipt.uploadReminder}`),
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