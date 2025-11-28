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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { translations } from '@/data/translations';
import { generateTimeOptions, generateEndTimeOptions } from '@/lib/timeUtils';
import { bookingService, emailService } from '@/services';
import { useToast } from '@/components/ui/use-toast';
import { availableDatesService } from '@/services/availableDatesService';

export const AdminCreateBookingModal = ({ isOpen, onClose, users, rooms, onBookingCreated }) => {
  const { language } = useLanguage();
  const { user: admin, updateUserTokens, deductBRBalance, deductDP20Balance } = useAuth();
  const t = translations[language];
  const { toast } = useToast();

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingData, setBookingData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    bookingType: 'hourly',
    paymentMethod: 'cash',
    guests: 1,
    purpose: [],
    otherPurpose: '',
    equipment: [],
    specialRequests: '',
    wantsProjector: false,
  });
  const [sendEmail, setSendEmail] = useState(true);
  const [timeOptions, setTimeOptions] = useState([]);
  const [endTimeOptions, setEndTimeOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [loadingEndTimes, setLoadingEndTimes] = useState(false);
  const [availableDateStrings, setAvailableDateStrings] = useState([]);
  const [purposeError, setPurposeError] = useState(false);
  const [timeDurationError, setTimeDurationError] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const businessPurposes = ["教學", "心理及催眠", "會議", "工作坊", "溫習", "動物傳心", "古法術枚", "直傳靈氣", "其他"];

  // Load available dates when room changes
  useEffect(() => {
    const loadAvailableDates = async () => {
      if (!isOpen || !selectedRoom) return;

      const result = await availableDatesService.getAvailableDateStrings(selectedRoom.id);
      if (result.success) {
        setAvailableDateStrings(result.dateStrings);
      }
    };

    loadAvailableDates();
  }, [isOpen, selectedRoom]);

  // Fetch available time slots when date or room changes
  useEffect(() => {
    const fetchTimeOptions = async () => {
      if (!bookingData.date || !selectedRoom?.id) {
        setTimeOptions([]);
        return;
      }

      setLoadingTimes(true);
      try {
        const options = await generateTimeOptions(bookingData.date, selectedRoom.id);
        setTimeOptions(options);
      } catch (error) {
        console.error('Error fetching time options:', error);
      } finally {
        setLoadingTimes(false);
      }
    };

    fetchTimeOptions();
  }, [bookingData.date, selectedRoom?.id]);

  // Fetch available end time options
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
        setBookingData(prev => ({ ...prev, otherPurpose: '' }));
      }
    }

    setBookingData({ ...bookingData, purpose: newPurposes });
    setPurposeError(false);
  };

  const calculatePrice = () => {
    if (!selectedRoom?.prices?.cash) return 0;

    let basePrice = 0;

    if (bookingData.bookingType === 'daily' && selectedRoom.prices.cash.daily) {
      basePrice = selectedRoom.prices.cash.daily;
    } else if (bookingData.bookingType === 'hourly' && bookingData.startTime && bookingData.endTime && selectedRoom.prices.cash.hourly) {
      const [startHourStr, startMinuteStr] = bookingData.startTime.split(':');
      const startHour = parseInt(startHourStr);
      const startMinute = parseInt(startMinuteStr || '0');

      const [endHourStr, endMinuteStr] = bookingData.endTime.split(':');
      const endHour = parseInt(endHourStr);
      const endMinute = parseInt(endMinuteStr || '0');

      const durationHours = (endHour + endMinute / 60) - (startHour + startMinute / 60);
      const hours = Math.max(0, durationHours);

      basePrice = hours * selectedRoom.prices.cash.hourly;
    } else if (bookingData.bookingType === 'monthly' && selectedRoom.prices.cash.monthly) {
      basePrice = selectedRoom.prices.cash.monthly;
    }

    const projectorFee = bookingData.wantsProjector && (selectedRoom?.id === 2 || selectedRoom?.id === 4) ? 20 : 0;

    return basePrice + projectorFee;
  };

  // Calculate duration in minutes
  const calculateDurationInMinutes = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMin;
    const endTotalMinutes = endHour * 60 + endMin;
    return endTotalMinutes - startTotalMinutes;
  };

  // Calculate hours for token/BR deduction (1 hour = 1 token/BR)
  const calculateHours = () => {
    if (!bookingData.startTime || !bookingData.endTime) return 0;

    const [startHourStr, startMinuteStr] = bookingData.startTime.split(':');
    const startHour = parseInt(startHourStr);
    const startMinute = parseInt(startMinuteStr || '0');

    const [endHourStr, endMinuteStr] = bookingData.endTime.split(':');
    const endHour = parseInt(endHourStr);
    const endMinute = parseInt(endMinuteStr || '0');

    const durationHours = (endHour + endMinute / 60) - (startHour + startMinute / 60);
    return Math.max(0, durationHours);
  };

  // Get display cost based on payment method
  const getDisplayCost = () => {
    const hours = calculateHours();

    switch(bookingData.paymentMethod) {
      case 'token':
        return `${hours} ${language === 'zh' ? '代幣' : 'tokens'}`;
      case 'br15':
      case 'br30':
        return `${hours} ${language === 'zh' ? '小時' : 'hours'}`;
      case 'dp20':
        return `1 ${language === 'zh' ? '天' : 'day'}`;
      case 'cash':
      default:
        return `$${calculatePrice()}`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate user selection
    if (!selectedUser) {
      toast({
        title: language === 'zh' ? '請選擇用戶' : 'Please select a user',
        variant: 'destructive'
      });
      return;
    }

    // Validate room selection
    if (!selectedRoom) {
      toast({
        title: language === 'zh' ? '請選擇房間' : 'Please select a room',
        variant: 'destructive'
      });
      return;
    }

    // Validate minimum 1 hour duration (60 minutes)
    const duration = calculateDurationInMinutes(bookingData.startTime, bookingData.endTime);
    if (duration < 60) {
      setTimeDurationError(true);
      toast({
        title: language === 'zh' ? '預約時間不足' : 'Booking duration too short',
        description: language === 'zh' ? '最少預約時間為 1 小時' : 'Minimum booking duration is 1 hour',
        variant: 'destructive'
      });
      return;
    }
    setTimeDurationError(false);

    // Validate purpose
    if (!Array.isArray(bookingData.purpose) || bookingData.purpose.length === 0) {
      setPurposeError(true);
      return;
    }

    setLoading(true);

    try {
      // Prepare booking data
      const startDateTime = new Date(`${bookingData.date}T${bookingData.startTime}:00`);
      const endDateTime = new Date(`${bookingData.date}T${bookingData.endTime}:00`);
      const totalCost = calculatePrice(); // Cash price (for display and cash bookings)
      const requiredHours = calculateHours(); // Hours needed for token/BR deduction (1 hour = 1 token/BR)

      // ===== TOKEN/PACKAGE DEDUCTION LOGIC =====
      // Deduct tokens/packages BEFORE creating the booking (matching user booking flow)
      if (bookingData.paymentMethod === 'token') {
        // Deduct regular tokens (1 hour = 1 token)
        console.log('💳 Admin booking: Deducting regular tokens', {
          userId: selectedUser.id,
          hours: requiredHours,
          cashPrice: totalCost
        });

        // Check balance first
        if (selectedUser.tokens < requiredHours) {
          toast({
            title: language === 'zh' ? '代幣餘額不足' : 'Insufficient Tokens',
            description: language === 'zh'
              ? `用戶餘額: ${selectedUser.tokens} 代幣，需要: ${requiredHours} 代幣`
              : `User balance: ${selectedUser.tokens} tokens, Required: ${requiredHours} tokens`,
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }

        const tokenResult = await updateUserTokens(selectedUser.id, requiredHours, false, `Admin booking deduction for ${selectedRoom.name}`);

        if (!tokenResult) {
          toast({
            title: language === 'zh' ? '扣除代幣失敗' : 'Token Deduction Failed',
            description: language === 'zh' ? '無法從用戶帳戶扣除代幣' : 'Failed to deduct tokens from user account',
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }

        console.log('✅ Regular tokens deducted successfully:', requiredHours, 'tokens');

      } else if (bookingData.paymentMethod === 'br15' || bookingData.paymentMethod === 'br30') {
        // Deduct BR package balance (1 hour = 1 BR)
        const packageType = bookingData.paymentMethod === 'br15' ? 'BR15' : 'BR30';
        const balanceField = bookingData.paymentMethod === 'br15' ? 'br15_balance' : 'br30_balance';
        const currentBalance = selectedUser[balanceField] || 0;

        console.log('💳 Admin booking: Deducting BR package', {
          userId: selectedUser.id,
          packageType,
          hours: requiredHours,
          currentBalance,
          cashPrice: totalCost
        });

        // Check balance first
        if (currentBalance < requiredHours) {
          toast({
            title: language === 'zh' ? `${packageType} 餘額不足` : `Insufficient ${packageType} Balance`,
            description: language === 'zh'
              ? `用戶 ${packageType} 餘額: ${currentBalance} BR，需要: ${requiredHours} BR`
              : `User ${packageType} balance: ${currentBalance} BR, Required: ${requiredHours} BR`,
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }

        const brResult = await deductBRBalance(selectedUser.id, requiredHours, packageType);

        if (!brResult.success) {
          toast({
            title: language === 'zh' ? `扣除 ${packageType} 失敗` : `${packageType} Deduction Failed`,
            description: brResult.error || (language === 'zh' ? '無法從用戶帳戶扣除 BR' : 'Failed to deduct BR from user account'),
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }

        console.log('✅ BR package deducted successfully:', requiredHours, 'BR');

      } else if (bookingData.paymentMethod === 'dp20') {
        // Deduct DP20 package balance
        const currentBalance = selectedUser.dp20_balance || 0;
        const expiry = selectedUser.dp20_expiry ? new Date(selectedUser.dp20_expiry) : null;
        const isExpired = expiry && expiry < new Date();

        console.log('💳 Admin booking: Deducting DP20', {
          userId: selectedUser.id,
          currentBalance,
          expiry,
          isExpired
        });

        // Check balance and expiry first
        if (currentBalance < 1) {
          toast({
            title: language === 'zh' ? 'DP20 餘額不足' : 'Insufficient DP20 Balance',
            description: language === 'zh'
              ? `用戶 DP20 餘額: ${currentBalance} 次`
              : `User DP20 balance: ${currentBalance} visits`,
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }

        if (isExpired) {
          toast({
            title: language === 'zh' ? 'DP20 已過期' : 'DP20 Expired',
            description: language === 'zh'
              ? `DP20 套票已於 ${expiry.toLocaleDateString('zh-HK')} 過期`
              : `DP20 package expired on ${expiry.toLocaleDateString('en-US')}`,
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }

        const dp20Result = await deductDP20Balance(selectedUser.id);

        if (!dp20Result.success) {
          toast({
            title: language === 'zh' ? '扣除 DP20 失敗' : 'DP20 Deduction Failed',
            description: dp20Result.error || (language === 'zh' ? '無法從用戶帳戶扣除 DP20' : 'Failed to deduct DP20 from user account'),
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }

        console.log('✅ DP20 deducted successfully');
      }
      // For 'cash' payment method, no deduction needed

      // Prepare purpose text (handle array of purposes + other purpose)
      let purposeText = '';
      if (Array.isArray(bookingData.purpose) && bookingData.purpose.length > 0) {
        purposeText = bookingData.purpose.join(', ');
        if (bookingData.otherPurpose) {
          purposeText += ': ' + bookingData.otherPurpose;
        }
      }

      const bookingPayload = {
        userId: selectedUser.id,
        roomId: selectedRoom.id,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        bookingType: bookingData.bookingType,
        paymentMethod: bookingData.paymentMethod,
        totalCost: totalCost,
        equipment: bookingData.equipment || [],
        purpose: purposeText,
        guests: bookingData.guests || 1,
        specialRequests: bookingData.specialRequests,
        notes: JSON.stringify({
          name: selectedUser.full_name || selectedUser.name,
          email: selectedUser.email,
          phone: selectedUser.phone,
          wantsProjector: bookingData.wantsProjector,
        }),
      };

      // Create booking via admin service
      const result = await bookingService.adminCreateBooking(bookingPayload, admin.id);

      if (result.success) {
        // Send confirmation email if requested
        if (sendEmail) {
          await emailService.sendBookingConfirmation({
            booking: result.booking,
            user: selectedUser,
            room: selectedRoom,
            language: language,
          });
        }

        toast({
          title: t.admin.bookingCreatedSuccess,
          description: t.admin.bookingCreatedDesc.replace('{name}', selectedUser.full_name || selectedUser.name),
        });

        // Notify parent component
        onBookingCreated(result.booking);

        // Reset form and close
        resetForm();
        onClose();
      } else {
        toast({
          title: language === 'zh' ? '建立失敗' : 'Creation Failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: language === 'zh' ? '發生錯誤' : 'Error Occurred',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedUser(null);
    setSelectedRoom(null);
    setBookingData({
      date: '',
      startTime: '',
      endTime: '',
      bookingType: 'hourly',
      paymentMethod: 'cash',
      guests: 1,
      purpose: [],
      otherPurpose: '',
      equipment: [],
      specialRequests: '',
      wantsProjector: false,
    });
    setSendEmail(true);
    setPurposeError(false);
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
        onInteractOutside={(e) => {
          // Prevent closing when clicking on Command/Popover content
          const target = e.target;
          if (
            target.closest('[role="listbox"]') ||
            target.closest('[data-radix-popper-content-wrapper]') ||
            target.closest('[cmdk-root]') ||
            target.closest('[data-radix-portal]')
          ) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-amber-800">
            {t.admin.createBookingTitle}
          </DialogTitle>
          <DialogDescription className="text-amber-600">
            {t.admin.bookingForUser}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* User Selection */}
          <div>
            <Label className="text-amber-800">{t.admin.selectUser} *</Label>
            <div className="space-y-2">
              {/* Search Input */}
              <Input
                type="text"
                placeholder={t.admin.searchUsers}
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="border-amber-200"
              />
              {/* User Select Dropdown */}
              <Select
                value={selectedUser?.id || ''}
                onValueChange={(value) => {
                  const user = users.find(u => u.id === value);
                  setSelectedUser(user);
                }}
              >
                <SelectTrigger className="border-amber-200">
                  <SelectValue placeholder={t.admin.selectUser}>
                    {selectedUser ? `${selectedUser.full_name || selectedUser.name} (${selectedUser.email})` : t.admin.selectUser}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {users
                    .filter((user) => {
                      if (!userSearchTerm) return true;
                      const searchLower = userSearchTerm.toLowerCase();
                      const name = (user.full_name || user.name || '').toLowerCase();
                      const email = (user.email || '').toLowerCase();
                      const phone = (user.phone || '').toLowerCase();
                      return name.includes(searchLower) || email.includes(searchLower) || phone.includes(searchLower);
                    })
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex flex-col">
                          <span className="font-semibold">{user.full_name || user.name}</span>
                          <span className="text-xs text-gray-500">
                            {user.email} {user.phone && `• ${user.phone}`}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  {users.filter((user) => {
                    if (!userSearchTerm) return true;
                    const searchLower = userSearchTerm.toLowerCase();
                    const name = (user.full_name || user.name || '').toLowerCase();
                    const email = (user.email || '').toLowerCase();
                    const phone = (user.phone || '').toLowerCase();
                    return name.includes(searchLower) || email.includes(searchLower) || phone.includes(searchLower);
                  }).length === 0 && (
                    <div className="py-6 text-center text-sm text-gray-500">
                      {t.admin.noUserFound}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Room Selection */}
          <div>
            <Label className="text-amber-800">{t.admin.selectRoom} *</Label>
            <Select value={selectedRoom?.id?.toString() || ''} onValueChange={(value) => {
              const room = rooms.find(r => r.id === parseInt(value));
              setSelectedRoom(room);
              setBookingData(prev => ({ ...prev, date: '', startTime: '', endTime: '' }));
            }}>
              <SelectTrigger className="border-amber-200">
                <SelectValue placeholder={t.admin.selectRoom} />
              </SelectTrigger>
              <SelectContent>
                {rooms.filter(r => !r.hidden).map((room) => (
                  <SelectItem key={room.id} value={room.id.toString()}>
                    {t.rooms.roomNames[room.name] || room.name} ({room.capacity} {t.rooms.guests})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div>
            <Label className="text-amber-800">{t.booking.date} *</Label>
            <Input
              type="date"
              value={bookingData.date}
              onChange={(e) => {
                const selectedDate = e.target.value;
                if (!availableDateStrings.includes(selectedDate)) {
                  alert(language === 'zh'
                    ? '此日期尚未開放預約，請選擇其他日期'
                    : 'This date is not open for booking. Please select another date.');
                  return;
                }
                setBookingData({ ...bookingData, date: selectedDate, startTime: '', endTime: '' });
              }}
              disabled={!selectedRoom}
              className="border-amber-200"
              min={new Date().toISOString().split('T')[0]}
              max={getMaxDate()}
            />
            {availableDateStrings.length === 0 && selectedRoom && (
              <p className="text-xs text-red-500 mt-1">
                {language === 'zh' ? '⚠️ 此房間目前沒有開放的日期' : '⚠️ No dates available for this room'}
              </p>
            )}
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-amber-800">{t.booking.startTime} *</Label>
              <Select
                value={bookingData.startTime}
                onValueChange={(value) => {
                  setBookingData({ ...bookingData, startTime: value, endTime: '' });
                  setTimeDurationError(false); // Clear error when time changes
                }}
              >
                <SelectTrigger disabled={!bookingData.date} className="border-amber-200">
                  <SelectValue placeholder={bookingData.date ? t.booking.selectTime : (language === 'zh' ? '請先選擇日期' : 'Select date first')} />
                </SelectTrigger>
                <SelectContent>
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
              <Label className="text-amber-800">{t.booking.endTime} *</Label>
              <Select
                value={bookingData.endTime}
                onValueChange={(value) => {
                  setBookingData({ ...bookingData, endTime: value });
                  setTimeDurationError(false); // Clear error when time changes
                }}
              >
                <SelectTrigger disabled={!bookingData.startTime} className="border-amber-200">
                  <SelectValue placeholder={bookingData.startTime ? t.booking.selectTime : (language === 'zh' ? '請先選擇開始時間' : 'Select start time first')} />
                </SelectTrigger>
                <SelectContent>
                  {endTimeOptions.map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Minimum duration error message */}
          {timeDurationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">
                {language === 'zh'
                  ? '⚠️ 最少預約時間為 1 小時'
                  : '⚠️ Minimum booking duration is 1 hour'}
              </p>
            </div>
          )}

          {/* Payment Method */}
          <div>
            <Label className="text-amber-800">{language === 'zh' ? '付款方式' : 'Payment Method'}</Label>
            <Select value={bookingData.paymentMethod} onValueChange={(value) => setBookingData({ ...bookingData, paymentMethod: value })}>
              <SelectTrigger className="border-amber-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">{t.booking.cash}</SelectItem>
                <SelectItem value="br15">BR15</SelectItem>
                <SelectItem value="br30">BR30</SelectItem>
                <SelectItem value="dp20">DP20</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Guests */}
          <div>
            <Label className="text-amber-800">{t.booking.guests}</Label>
            <Input
              type="number"
              min="1"
              max={selectedRoom?.capacity || 10}
              value={bookingData.guests}
              onChange={(e) => setBookingData({ ...bookingData, guests: parseInt(e.target.value) || 1 })}
              className="border-amber-200"
            />
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
                </div>
              </div>
            </div>
          )}

          {/* Purpose */}
          <div id="purpose-section">
            <Label className="text-amber-800">{t.booking.purpose} *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {businessPurposes.map((purpose, index) => (
                <div key={`${purpose}-${index}`} className="flex items-center space-x-2">
                  <Checkbox
                    id={`purpose-${purpose}-${index}`}
                    checked={Array.isArray(bookingData.purpose) && bookingData.purpose.includes(purpose)}
                    onCheckedChange={(checked) => handlePurposeChange(purpose, checked)}
                  />
                  <Label htmlFor={`purpose-${purpose}-${index}`} className="text-sm font-medium text-amber-700 cursor-pointer">
                    {t.booking.businessPurposes[purpose] || purpose}
                  </Label>
                </div>
              ))}
            </div>
            {purposeError && (
              <p className="text-red-500 text-sm mt-2">
                {language === 'zh' ? '請選擇至少一項業務性質' : 'Please select at least one purpose'}
              </p>
            )}
            {bookingData.purpose.includes("其他") && (
              <div className="mt-2">
                <Textarea
                  value={bookingData.otherPurpose || ''}
                  onChange={(e) => setBookingData({ ...bookingData, otherPurpose: e.target.value })}
                  placeholder={t.booking.otherPurposePlaceholder}
                  className="border-amber-200"
                />
              </div>
            )}
          </div>

          {/* Special Requests */}
          <div>
            <Label className="text-amber-800">{t.booking.specialRequests}</Label>
            <Textarea
              value={bookingData.specialRequests}
              onChange={(e) => setBookingData({ ...bookingData, specialRequests: e.target.value })}
              placeholder={t.admin.adminNote}
              className="border-amber-200"
            />
          </div>

          {/* Send Email Checkbox */}
          <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Checkbox
              id="send-email"
              checked={sendEmail}
              onCheckedChange={(checked) => setSendEmail(checked)}
            />
            <Label htmlFor="send-email" className="text-sm font-medium text-blue-800 cursor-pointer">
              {t.admin.sendConfirmationEmail}
            </Label>
          </div>

          {/* Price Display */}
          {bookingData.startTime && bookingData.endTime && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-amber-800">
                  {bookingData.paymentMethod === 'cash'
                    ? (language === 'zh' ? '總價:' : 'Total Price:')
                    : (language === 'zh' ? '需要:' : 'Required:')}
                </span>
                <span className="text-2xl font-bold text-amber-900">{getDisplayCost()}</span>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 items-center mt-6">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onClose(); }} className="w-full sm:w-auto border-amber-300 text-amber-700">
              {language === 'zh' ? '取消' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedUser || !selectedRoom || !bookingData.date || !bookingData.startTime || !bookingData.endTime}
              className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
            >
              {loading ? (language === 'zh' ? '建立中...' : 'Creating...') : t.admin.createBooking}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
