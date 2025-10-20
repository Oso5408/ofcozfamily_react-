
import React, { useState, useEffect } from 'react';
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
import { Mail } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { generateTimeOptions, generateEndTimeOptions, checkDailySlotConflict } from '@/lib/timeUtils';

export const BookingModal = ({
  isOpen,
  onClose,
  selectedRoom,
  bookingData,
  setBookingData,
  onSubmit,
}) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const t = translations[language];
  const [showOtherPurposeInput, setShowOtherPurposeInput] = useState(false);
  const [timeOptions, setTimeOptions] = useState([]);
  const [endTimeOptions, setEndTimeOptions] = useState([]);
  const [availableDailySlots, setAvailableDailySlots] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [loadingEndTimes, setLoadingEndTimes] = useState(false);
  const [purposeError, setPurposeError] = useState(false);

  const businessPurposes = ["教學", "心理及催眠", "會議", "工作坊", "溫習", "動物傳心", "古法術枚", "直傳靈氣", "其他"];

  const dailyTimeSlots = [
    { value: "10:00-20:00", label: "10:00 - 20:00" },
    { value: "11:00-21:00", label: "11:00 - 21:00" },
    { value: "12:00-22:00", label: "12:00 - 22:00" },
  ];

  useEffect(() => {
    if (user) {
      setBookingData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
    }
  }, [user, isOpen, setBookingData]);

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
    const start = parseInt(bookingData.startTime.split(':')[0]);
    const end = parseInt(bookingData.endTime.split(':')[0]);
    const baseTokens = Math.max(0, end - start);

    // Add projector fee if selected (Room C or Room E)
    const projectorFee = bookingData.wantsProjector && (selectedRoom?.id === 2 || selectedRoom?.id === 4) ? 20 : 0;

    return baseTokens + projectorFee;
  };

  const calculatePrice = () => {
    if (bookingData.bookingType !== 'cash' || !selectedRoom?.prices?.cash) return 0;

    let basePrice = 0;

    if (bookingData.rentalType === 'daily' && selectedRoom.prices.cash.daily) {
      basePrice = selectedRoom.prices.cash.daily;
    } else if (bookingData.rentalType === 'hourly' && bookingData.startTime && bookingData.endTime && selectedRoom.prices.cash.hourly) {
      const start = parseInt(bookingData.startTime.split(':')[0]);
      const end = parseInt(bookingData.endTime.split(':')[0]);
      const hours = Math.max(0, end - start);
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
  const hasEnoughTokens = user?.isAdmin || userTokens >= requiredTokens;
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

        <form onSubmit={handleFormSubmit}>
          <div className="space-y-4 py-4">
            <div><Label htmlFor="name" className="text-amber-800">{t.booking.fullName}</Label><Input id="name" value={bookingData.name} onChange={(e) => setBookingData({ ...bookingData, name: e.target.value })} className="border-amber-200 focus:border-amber-400" /></div>
            <div><Label htmlFor="email" className="text-amber-800">{t.booking.email}</Label><Input id="email" type="email" value={bookingData.email} onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })} className="border-amber-200 focus:border-amber-400" /></div>
            <div><Label htmlFor="phone" className="text-amber-800">{t.booking.phone}</Label><Input id="phone" required value={bookingData.phone} onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })} className="border-amber-200 focus:border-amber-400" /></div>
            <div><Label className="text-amber-800">{t.booking.date}</Label><Input type="date" value={bookingData.date || ''} onChange={(e) => setBookingData({ ...bookingData, date: e.target.value, startTime: '', endTime:'' })} className="border-amber-200 focus:border-amber-400" min={new Date().toISOString().split('T')[0]} max={getMaxDate()} /></div>
            
            <Tabs value={bookingData.bookingType} onValueChange={(val) => setBookingData(prev => ({...prev, bookingType: val, rentalType: 'hourly', startTime: '', endTime: ''}))} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="token" disabled={!selectedRoom?.bookingOptions.includes('token') || selectedRoom.name === 'Room C'}>{t.booking.token}</TabsTrigger>
                <TabsTrigger value="cash" disabled={!selectedRoom?.bookingOptions.includes('cash')}>{t.booking.cash}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="token" className="pt-4">
                {user && !user.isAdmin && (
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-amber-800 font-medium">{t.dashboard.myTokens}</span>
                      <span className="token-badge"><span className="token-icon"></span>{userTokens}</span>
                    </div>
                    {requiredTokens > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-amber-700">{t.booking.tokensRequired.replace('{count}', requiredTokens)}</span>
                        {!hasEnoughTokens && (<span className="text-red-600 text-sm font-medium">{t.booking.insufficientTokens}</span>)}
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
                        {timeOptions.filter(time => parseInt(time.split(':')[0]) < 22).map(time => (
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
                <Tabs value={bookingData.rentalType} onValueChange={(val) => setBookingData(prev => ({...prev, rentalType: val, startTime: '', endTime: ''}))} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="hourly">{t.booking.hourly}</TabsTrigger>
                    <TabsTrigger value="daily">{t.booking.daily}</TabsTrigger>
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
                            {timeOptions.filter(time => parseInt(time.split(':')[0]) < 22).map(time => (
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
                  <TabsContent value="daily" className="pt-4">
                    <div>
                      <Label className="text-amber-800">{t.booking.timeSlot}</Label>
                      <Select value={`${bookingData.startTime}-${bookingData.endTime}`} onValueChange={(value) => { const [start, end] = value.split('-'); setBookingData({ ...bookingData, startTime: start, endTime: end }); }}>
                        <SelectTrigger>
                          <SelectValue placeholder={t.booking.selectTimeSlot} />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          {availableDailySlots.map(slot => (
                            <SelectItem key={slot.value} value={slot.value}>{slot.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                  <TabsContent value="monthly" className="pt-4">
                    <form onSubmit={handleMonthlyInquiry} className="space-y-4">
                      <p className='text-sm text-amber-700'>{language === 'zh' ? '月租服務請直接聯絡我們查詢。' : 'For monthly rentals, please contact us directly.'}</p>
                      <Button type="submit" className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">{t.booking.contactUs}</Button>
                    </form>
                  </TabsContent>
                </Tabs>
                {totalPrice > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-700 font-bold">{t.booking.totalPrice.replace('{total}', totalPrice)}</span>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div><Label htmlFor="guests" className="text-amber-800">{t.booking.guests}</Label><Input id="guests" type="number" min="1" max={selectedRoom?.capacity} value={bookingData.guests} onChange={(e) => setBookingData({ ...bookingData, guests: parseInt(e.target.value) || 1 })} className="border-amber-200 focus:border-amber-400" /></div>

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
                {businessPurposes.map(purpose => (
                  <div key={purpose} className="flex items-center space-x-2">
                    <Checkbox id={`purpose-${purpose}`} checked={Array.isArray(bookingData.purpose) && bookingData.purpose.includes(purpose)} onCheckedChange={(checked) => handlePurposeChange(purpose, checked)} />
                    <Label htmlFor={`purpose-${purpose}`} className="text-sm font-medium text-amber-700">{t.booking.businessPurposes[purpose] || purpose}</Label>
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
            
            <div><Label htmlFor="requests" className="text-amber-800">{t.booking.specialRequests}</Label><Textarea id="requests" value={bookingData.specialRequests} onChange={(e) => setBookingData({ ...bookingData, specialRequests: e.target.value })} placeholder={t.booking.specialRequestsPlaceholderUpdated} className="border-amber-200 focus:border-amber-400 placeholder-gray-400" /></div>
            
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
              <a href="mailto:ofcozfamily@gmail.com" className="flex items-center text-blue-600 hover:underline">
                <Mail className="w-4 h-4 mr-2"/>{t.booking.emailLink}: ofcozfamily@gmail.com
              </a>
            </div>
          </Card>

          <DialogFooter className="flex-col items-center mt-6">
            <Button type="submit" disabled={(bookingData.bookingType === 'token' && !hasEnoughTokens) || !bookingData.agreedToTerms} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed">{t.booking.confirm}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
