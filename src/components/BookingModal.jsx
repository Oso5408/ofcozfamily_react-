
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { translations } from '@/data/translations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from '@/components/ui/card';
import { generateTimeOptions, generateEndTimeOptions, checkDailySlotConflict } from '@/lib/timeUtils';
import { MultiStepBookingForm } from '@/components/MultiStepBookingForm';
import { availableDatesService } from '@/services/availableDatesService';

export const BookingModal = ({
  isOpen,
  onClose,
  selectedRoom,
  bookingData,
  setBookingData,
  onSubmit,
}) => {
  const { language } = useLanguage();
  const { user, refreshProfile } = useAuth();
  const t = translations[language];

  // DEBUG: Log user object when modal opens
  useEffect(() => {
    if (isOpen && user) {
      console.log('=== BOOKING MODAL DEBUG ===');
      console.log('👤 User object:', user);
      console.log('💰 BR15 Balance:', user.br15_balance);
      console.log('💰 BR30 Balance:', user.br30_balance);
      console.log('🎫 DP20 Balance:', user.dp20_balance);
      console.log('📅 DP20 Expiry:', user.dp20_expiry);
      console.log('🪙 Token Balance:', user.tokens);
      console.log('👑 Is Admin:', user.isAdmin);
      console.log('📦 Selected BR Package:', bookingData.selectedBRPackage);
      console.log('🏠 Selected Room:', selectedRoom?.name);
      console.log('💳 Booking Options:', selectedRoom?.bookingOptions);
      console.log('========================');
    }
  }, [isOpen, user, bookingData.selectedBRPackage, selectedRoom]);

  const [showOtherPurposeInput, setShowOtherPurposeInput] = useState(false);
  const [timeOptions, setTimeOptions] = useState([]);
  const [endTimeOptions, setEndTimeOptions] = useState([]);
  const [availableDailySlots, setAvailableDailySlots] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [loadingEndTimes, setLoadingEndTimes] = useState(false);
  const [purposeError, setPurposeError] = useState(false);
  const [useAccountInfo, setUseAccountInfo] = useState(false);
  const [availableDateStrings, setAvailableDateStrings] = useState([]);
  const hasRefreshedProfile = useRef(false);

  // Load available dates when modal opens
  useEffect(() => {
    const loadAvailableDates = async () => {
      if (!isOpen || !selectedRoom) return;

      // Pass room ID to get room-specific available dates
      const result = await availableDatesService.getAvailableDateStrings(selectedRoom.id);
      if (result.success) {
        setAvailableDateStrings(result.dateStrings);
      }
    };

    loadAvailableDates();
  }, [isOpen, selectedRoom]);

  // Use Day Pass purposes for room 9, regular purposes for other rooms
  const isDayPass = selectedRoom?.id === 9;
  const businessPurposes = isDayPass
    ? ["自修", "工作", "其他"]
    : ["教學", "心理及催眠", "會議", "工作坊", "溫習", "動物傳心", "古法術枚", "直傳靈氣", "其他"];

  const dailyTimeSlots = [
    { value: "10:00-20:00", label: "10:00 - 20:00" },
    { value: "11:00-21:00", label: "11:00 - 21:00" },
    { value: "12:00-22:00", label: "12:00 - 22:00" },
  ];

  // Handle auto-fill when checkbox changes
  useEffect(() => {
    if (useAccountInfo && user) {
      setBookingData(prev => ({
        ...prev,
        name: user.name || user.full_name || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
    } else if (!useAccountInfo && isOpen) {
      // When unchecked, only clear if modal is open (to avoid clearing on close)
      setBookingData(prev => ({
        ...prev,
        name: '',
        email: '',
        phone: ''
      }));
    }
  }, [useAccountInfo, user, isOpen, setBookingData]);

  // Refresh profile when modal opens to get latest BR balance (only once per open)
  useEffect(() => {
    if (isOpen) {
      // Reset the flag when modal opens
      hasRefreshedProfile.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && user && !user.isAdmin && refreshProfile && !hasRefreshedProfile.current) {
      console.log('🔄 Refreshing profile to get latest BR balance...');
      hasRefreshedProfile.current = true;
      refreshProfile().then(result => {
        if (result.success) {
          console.log('✅ Profile refreshed successfully:', result.profile);
        } else {
          console.error('❌ Failed to refresh profile:', result.error);
        }
      });
    }
  }, [isOpen, user?.id, refreshProfile]);

  // Auto-select BR package with sufficient balance
  useEffect(() => {
    if (!user || user.isAdmin || bookingData.bookingType !== 'token') return;

    const requiredTokens = calculateRequiredTokens();
    if (requiredTokens === 0) return;

    // Only auto-select if no package is currently selected
    if (!bookingData.selectedBRPackage) {
      const br15Available = user.br15_balance || 0;
      const br30Available = user.br30_balance || 0;

      // Auto-select the first package with sufficient balance
      if (br15Available >= requiredTokens) {
        setBookingData(prev => ({ ...prev, selectedBRPackage: 'BR15' }));
      } else if (br30Available >= requiredTokens) {
        setBookingData(prev => ({ ...prev, selectedBRPackage: 'BR30' }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.br15_balance, user?.br30_balance, user?.isAdmin, bookingData.bookingType, bookingData.startTime, bookingData.endTime, bookingData.selectedBRPackage, bookingData.wantsProjector, selectedRoom?.id]);

  useEffect(() => {
    if (Array.isArray(bookingData.purpose)) {
      setShowOtherPurposeInput(bookingData.purpose.includes("其他"));
    }
  }, [bookingData.purpose]);

  // Fetch available time slots when date or room changes
  useEffect(() => {
    const fetchTimeOptions = async () => {
      if (!bookingData.date || !selectedRoom?.id) {
        setTimeOptions([]);
        setAvailableDailySlots([]);
        return;
      }

      setLoadingTimes(true);
      try {
        // Fetch hourly time options
        const options = await generateTimeOptions(bookingData.date, selectedRoom.id);
        setTimeOptions(options);

        // Check daily slots availability
        const availableSlots = [];
        for (const slot of dailyTimeSlots) {
          const hasConflict = await checkDailySlotConflict(selectedRoom.id, bookingData.date, slot.value);
          if (!hasConflict) {
            availableSlots.push(slot);
          }
        }
        setAvailableDailySlots(availableSlots);
      } catch (error) {
        console.error('Error fetching time options:', error);
      } finally {
        setLoadingTimes(false);
      }
    };

    fetchTimeOptions();
  }, [bookingData.date, selectedRoom?.id]);

  // Fetch available end time options when start time, date, or room changes
  useEffect(() => {
    const fetchEndTimeOptions = async () => {
      if (!bookingData.date || !selectedRoom?.id || !bookingData.startTime) {
        setEndTimeOptions([]);
        return;
      }

      setLoadingEndTimes(true);
      try {
        const options = await generateEndTimeOptions(
          bookingData.date,
          selectedRoom.id,
          bookingData.startTime
        );
        setEndTimeOptions(options);
      } catch (error) {
        console.error('Error fetching end time options:', error);
      } finally {
        setLoadingEndTimes(false);
      }
    };

    fetchEndTimeOptions();
  }, [bookingData.date, bookingData.startTime, selectedRoom?.id]);

  const handlePurposeChange = (purpose, checked) => {
    const currentPurposes = Array.isArray(bookingData.purpose) ? bookingData.purpose : [];
    let newPurposes;

    if (checked) {
      newPurposes = [...currentPurposes, purpose];
    } else {
      newPurposes = currentPurposes.filter(p => p !== purpose);
      if (purpose === "其他") {
         setBookingData(prev => ({...prev, otherPurpose: ''}));
      }
    }

    setBookingData({ ...bookingData, purpose: newPurposes });
    setPurposeError(false); // Clear error when user selects a purpose
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    // Validate that at least one purpose is selected
    if (!Array.isArray(bookingData.purpose) || bookingData.purpose.length === 0) {
      setPurposeError(true);
      // Scroll to purpose field
      document.getElementById('purpose-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // If validation passes, call the original onSubmit
    onSubmit(e);
  };

  const calculateRequiredTokens = () => {
    if (bookingData.bookingType !== 'token' || !bookingData.startTime || !bookingData.endTime) return 0;

    // Parse start time
    const [startHourStr, startMinuteStr] = bookingData.startTime.split(':');
    const startHour = parseInt(startHourStr);
    const startMinute = parseInt(startMinuteStr || '0');

    // Parse end time
    const [endHourStr, endMinuteStr] = bookingData.endTime.split(':');
    const endHour = parseInt(endHourStr);
    const endMinute = parseInt(endMinuteStr || '0');

    // Calculate duration in hours (support half hours)
    const durationHours = (endHour + endMinute / 60) - (startHour + startMinute / 60);
    const baseTokens = Math.max(0, durationHours);

    // Add projector fee if selected (Room C or Room E)
    const projectorFee = bookingData.wantsProjector && (selectedRoom?.id === 2 || selectedRoom?.id === 4) ? 20 : 0;

    return baseTokens + projectorFee;
  };

  const calculatePrice = () => {
    // For DP20 bookings, show the cash equivalent price for reference
    if (!selectedRoom?.prices?.cash) return 0;
    if (bookingData.bookingType === 'dp20' && !selectedRoom?.prices?.cash) return 0;

    let basePrice = 0;

    if (bookingData.rentalType === 'daily' && selectedRoom.prices.cash.daily) {
      basePrice = selectedRoom.prices.cash.daily;

      // For Lobby Seat (room 9), multiply by number of guests ($100 per person)
      if (selectedRoom.id === 9) {
        basePrice = basePrice * (bookingData.guests || 1);
      }
    } else if (bookingData.rentalType === 'hourly' && bookingData.startTime && bookingData.endTime && selectedRoom.prices.cash.hourly) {
      // Parse start time
      const [startHourStr, startMinuteStr] = bookingData.startTime.split(':');
      const startHour = parseInt(startHourStr);
      const startMinute = parseInt(startMinuteStr || '0');

      // Parse end time
      const [endHourStr, endMinuteStr] = bookingData.endTime.split(':');
      const endHour = parseInt(endHourStr);
      const endMinute = parseInt(endMinuteStr || '0');

      // Calculate duration in hours (support half hours)
      const durationHours = (endHour + endMinute / 60) - (startHour + startMinute / 60);
      const hours = Math.max(0, durationHours);

      basePrice = hours * selectedRoom.prices.cash.hourly;
    } else if (bookingData.rentalType === 'monthly' && selectedRoom.prices.cash.monthly) {
      basePrice = selectedRoom.prices.cash.monthly;
    }

    // Add projector fee if selected (Room C or Room E)
    const projectorFee = bookingData.wantsProjector && (selectedRoom?.id === 2 || selectedRoom?.id === 4) ? 20 : 0;

    return basePrice + projectorFee;
  }

  const requiredTokens = calculateRequiredTokens();
  const userTokens = user?.tokens || 0;

  // Check BR balance based on selected package
  const getBRBalance = () => {
    if (!bookingData.selectedBRPackage) return 0;
    return bookingData.selectedBRPackage === 'BR15'
      ? (user?.br15_balance || 0)
      : (user?.br30_balance || 0);
  };

  const hasEnoughTokens = user?.isAdmin || (bookingData.selectedBRPackage ? getBRBalance() >= requiredTokens : userTokens >= requiredTokens);
  const totalPrice = calculatePrice();
  
  const handleMonthlyInquiry = (e) => {
    e.preventDefault();
    const message = language === 'zh' 
      ? `你好，我想查詢月租服務。\n姓名：${bookingData.name}\n電郵：${bookingData.email}\n電話：${bookingData.phone}`
      : `Hi, I'd like to inquire about monthly rental.\nName: ${bookingData.name}\nEmail: ${bookingData.email}\nPhone: ${bookingData.phone}`;
    const whatsappUrl = `https://web.whatsapp.com/send/?phone=85266238788&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
    window.open(whatsappUrl, '_blank');
  };
  
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
        onInteractOutside={(e) => {
          // Prevent closing when clicking on Select dropdown or any Radix portaled content
          const target = e.target;
          if (
            target.closest('[role="listbox"]') ||
            target.closest('[data-radix-popper-content-wrapper]') ||
            target.closest('[data-radix-select-content]') ||
            target.closest('[data-radix-portal]')
          ) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-amber-800">
            {t.booking.combinedTitle}
          </DialogTitle>
          {selectedRoom && (
            <DialogDescription asChild>
              <div className="pt-4">
                <div className="p-4 bg-amber-50 rounded-lg">
                  <h4 className="font-semibold text-amber-800">
                    {t.rooms.roomNames[selectedRoom.name]}
                  </h4>
                  <p className="text-amber-600">
                    {t.booking.upTo} {selectedRoom.capacity} {t.rooms.guests}
                  </p>
                </div>
              </div>
            </DialogDescription>
          )}
        </DialogHeader>

        {bookingData.bookingType === 'cash' || bookingData.bookingType === 'dp20' ? (
          <MultiStepBookingForm
            selectedRoom={selectedRoom}
            bookingData={bookingData}
            setBookingData={setBookingData}
            onSubmit={onSubmit}
            onClose={onClose}
            businessPurposes={businessPurposes}
            handlePurposeChange={handlePurposeChange}
            showOtherPurposeInput={showOtherPurposeInput}
            purposeError={purposeError}
            totalPrice={totalPrice}
            user={user}
          />
        ) : (
          <form onSubmit={handleFormSubmit}>
          <div className="space-y-4 py-4">
            {/* Auto-fill checkbox - only show if user is logged in */}
            {user && (
              <div className="flex items-center space-x-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <Checkbox
                  id="use-account-info"
                  checked={useAccountInfo}
                  onCheckedChange={(checked) => setUseAccountInfo(checked)}
                />
                <Label htmlFor="use-account-info" className="text-sm font-medium text-amber-800 cursor-pointer">
                  {t.booking.useAccountInfo}
                </Label>
              </div>
            )}

            <div><Label htmlFor="name" className="text-amber-800">{t.booking.fullName}</Label><Input id="name" value={bookingData.name} onChange={(e) => setBookingData({ ...bookingData, name: e.target.value })} className="border-amber-200 focus:border-amber-400" /></div>
            <div><Label htmlFor="email" className="text-amber-800">{t.booking.email}</Label><Input id="email" type="email" value={bookingData.email} onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })} className="border-amber-200 focus:border-amber-400" /></div>
            <div><Label htmlFor="phone" className="text-amber-800">{t.booking.phone}</Label><Input id="phone" required value={bookingData.phone} onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })} className="border-amber-200 focus:border-amber-400" /></div>
            <div>
              <Label className="text-amber-800">{t.booking.date}</Label>
              <Input
                type="date"
                value={bookingData.date || ''}
                onChange={(e) => {
                  const selectedDate = e.target.value;

                  // Check if date is available for booking
                  if (!availableDateStrings.includes(selectedDate)) {
                    // Reset date selection
                    setBookingData({
                      ...bookingData,
                      date: '',
                      startTime: isDayPass ? '10:00' : '',
                      endTime: isDayPass ? '18:30' : ''
                    });
                    // Show error message
                    alert(language === 'zh'
                      ? '此日期尚未開放預約，請選擇其他日期或聯絡管理員'
                      : 'This date is not open for booking. Please select another date or contact admin.');
                    return;
                  }

                  setBookingData({
                    ...bookingData,
                    date: selectedDate,
                    // Preserve Day Pass fixed times, reset for other rooms
                    startTime: isDayPass ? '10:00' : '',
                    endTime: isDayPass ? '18:30' : ''
                  });
                }}
                className="border-amber-200 focus:border-amber-400"
                min={new Date().toISOString().split('T')[0]}
                max={getMaxDate()}
              />
              {availableDateStrings.length === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  {language === 'zh'
                    ? '⚠️ 目前沒有開放的日期。請聯絡管理員開放預約日期。'
                    : '⚠️ No dates are currently available. Please contact admin to open booking dates.'}
                </p>
              )}
              {availableDateStrings.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {language === 'zh'
                    ? `目前有 ${availableDateStrings.length} 個日期可供預約`
                    : `${availableDateStrings.length} dates currently available for booking`}
                </p>
              )}
            </div>
            
            <Tabs value={bookingData.bookingType} onValueChange={(val) => setBookingData(prev => ({
              ...prev,
              bookingType: val,
              rentalType: val === 'dp20' ? 'daily' : 'hourly',
              // Preserve Day Pass fixed times, reset for other rooms
              startTime: isDayPass ? '10:00' : '',
              endTime: isDayPass ? '18:30' : ''
            }))} className="w-full">
              <TabsList className={`grid w-full ${selectedRoom?.bookingOptions.filter(opt => opt !== 'token' || selectedRoom.name !== 'Room C').length === 3 ? 'grid-cols-3' : selectedRoom?.bookingOptions.filter(opt => opt !== 'token' || selectedRoom.name !== 'Room C').length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {selectedRoom?.bookingOptions.includes('token') && selectedRoom.name !== 'Room C' && (
                  <TabsTrigger value="token">{t.booking.token}</TabsTrigger>
                )}
                {selectedRoom?.bookingOptions.includes('cash') && (
                  <TabsTrigger value="cash">{t.booking.cash}</TabsTrigger>
                )}
                {selectedRoom?.bookingOptions.includes('dp20') && (
                  <TabsTrigger value="dp20">{t.booking.dp20Package}</TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="token" className="pt-4">
                {user && !user.isAdmin && (
                  <div className="space-y-4">
                    {((user.br15_balance || 0) === 0 && (user.br30_balance || 0) === 0) && (
                      <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                        <p className="text-sm text-yellow-800">
                          {language === 'zh'
                            ? '⚠️ 您的 BR 套票餘額為 0。將使用一般 Token 進行預約。'
                            : '⚠️ Your BR package balance is 0. Regular tokens will be used for booking.'}
                        </p>
                      </div>
                    )}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-amber-200">
                      <h4 className="text-amber-800 font-semibold mb-3">{t.booking.selectPackage}</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setBookingData(prev => ({...prev, selectedBRPackage: 'BR15'}))}
                          disabled={(user.br15_balance || 0) === 0}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            bookingData.selectedBRPackage === 'BR15'
                              ? 'border-blue-500 bg-blue-100'
                              : (user.br15_balance || 0) === 0
                              ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                              : 'border-gray-300 bg-white hover:border-blue-300'
                          }`}
                        >
                          <div className={`text-sm font-semibold ${(user.br15_balance || 0) === 0 ? 'text-gray-400' : 'text-blue-700'}`}>
                            {t.booking.br15Package}
                          </div>
                          <div className={`text-xs mt-1 ${(user.br15_balance || 0) === 0 ? 'text-gray-400' : 'text-gray-600'}`}>
                            {t.booking.br15Balance.replace('{balance}', user.br15_balance || 0)}
                          </div>
                          {(user.br15_balance || 0) === 0 && (
                            <div className="text-xs text-red-400 mt-1">{language === 'zh' ? '無餘額' : 'No balance'}</div>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setBookingData(prev => ({...prev, selectedBRPackage: 'BR30'}))}
                          disabled={(user.br30_balance || 0) === 0}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            bookingData.selectedBRPackage === 'BR30'
                              ? 'border-purple-500 bg-purple-100'
                              : (user.br30_balance || 0) === 0
                              ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                              : 'border-gray-300 bg-white hover:border-purple-300'
                          }`}
                        >
                          <div className={`text-sm font-semibold ${(user.br30_balance || 0) === 0 ? 'text-gray-400' : 'text-purple-700'}`}>
                            {t.booking.br30Package}
                          </div>
                          <div className={`text-xs mt-1 ${(user.br30_balance || 0) === 0 ? 'text-gray-400' : 'text-gray-600'}`}>
                            {t.booking.br30Balance.replace('{balance}', user.br30_balance || 0)}
                          </div>
                          {(user.br30_balance || 0) === 0 && (
                            <div className="text-xs text-red-400 mt-1">{language === 'zh' ? '無餘額' : 'No balance'}</div>
                          )}
                        </button>
                      </div>
                    </div>
                    {requiredTokens > 0 && bookingData.selectedBRPackage && (
                      <div className="p-4 bg-amber-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-amber-700">{t.booking.brCost.replace('{count}', requiredTokens)}</span>
                          {!hasEnoughTokens && (<span className="text-red-600 text-sm font-medium">{t.booking.insufficientBr}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label className="text-amber-800">{t.booking.startTime}</Label>
                    <Select
                      value={bookingData.startTime || ''}
                      onValueChange={(value) => {
                        console.log('🕐 Token Start Time Selected:', value);
                        setBookingData({ ...bookingData, startTime: value, endTime: '' });
                      }}
                      onOpenChange={(open) => {
                        console.log('🔓 Token Start Time Dropdown:', open ? 'OPENED' : 'CLOSED');
                      }}
                    >
                      <SelectTrigger
                        onClick={() => console.log('🖱️ Token Start Time Trigger Clicked')}
                        disabled={!bookingData.date}
                      >
                        <SelectValue placeholder={bookingData.date ? t.booking.selectTime : (language === 'zh' ? '請先選擇日期' : 'Please select date first')} />
                      </SelectTrigger>
                      <SelectContent position="popper" onCloseAutoFocus={(e) => {
                        console.log('🎯 Token Start Time Close Auto Focus');
                        e.preventDefault();
                      }}>
                        {console.log('📋 Token Time Options Available:', timeOptions.length)}
                        {timeOptions.filter(time => {
                          const [hour, minute] = time.split(':').map(Number);
                          return hour < 22 || (hour === 22 && minute === 0);
                        }).map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-amber-800">{t.booking.endTime}</Label>
                    <Select value={bookingData.endTime || ''} onValueChange={(value) => setBookingData({ ...bookingData, endTime: value })}>
                      <SelectTrigger disabled={!bookingData.startTime}>
                        <SelectValue placeholder={bookingData.startTime ? t.booking.selectTime : (language === 'zh' ? '請先選擇開始時間' : 'Please select start time first')} />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {loadingEndTimes ? (
                          <SelectItem value="loading" disabled>{language === 'zh' ? '載入中...' : 'Loading...'}</SelectItem>
                        ) : (
                          endTimeOptions.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="cash" className="pt-4">
                {isDayPass ? (
                  /* Day Pass: Full day pass, no time selection */
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2 text-center">
                        {language === 'zh' ? 'Day Pass 使用時段' : 'Day Pass Time Slot'}
                      </h4>
                      <div className="text-center py-3">
                        <p className="text-3xl font-bold text-blue-800">10:00 AM - 6:30 PM</p>
                        <p className="text-xs text-gray-600 mt-2">
                          {language === 'zh'
                            ? '全日通行證，固定時段'
                            : 'Full day pass, fixed time slot'}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-700 font-bold">{t.booking.totalPrice.replace('{total}', 100)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <Tabs value={bookingData.rentalType} onValueChange={(val) => setBookingData(prev => ({
                      ...prev,
                      rentalType: val,
                      // Preserve Day Pass fixed times, reset for other rooms
                      startTime: isDayPass ? '10:00' : '',
                      endTime: isDayPass ? '18:30' : ''
                    }))} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="hourly">{t.booking.hourly}</TabsTrigger>
                        <TabsTrigger value="monthly">{t.booking.monthly}</TabsTrigger>
                      </TabsList>
                      <TabsContent value="hourly" className="pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-amber-800">{t.booking.startTime}</Label>
                        <Select
                          value={bookingData.startTime || ''}
                          onValueChange={(value) => {
                            console.log('🕐 Cash Start Time Selected:', value);
                            setBookingData({ ...bookingData, startTime: value, endTime: '' });
                          }}
                          onOpenChange={(open) => {
                            console.log('🔓 Cash Start Time Dropdown:', open ? 'OPENED' : 'CLOSED');
                            console.log('📊 Current bookingData:', bookingData);
                            console.log('📅 Selected date:', bookingData.date);
                            console.log('⚠️ Date is:', bookingData.date ? 'SET ✅' : 'NOT SET ❌ - Please select a date first!');
                            console.log('🏠 Selected room:', selectedRoom?.id, selectedRoom?.name);
                          }}
                        >
                          <SelectTrigger
                            onClick={() => console.log('🖱️ Cash Start Time Trigger Clicked')}
                            disabled={!bookingData.date}
                          >
                            <SelectValue placeholder={bookingData.date ? t.booking.selectTime : (language === 'zh' ? '請先選擇日期' : 'Please select date first')} />
                          </SelectTrigger>
                          <SelectContent position="popper" onCloseAutoFocus={(e) => {
                            console.log('🎯 Cash Start Time Close Auto Focus');
                            e.preventDefault();
                          }}>
                            {console.log('📋 Cash Time Options Available:', timeOptions.length, timeOptions)}
                            {timeOptions.filter(time => {
                              const [hour, minute] = time.split(':').map(Number);
                              return hour < 22 || (hour === 22 && minute === 0);
                            }).map(time => (
                              <SelectItem key={time} value={time}>{time}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-amber-800">{t.booking.endTime}</Label>
                        <Select
                          value={bookingData.endTime || ''}
                          onValueChange={(value) => {
                            console.log('🕐 Cash End Time Selected:', value);
                            setBookingData({ ...bookingData, endTime: value });
                          }}
                        >
                          <SelectTrigger disabled={!bookingData.startTime}>
                            <SelectValue placeholder={bookingData.startTime ? t.booking.selectTime : (language === 'zh' ? '請先選擇開始時間' : 'Please select start time first')} />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            {loadingEndTimes ? (
                              <SelectItem value="loading" disabled>{language === 'zh' ? '載入中...' : 'Loading...'}</SelectItem>
                            ) : (
                              endTimeOptions.map(time => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                      </TabsContent>
                      <TabsContent value="monthly" className="pt-4">
                        <form onSubmit={handleMonthlyInquiry} className="space-y-4">
                          <p className='text-sm text-amber-700'>{language === 'zh' ? '月租服務請直接聯絡我們查詢。' : 'For monthly rentals, please contact us directly.'}</p>
                          <Button type="submit" className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">{t.booking.contactUs}</Button>
                        </form>
                      </TabsContent>
                    </Tabs>
                    {totalPrice > 0 && bookingData.rentalType !== 'monthly' && (
                      <div className="p-4 bg-blue-50 rounded-lg mt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-blue-700 font-bold">{t.booking.totalPrice.replace('{total}', totalPrice)}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="dp20" className="pt-4">
                {user && !user.isAdmin && (
                  <div className="space-y-4">
                    {/* DP20 Balance Display */}
                    <div className="p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border-2 border-green-200">
                      <h4 className="text-green-800 font-semibold mb-2">{t.booking.dp20Package}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{language === 'zh' ? '剩餘次數:' : 'Remaining visits:'}</span>
                          <span className={`font-bold ${(user.dp20_balance || 0) > 5 ? 'text-green-700' : (user.dp20_balance || 0) > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                            {t.booking.dp20Balance.replace('{balance}', user.dp20_balance || 0)}
                          </span>
                        </div>
                        {user.dp20_expiry && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{language === 'zh' ? '有效期至:' : 'Valid until:'}</span>
                            <span className={`text-sm font-medium ${new Date(user.dp20_expiry) < new Date() ? 'text-red-600' : new Date(user.dp20_expiry) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'text-orange-600' : 'text-green-700'}`}>
                              {new Date(user.dp20_expiry).toLocaleDateString(language === 'zh' ? 'zh-HK' : 'en-US')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Warning messages */}
                      {(user.dp20_balance || 0) === 0 && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-800 font-medium mb-2">
                            {language === 'zh' ? '📢 您目前沒有DP20套票' : '📢 You don\'t have a DP20 package yet'}
                          </p>
                          <p className="text-xs text-blue-700">
                            {t.booking.dp20PackageInfo}
                          </p>
                          <p className="text-xs text-blue-600 mt-2">
                            {language === 'zh'
                              ? '💡 如需購買或了解更多，WhatsApp查詢: 6623 8788'
                              : '💡 To purchase or learn more, WhatsApp: 6623 8788'}
                          </p>
                        </div>
                      )}
                      {user.dp20_expiry && new Date(user.dp20_expiry) < new Date() && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-sm text-red-700 font-medium">
                            {t.booking.dp20Expired}
                          </p>
                        </div>
                      )}
                      {user.dp20_expiry && new Date(user.dp20_expiry) > new Date() && new Date(user.dp20_expiry) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                        <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <p className="text-sm text-orange-700 font-medium">
                            {language === 'zh' ? '⚠️ 您的DP20套票即將到期' : '⚠️ Your DP20 package is expiring soon'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* DP20 Cost Info */}
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="text-green-700 font-medium">{t.booking.dp20Required}</span>
                        <span className="text-sm text-gray-600">{language === 'zh' ? '(10:00-18:30)' : '(10:00 AM - 6:30 PM)'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Time display for DP20 (operating hours info) */}
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-center">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">
                      {language === 'zh' ? 'Day Pass 使用時段' : 'Day Pass Operating Hours'}
                    </h4>
                    <p className="text-2xl font-bold text-blue-800">10:00 AM - 6:30 PM</p>
                    <p className="text-xs text-gray-600 mt-2">
                      {language === 'zh'
                        ? '選擇日期即可，無需選擇時間'
                        : 'Select date only, no time selection needed'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {language === 'zh'
                        ? 'Day Pass 在營業時段內全天有效'
                        : 'Day Pass is valid throughout operating hours'}
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div>
              <Label htmlFor="guests" className="text-amber-800">{t.booking.guests}</Label>
              <Input
                id="guests"
                type="number"
                min="1"
                max={isDayPass ? 1 : selectedRoom?.capacity}
                value={isDayPass ? 1 : bookingData.guests}
                onChange={(e) => setBookingData({ ...bookingData, guests: parseInt(e.target.value) || 1 })}
                className="border-amber-200 focus:border-amber-400"
                disabled={isDayPass}
              />
              {isDayPass && (
                <p className="text-sm text-gray-600 mt-1">
                  {language === 'zh' ? 'Day Pass 僅限1人使用' : 'Day Pass is limited to 1 person'}
                </p>
              )}
            </div>

            {/* Projector Option for Room C and Room E */}
            {(selectedRoom?.id === 2 || selectedRoom?.id === 4) && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="projector"
                    checked={bookingData.wantsProjector}
                    onCheckedChange={(checked) => setBookingData({ ...bookingData, wantsProjector: checked })}
                  />
                  <div className="flex-1">
                    <Label htmlFor="projector" className="text-blue-800 font-semibold cursor-pointer">
                      {language === 'zh' ? '需要投影機 (+$20)' : 'Need Projector (+$20)'}
                    </Label>
                    <p className="text-sm text-blue-600 mt-1">
                      {language === 'zh'
                        ? '此房間配有投影機，如需使用請勾選此項，將額外收取 $20 費用。'
                        : 'This room has a projector available. Check this option if you need it, additional $20 will be charged.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div id="purpose-section">
              <Label className="text-amber-800">
                {t.booking.purpose} <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {businessPurposes.map((purpose, index) => (
                  <div key={`${purpose}-${index}`} className="flex items-center space-x-2">
                    <Checkbox
                      id={`purpose-${purpose}-${index}`}
                      checked={Array.isArray(bookingData.purpose) && bookingData.purpose.includes(purpose)}
                      onCheckedChange={(checked) => handlePurposeChange(purpose, checked)}
                    />
                    <Label htmlFor={`purpose-${purpose}-${index}`} className="text-sm font-medium text-amber-700 cursor-pointer">
                      {(isDayPass ? t.booking.dayPassPurposes[purpose] : t.booking.businessPurposes[purpose]) || purpose}
                    </Label>
                  </div>
                ))}
              </div>
              {purposeError && (
                <p className="text-red-500 text-sm mt-2">
                  {language === 'zh' ? '請選擇至少一項業務性質' : 'Please select at least one purpose'}
                </p>
              )}
              {showOtherPurposeInput && (
                <div className="mt-2">
                  <Textarea id="other-purpose" value={bookingData.otherPurpose || ''} onChange={(e) => setBookingData({ ...bookingData, otherPurpose: e.target.value })} placeholder={t.booking.otherPurposePlaceholder} className="border-amber-200 focus:border-amber-400" />
                </div>
              )}
            </div>

            {/* Equipment Selection - Multiple */}
            <div>
              <Label className="text-amber-800">
                {t.booking.equipment}
              </Label>
              <p className="text-sm text-gray-500 mt-1 mb-3">{t.booking.selectEquipment}</p>
              <div className="space-y-3">
                {Object.entries(t.booking.equipmentOptions).map(([key, label]) => {
                  const equipmentItem = bookingData.equipment?.find(item => item.type === key);
                  const isChecked = !!equipmentItem;

                  return (
                    <div key={key} className="flex items-center space-x-3">
                      <Checkbox
                        id={`equipment-${key}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            // Add equipment with default quantity 1
                            const newEquipment = [...(bookingData.equipment || []), { type: key, quantity: 1 }];
                            setBookingData({ ...bookingData, equipment: newEquipment });
                          } else {
                            // Remove equipment
                            const newEquipment = (bookingData.equipment || []).filter(item => item.type !== key);
                            setBookingData({ ...bookingData, equipment: newEquipment });
                          }
                        }}
                      />
                      <Label htmlFor={`equipment-${key}`} className="text-amber-700 cursor-pointer flex-1">
                        {label}
                      </Label>
                      {isChecked && (
                        <Input
                          type="number"
                          min="1"
                          max="50"
                          value={equipmentItem?.quantity || 1}
                          onChange={(e) => {
                            const newQuantity = parseInt(e.target.value) || 1;
                            const newEquipment = (bookingData.equipment || []).map(item =>
                              item.type === key ? { ...item, quantity: newQuantity } : item
                            );
                            setBookingData({ ...bookingData, equipment: newEquipment });
                          }}
                          placeholder={t.booking.equipmentQuantity}
                          className="w-24 border-amber-200 focus:border-amber-400"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="requests" className="text-amber-800">
                {t.booking.specialRequests}
              </Label>
              <Textarea
                id="requests"
                value={bookingData.specialRequests || ''}
                onChange={(e) => setBookingData({ ...bookingData, specialRequests: e.target.value })}
                placeholder={t.booking.specialRequestsPlaceholderUpdated}
                className="border-amber-200 focus:border-amber-400 placeholder-gray-400 mt-2"
              />
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox id="terms" checked={bookingData.agreedToTerms} onCheckedChange={(checked) => setBookingData({ ...bookingData, agreedToTerms: checked })} />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t.booking.agreeTerms}</Label>
              </div>
            </div>
          </div>

          <Card className="p-4 bg-amber-50 border-amber-200 mt-6">
            <h4 className="font-semibold text-amber-800 mb-2">{t.booking.paymentContactTitle}</h4>
            <p className="text-sm text-amber-700 mb-2">{t.booking.paymentContactSubtitle}</p>
            <div className="flex flex-col space-y-2 text-sm">
              <a href="https://wa.me/85266238788" target="_blank" rel="noopener noreferrer" className="flex items-center text-green-600 hover:underline">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.452-4.433-9.888-9.888-9.888-5.452 0-9.887 4.434-9.889 9.887-.001 2.225.651 4.315 1.919 6.066l-1.288 4.725 4.839-1.282z"/></svg>
                {t.booking.whatsappLink}: 6623 8788
              </a>
            </div>
          </Card>

          <DialogFooter className="flex-col sm:flex-row gap-2 items-center mt-6">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto border-amber-300 text-amber-700 hover:bg-amber-50">
              {language === 'zh' ? '取消' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={(bookingData.bookingType === 'token' && !hasEnoughTokens) || !bookingData.agreedToTerms} className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed">{t.booking.confirm}</Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
