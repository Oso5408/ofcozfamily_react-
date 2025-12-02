import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from "@/components/ui/checkbox";
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { Upload, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateTimeOptions, generateEndTimeOptions } from '@/lib/timeUtils';

export const MultiStepBookingForm = ({
  selectedRoom,
  bookingData,
  setBookingData,
  onSubmit,
  onClose,
  businessPurposes,
  handlePurposeChange,
  showOtherPurposeInput,
  purposeError,
  totalPrice,
  user,
}) => {
  const { language } = useLanguage();
  const t = translations[language];
  const [currentStep, setCurrentStep] = useState(1);
  const [receiptImage, setReceiptImage] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [timeOptions, setTimeOptions] = useState([]);
  const [endTimeOptions, setEndTimeOptions] = useState([]);
  const [loadingEndTimes, setLoadingEndTimes] = useState(false);
  const [useAccountInfo, setUseAccountInfo] = useState(false);
  const [timeDurationError, setTimeDurationError] = useState(false);

  // Check if this is Day Pass (always daily rental, no tabs needed)
  const isDayPass = selectedRoom?.id === 9;

  // Check if using DP20 payment (no receipt upload needed)
  const isDP20 = bookingData.bookingType === 'dp20';

  // Check if using cash payment
  const isCash = bookingData.bookingType === 'cash';

  // Dynamic steps:
  // - DP20: 2 steps (Booking Details, Confirm Booking)
  // - Cash: 1 step (Booking Details only - payment & receipt moved to dashboard)
  const steps = isDP20
    ? [
        { label: language === 'zh' ? '預約詳情' : 'Booking Details' },
        { label: language === 'zh' ? '確認預約' : 'Confirm Booking' },
      ]
    : isCash
    ? [
        { label: language === 'zh' ? '預約詳情' : 'Booking Details' },
      ]
    : [
        { label: language === 'zh' ? '預約詳情' : 'Booking Details' },
        { label: language === 'zh' ? '付款方式' : 'Payment Method' },
        { label: language === 'zh' ? '上傳收據' : 'Upload Receipt' },
      ];

  const maxSteps = steps.length;

  // Handle auto-fill when checkbox changes
  useEffect(() => {
    if (useAccountInfo && user) {
      setBookingData(prev => ({
        ...prev,
        name: user.name || user.full_name || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
    } else if (!useAccountInfo) {
      // When unchecked, clear the fields
      setBookingData(prev => ({
        ...prev,
        name: '',
        email: '',
        phone: ''
      }));
    }
  }, [useAccountInfo, user, setBookingData]);

  // Fetch available time slots when date or room changes
  useEffect(() => {
    const fetchTimeOptions = async () => {
      if (!bookingData.date || !selectedRoom?.id) {
        setTimeOptions([]);
        return;
      }

      try {
        const options = await generateTimeOptions(bookingData.date, selectedRoom.id);
        setTimeOptions(options);
      } catch (error) {
        console.error('Error fetching time options:', error);
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

  const handleNext = () => {
    if (currentStep < maxSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReceiptUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
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

  const validateStep1 = () => {
    if (!bookingData.name || !bookingData.email || !bookingData.phone || !bookingData.date) {
      return false;
    }

    // Validate time selection (hourly only)
    if (!bookingData.startTime || !bookingData.endTime) {
      return false;
    }

    // Validate minimum 1 hour duration (60 minutes)
    const duration = calculateDurationInMinutes(bookingData.startTime, bookingData.endTime);
    if (duration < 60) {
      setTimeDurationError(true);
      return false;
    }
    setTimeDurationError(false);

    if (!Array.isArray(bookingData.purpose) || bookingData.purpose.length === 0) {
      return false;
    }

    // Validate equipment selection (required - at least one equipment must be selected)
    if (!bookingData.equipment || bookingData.equipment.length === 0) {
      return false;
    }

    // Validate equipment quantities (must have valid quantity > 0 for all selected items)
    const hasInvalidQuantity = bookingData.equipment.some(item => {
      const qty = item.quantity || item.amount || 0;
      return qty <= 0 || qty === null || qty === undefined;
    });

    if (hasInvalidQuantity) {
      return false;
    }

    // specialRequests is now optional, no validation needed
    return true;
  };

  const handleMonthlyInquiry = () => {
    const message = language === 'zh'
      ? `你好，我想查詢月租服務。`
      : `Hi, I'd like to inquire about monthly rental.`;
    const whatsappUrl = `https://web.whatsapp.com/send/?phone=85266238788&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
    window.open(whatsappUrl, '_blank');
  };

  // Step 1: Booking Details
  const renderStep1 = () => (
    <div className="space-y-4">
      {/* Rental Type Selection */}
      <Tabs
        value={isDayPass ? 'hourly' : (bookingData.rentalType || 'hourly')}
        onValueChange={(val) => setBookingData(prev => ({
          ...prev,
          rentalType: val,
          // Preserve Day Pass fixed times, reset for other rooms
          startTime: isDayPass ? '10:00' : '',
          endTime: isDayPass ? '18:30' : ''
        }))}
        className="w-full"
      >
        {/* Hide rental type tabs for Day Pass (always daily) */}
        {!isDayPass && (
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hourly">{t.booking.hourly}</TabsTrigger>
            <TabsTrigger value="monthly">{t.booking.monthly}</TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="monthly" className="pt-4">
          <Card className="p-6 bg-amber-50 border-amber-200">
            <h4 className="font-semibold text-amber-800 mb-3">
              {language === 'zh' ? '月租服務' : 'Monthly Rental Service'}
            </h4>
            <p className="text-sm text-amber-700 mb-4">
              {language === 'zh'
                ? '月租服務請直接透過 WhatsApp 聯絡我們查詢，我們會為您提供詳細資訊及報價。'
                : 'For monthly rentals, please contact us directly via WhatsApp. We will provide detailed information and pricing.'}
            </p>
            <Button
              type="button"
              onClick={handleMonthlyInquiry}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            >
              {t.booking.contactUs}
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="hourly" className="pt-4">
          <div className="space-y-4">
            {/* Payment Method Selection for Day Pass (Cash or DP20) */}
            {isDayPass && selectedRoom?.bookingOptions.includes('dp20') && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-amber-200 mb-4">
                <h4 className="text-amber-800 font-semibold mb-3">{language === 'zh' ? '付款方式' : 'Payment Method'}</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBookingData(prev => ({ ...prev, bookingType: 'cash' }))}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      bookingData.bookingType === 'cash'
                        ? 'border-amber-500 bg-amber-100'
                        : 'border-gray-300 bg-white hover:border-amber-300'
                    }`}
                  >
                    <div className="text-sm font-semibold text-amber-700">
                      {t.booking.cash}
                    </div>
                    <div className="text-xs mt-1 text-gray-600">
                      {language === 'zh' ? '網上支付' : 'Online Payment'}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingData(prev => ({ ...prev, bookingType: 'dp20' }))}
                    disabled={user && (user.dp20_balance || 0) === 0}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      bookingData.bookingType === 'dp20'
                        ? 'border-green-500 bg-green-100'
                        : (user && (user.dp20_balance || 0) === 0)
                        ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                        : 'border-gray-300 bg-white hover:border-green-300'
                    }`}
                  >
                    <div className={`text-sm font-semibold ${(user && (user.dp20_balance || 0) === 0) ? 'text-gray-400' : 'text-green-700'}`}>
                      {t.booking.dp20Package}
                    </div>
                    <div className={`text-xs mt-1 ${(user && (user.dp20_balance || 0) === 0) ? 'text-gray-400' : 'text-gray-600'}`}>
                      {user
                        ? `${language === 'zh' ? 'DP20餘額' : 'DP20 Balance'}: ${user.dp20_balance || 0}`
                        : (language === 'zh' ? '套票' : 'Package')}
                    </div>
                    {user && (user.dp20_balance || 0) === 0 && (
                      <div className="text-xs text-red-400 mt-1">{language === 'zh' ? '無餘額' : 'No balance'}</div>
                    )}
                  </button>
                </div>
              </div>
            )}

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

            <div>
              <Label htmlFor="name" className="text-amber-800">{t.booking.fullName}</Label>
              <Input
                id="name"
                value={bookingData.name}
                onChange={(e) => setBookingData({ ...bookingData, name: e.target.value })}
                className="border-amber-200 focus:border-amber-400"
              />
            </div>

      <div>
        <Label htmlFor="email" className="text-amber-800">{t.booking.email}</Label>
        <Input
          id="email"
          type="email"
          value={bookingData.email}
          onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
          className="border-amber-200 focus:border-amber-400"
        />
      </div>

      <div>
        <Label htmlFor="phone" className="text-amber-800">{t.booking.phone}</Label>
        <Input
          id="phone"
          required
          value={bookingData.phone}
          onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
          className="border-amber-200 focus:border-amber-400"
        />
      </div>

      <div>
        <Label className="text-amber-800">{t.booking.date}</Label>
        <Input
          type="date"
          value={bookingData.date || ''}
          onChange={(e) => setBookingData({
            ...bookingData,
            date: e.target.value,
            // Preserve Day Pass fixed times, reset for other rooms
            startTime: isDayPass ? '10:00' : '',
            endTime: isDayPass ? '18:30' : ''
          })}
          className="border-amber-200 focus:border-amber-400"
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      {/* Time Selection: Show fixed hours for Day Pass, dropdowns for other rooms */}
      {isDayPass ? (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2 text-center">
            {language === 'zh' ? 'Day Pass 使用時段' : 'Day Pass Time Slot'}
          </h4>
          <div className="text-center py-3">
            <p className="text-3xl font-bold text-blue-800">10:00 AM - 6:30 PM</p>
            <p className="text-sm text-blue-600 mt-2">
              {language === 'zh' ? '固定時段，無需選擇' : 'Fixed hours, no selection needed'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-amber-800">{t.booking.startTime}</Label>
          <Select
            value={bookingData.startTime || ''}
            onValueChange={(value) => {
              setBookingData({ ...bookingData, startTime: value, endTime: '' });
              setTimeDurationError(false); // Clear error when time changes
            }}
          >
            <SelectTrigger disabled={!bookingData.date}>
              <SelectValue placeholder={bookingData.date ? t.booking.selectTime : (language === 'zh' ? '請先選擇日期' : 'Please select date first')} />
            </SelectTrigger>
            <SelectContent position="popper">
              {timeOptions.filter(time => parseInt(time.split(':')[0]) < 22).map(time => (
                <SelectItem key={time} value={time}>{time}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-amber-800">{t.booking.endTime}</Label>
          <Select value={bookingData.endTime || ''} onValueChange={(value) => {
            setBookingData({ ...bookingData, endTime: value });
            setTimeDurationError(false); // Clear error when time changes
          }}>
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
      )}

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

      <div>
        <Label htmlFor="guests" className="text-amber-800">{t.booking.guests}</Label>
        <Input
          id="guests"
          type="number"
          min="1"
          max={selectedRoom?.capacity}
          value={bookingData.guests}
          onChange={(e) => setBookingData({ ...bookingData, guests: parseInt(e.target.value) || 1 })}
          className="border-amber-200 focus:border-amber-400"
        />
      </div>

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
        {showOtherPurposeInput && (
          <div className="mt-2">
            <Textarea
              id="other-purpose"
              value={bookingData.otherPurpose || ''}
              onChange={(e) => setBookingData({ ...bookingData, otherPurpose: e.target.value })}
              placeholder={t.booking.otherPurposePlaceholder}
              className="border-amber-200 focus:border-amber-400"
            />
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
                      // Add equipment with no default quantity (null - user will type)
                      const newEquipment = [...(bookingData.equipment || []), { type: key, quantity: null }];
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
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const currentQty = equipmentItem?.quantity || 0;
                        const newQuantity = Math.max(1, currentQty - 1);
                        const newEquipment = (bookingData.equipment || []).map(item =>
                          item.type === key ? { ...item, quantity: newQuantity } : item
                        );
                        setBookingData({ ...bookingData, equipment: newEquipment });
                      }}
                      className="h-8 w-8 p-0 border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      −
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={equipmentItem?.quantity || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const newQuantity = value === '' ? null : parseInt(value);
                        const newEquipment = (bookingData.equipment || []).map(item =>
                          item.type === key ? { ...item, quantity: newQuantity } : item
                        );
                        setBookingData({ ...bookingData, equipment: newEquipment });
                      }}
                      placeholder="1"
                      className="w-16 text-center border-amber-200 focus:border-amber-400"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const currentQty = equipmentItem?.quantity || 0;
                        const newQuantity = Math.min(50, currentQty + 1);
                        const newEquipment = (bookingData.equipment || []).map(item =>
                          item.type === key ? { ...item, quantity: newQuantity } : item
                        );
                        setBookingData({ ...bookingData, equipment: newEquipment });
                      }}
                      className="h-8 w-8 p-0 border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      +
                    </Button>
                  </div>
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

            {/* Only show total price for cash payments, not for DP20 */}
            {totalPrice > 0 && !isDP20 && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-blue-700 font-bold">{t.booking.totalPrice.replace('{total}', totalPrice)}</span>
                </div>
              </div>
            )}

            {/* New workflow reminder for cash payments */}
            {bookingData.bookingType === 'cash' && (
              <div className="p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
                <p className="text-sm text-amber-800 font-medium">
                  {language === 'zh'
                    ? '💡 提交預約後，請前往「我的預約」查看付款方式及上傳收據。'
                    : '💡 After submitting, go to "My Bookings" to view payment instructions and upload receipt.'}
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  // Step 2: Payment Information
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-amber-800 mb-4">
          {language === 'zh' ? '付款方式' : 'Payment Method'}
        </h3>
        <p className="text-amber-700 mb-6">
          {language === 'zh' ? '請使用以下方式付款' : 'Please pay using one of the following methods'}
        </p>
      </div>

      <Card className="p-6 bg-white border-2 border-amber-200">
        <div className="text-center mb-6">
          <h4 className="text-xl font-bold text-amber-900 mb-4">Ofcoz Family Limited</h4>
          <img
            src="/payment-qr.jpeg"
            alt="FPS QR Code"
            className="mx-auto w-64 h-64 object-contain mb-4"
          />
          <p className="text-lg font-semibold text-amber-800 mb-2">
            {language === 'zh' ? '掃描此 PayCode 以使用 FPS' : 'Scan my PayCode to FPS'}
          </p>
        </div>

        <div className="space-y-4 text-left">
          <div className="border-t border-amber-200 pt-4">
            <h5 className="font-bold text-amber-900 mb-3">
              {language === 'zh' ? '1）恒生銀行' : '1) Hang Seng Bank'}
            </h5>
            <p className="text-amber-800 font-mono text-lg">244-883757-883</p>
          </div>

          <div className="border-t border-amber-200 pt-4">
            <h5 className="font-bold text-amber-900 mb-3">
              {language === 'zh' ? '2）轉數快 FPS' : '2) FPS (Faster Payment System)'}
            </h5>
            <p className="text-amber-800 mb-1">
              {language === 'zh' ? '恒生銀行' : 'Hang Seng Bank'}
            </p>
            <p className="text-amber-800 font-mono text-lg">6623 8788</p>
          </div>
        </div>
      </Card>

      <div className="bg-amber-50 p-4 rounded-lg">
        <p className="text-amber-800 font-semibold">
          {language === 'zh' ? '總金額：' : 'Total Amount: '}
          <span className="text-2xl">HK${totalPrice}</span>
        </p>
      </div>
    </div>
  );

  // Step 2 for DP20: Show DP20 balance and confirmation
  const renderStep2DP20 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-amber-800 mb-4">
          {language === 'zh' ? '確認預約' : 'Confirm Booking'}
        </h3>
        <p className="text-amber-700 mb-6">
          {language === 'zh' ? '請確認您的預約詳情' : 'Please confirm your booking details'}
        </p>
      </div>

      {/* DP20 Balance Display */}
      {user && !user.isAdmin && (
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

          {/* DP20 Cost Info */}
          <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <span className="text-green-700 font-medium">{t.booking.dp20Required}</span>
              <span className="text-sm text-gray-600">{language === 'zh' ? '(10:00-18:30)' : '(10:00 AM - 6:30 PM)'}</span>
            </div>
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
            </div>
          )}
          {user.dp20_expiry && new Date(user.dp20_expiry) < new Date() && (
            <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-700 font-medium">
                {t.booking.dp20Expired}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Booking Summary */}
      <Card className="p-6 bg-white border-2 border-amber-200">
        <h4 className="text-xl font-bold text-amber-900 mb-4">
          {language === 'zh' ? '預約摘要' : 'Booking Summary'}
        </h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">{language === 'zh' ? '房間:' : 'Room:'}</span>
            <span className="font-semibold">{t.rooms.roomNames[selectedRoom.name]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{language === 'zh' ? '日期:' : 'Date:'}</span>
            <span className="font-semibold">{bookingData.date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{language === 'zh' ? '時段:' : 'Time:'}</span>
            <span className="font-semibold">10:00 AM - 6:30 PM</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{language === 'zh' ? '付款方式:' : 'Payment:'}</span>
            <span className="font-semibold text-green-700">DP20 {language === 'zh' ? '套票' : 'Package'}</span>
          </div>
        </div>
      </Card>

      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <p className="text-green-800 font-semibold text-center">
          {language === 'zh'
            ? '確認後將扣除 1 次 DP20 使用次數'
            : '1 DP20 visit will be deducted upon confirmation'}
        </p>
      </div>
    </div>
  );

  // Step 3: Upload Receipt
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-amber-800 mb-4">
          {language === 'zh' ? '上傳付款證明' : 'Upload Payment Receipt'}
        </h3>
        <p className="text-amber-700 mb-6">
          {language === 'zh'
            ? '請上傳付款收據或截圖作為付款證明'
            : 'Please upload your payment receipt or screenshot as proof'}
        </p>
      </div>

      <div className="border-2 border-dashed border-amber-300 rounded-lg p-8 text-center">
        <input
          type="file"
          id="receipt-upload"
          accept="image/*"
          onChange={handleReceiptUpload}
          className="hidden"
        />
        <label htmlFor="receipt-upload" className="cursor-pointer">
          {receiptPreview ? (
            <div className="space-y-4">
              <img
                src={receiptPreview}
                alt="Receipt Preview"
                className="mx-auto max-h-64 rounded-lg"
              />
              <div className="flex items-center justify-center text-green-600">
                <Check className="w-6 h-6 mr-2" />
                <span className="font-semibold">
                  {language === 'zh' ? '已上傳' : 'Uploaded'}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setReceiptImage(null);
                  setReceiptPreview(null);
                }}
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                {language === 'zh' ? '更換圖片' : 'Change Image'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-16 h-16 mx-auto text-amber-500" />
              <p className="text-amber-800 font-semibold">
                {language === 'zh' ? '點擊上傳收據' : 'Click to Upload Receipt'}
              </p>
              <p className="text-sm text-amber-600">
                {language === 'zh' ? '支援 JPG、PNG 格式' : 'Supports JPG, PNG format'}
              </p>
            </div>
          )}
        </label>
      </div>

      <div className="bg-amber-50 p-4 rounded-lg">
        <p className="text-sm text-amber-700">
          {language === 'zh'
            ? '提示：請確保收據清晰可見，包含交易日期、金額及參考編號。'
            : 'Note: Please ensure the receipt is clear and shows the transaction date, amount, and reference number.'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <ProgressBar currentStep={currentStep} steps={steps} />

      <div className="min-h-[500px]">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && !isCash && (isDP20 ? renderStep2DP20() : renderStep2())}
        {currentStep === 3 && !isDP20 && !isCash && renderStep3()}
      </div>

      <div className="flex justify-between pt-6 border-t border-amber-200">
        {currentStep === 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'zh' ? '返回' : 'Back'}
          </Button>
        )}
        {currentStep > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'zh' ? '上一步' : 'Previous'}
          </Button>
        )}

        {currentStep < maxSteps ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={currentStep === 1 && !validateStep1()}
            className="ml-auto bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
          >
            {language === 'zh' ? '下一步' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={(e) => {
              // For cash (new workflow): no receipt needed at booking time
              // For DP20: no receipt needed
              // For old workflow (non-cash, non-DP20): attach receipt image
              if (!isDP20 && !isCash) {
                setBookingData(prev => ({ ...prev, receiptImage: receiptImage }));
              }
              onSubmit(e);
            }}
            disabled={!isDP20 && !isCash && !receiptImage}
            className="ml-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
          >
            {isCash
              ? (language === 'zh' ? '提交預約' : 'Submit Booking')
              : (language === 'zh' ? '確認預約' : 'Confirm Booking')}
          </Button>
        )}
      </div>
    </div>
  );
};
