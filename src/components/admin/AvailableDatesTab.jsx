import React, { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { availableDatesService } from '@/services/availableDatesService';
import { roomService } from '@/services/roomService';
import { Calendar, Trash2, AlertCircle, Info, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const AvailableDatesTab = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();

  const [availableDates, setAvailableDates] = useState([]);
  const [availableDateObjects, setAvailableDateObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);

  // Date range selection
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('all'); // 'all' or room ID

  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [dateToClose, setDateToClose] = useState(null);
  const [bookingWarning, setBookingWarning] = useState(null);

  // Load available dates and rooms on mount
  useEffect(() => {
    loadAvailableDates();
    loadRooms();
  }, []);

  const loadRooms = async () => {
    const result = await roomService.getRooms(true); // Include hidden rooms for admin
    if (result.success) {
      setRooms(result.rooms);
    }
  };

  const loadAvailableDates = async () => {
    setLoading(true);
    const result = await availableDatesService.getAvailableDates();

    if (result.success) {
      setAvailableDateObjects(result.dates);
      // Convert to Date objects for DayPicker
      const dateObjs = result.dates.map(d => new Date(d.available_date + 'T00:00:00'));
      setAvailableDates(dateObjs);
    } else {
      toast({
        title: language === 'zh' ? '載入失敗' : 'Load Failed',
        description: result.error,
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  const handleOpenDateRange = async () => {
    if (!startDate || !endDate) {
      toast({
        title: language === 'zh' ? '請選擇日期' : 'Select Dates',
        description: language === 'zh' ? '請選擇開始和結束日期' : 'Please select start and end dates',
        variant: 'destructive'
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast({
        title: language === 'zh' ? '日期錯誤' : 'Invalid Dates',
        description: language === 'zh' ? '開始日期必須早於結束日期' : 'Start date must be before end date',
        variant: 'destructive'
      });
      return;
    }

    // Convert 'all' to null for the service
    const roomId = selectedRoomId === 'all' ? null : parseInt(selectedRoomId);
    const result = await availableDatesService.openDateRange(startDate, endDate, null, roomId);

    if (result.success) {
      const roomName = roomId ? rooms.find(r => r.id === roomId)?.name : (language === 'zh' ? '所有房間' : 'All Rooms');
      toast({
        title: language === 'zh' ? '日期已開放' : 'Dates Opened',
        description: `${language === 'zh' ? '已為' : 'Opened'} ${roomName} ${language === 'zh' ? '開放' : ''} ${result.count} ${language === 'zh' ? '個日期' : 'dates'}`,
      });
      loadAvailableDates();
      // Reset form
      setStartDate('');
      setEndDate('');
      setSelectedRoomId('all');
    } else {
      toast({
        title: language === 'zh' ? '操作失敗' : 'Operation Failed',
        description: result.error,
        variant: 'destructive'
      });
    }
  };

  const handleDateClick = async (date) => {
    if (!date) return;

    const dateString = formatDateToYYYYMMDD(date);

    // Check if date is already available
    const isAvailable = availableDates.some(
      d => formatDateToYYYYMMDD(d) === dateString
    );

    if (isAvailable) {
      // Close date (with warning if bookings exist)
      const bookingResult = await availableDatesService.countBookingsOnDate(dateString);

      if (bookingResult.success && bookingResult.count > 0) {
        setBookingWarning({
          date: dateString,
          count: bookingResult.count
        });
      }

      setDateToClose(dateString);
      setShowCloseDialog(true);
    } else {
      // Open single date
      const result = await availableDatesService.openDate(dateString, null);

      if (result.success) {
        toast({
          title: language === 'zh' ? '日期已開放' : 'Date Opened',
          description: `${dateString} ${language === 'zh' ? '現在可供預約' : 'is now available for booking'}`,
        });
        loadAvailableDates();
      } else {
        toast({
          title: language === 'zh' ? '操作失敗' : 'Operation Failed',
          description: result.error,
          variant: 'destructive'
        });
      }
    }
  };

  const confirmCloseDate = async () => {
    if (!dateToClose) return;

    const result = await availableDatesService.closeDate(dateToClose);

    if (result.success) {
      toast({
        title: language === 'zh' ? '日期已關閉' : 'Date Closed',
        description: `${dateToClose} ${language === 'zh' ? '已不再接受預約' : 'is no longer available for booking'}`,
      });
      loadAvailableDates();
    } else {
      toast({
        title: language === 'zh' ? '操作失敗' : 'Operation Failed',
        description: result.error,
        variant: 'destructive'
      });
    }

    setShowCloseDialog(false);
    setDateToClose(null);
    setBookingWarning(null);
  };

  const formatDateToYYYYMMDD = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateDisplay = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return language === 'zh'
      ? date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
      : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Custom CSS for available dates
  const modifiers = {
    available: availableDates
  };

  const modifiersStyles = {
    available: {
      backgroundColor: '#dcfce7',
      color: '#166534',
      fontWeight: 'bold'
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t.admin.availableDates.title}
          </CardTitle>
          <CardDescription>
            {t.admin.availableDates.description}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {language === 'zh' ? '開放日期區間' : 'Open Date Range'}
          </CardTitle>
          <CardDescription>
            {language === 'zh' ? '選擇開始和結束日期以開放預約' : 'Select start and end dates to open for booking'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">{language === 'zh' ? '開始日期' : 'Start Date'}</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label htmlFor="endDate">{language === 'zh' ? '結束日期' : 'End Date'}</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="roomSelector">{language === 'zh' ? '選擇房間' : 'Select Room'}</Label>
            <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
              <SelectTrigger id="roomSelector">
                <SelectValue placeholder={language === 'zh' ? '選擇房間' : 'Select Room'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="font-semibold text-yellow-700">
                    {language === 'zh' ? '所有房間' : 'All Rooms'}
                  </span>
                </SelectItem>
                {rooms.map(room => (
                  <SelectItem key={room.id} value={room.id.toString()}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'zh'
                ? '選擇「所有房間」將為所有房間開放此日期區間'
                : 'Select "All Rooms" to open dates for all rooms'}
            </p>
          </div>
          <Button onClick={handleOpenDateRange} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            {language === 'zh' ? '開放此日期區間' : 'Open This Date Range'}
          </Button>
        </CardContent>
      </Card>

      {/* Calendar and List in 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar Picker */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {language === 'zh' ? '日曆總覽' : 'Calendar Overview'}
            </CardTitle>
            <CardDescription>
              {language === 'zh'
                ? '綠色日期為已開放，點擊可關閉'
                : 'Green dates are open, click to close'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <DayPicker
              mode="single"
              onDayClick={handleDateClick}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              fromDate={today}
              className="rdp-custom"
            />
          </CardContent>
        </Card>

        {/* Available Dates List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t.admin.availableDates.availableDatesList}
            </CardTitle>
            <CardDescription>
              {availableDateObjects.length} {language === 'zh' ? '個日期已開放' : 'dates open'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">
                {language === 'zh' ? '載入中...' : 'Loading...'}
              </p>
            ) : availableDateObjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t.admin.availableDates.noAvailableDates}
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableDateObjects.map((availableDate) => {
                  const room = availableDate.room_id
                    ? rooms.find(r => r.id === availableDate.room_id)
                    : null;
                  const roomName = room ? room.name : (language === 'zh' ? '所有房間' : 'All Rooms');
                  const isAllRooms = !availableDate.room_id;

                  return (
                    <div
                      key={availableDate.id}
                      className="flex items-start justify-between p-3 border rounded-lg bg-green-50 border-green-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-green-900">
                            {formatDateDisplay(availableDate.available_date)}
                          </p>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-semibold ${
                              isAllRooms
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {roomName}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDateToClose(availableDate.available_date);
                          setShowCloseDialog(true);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {language === 'zh'
            ? '⚠️ 重要：預設情況下，所有日期都是關閉的。只有在此列表中的日期才能被用戶預約。'
            : '⚠️ Important: By default, all dates are closed. Only dates in this list can be booked by users.'}
        </AlertDescription>
      </Alert>

      {/* Close Confirmation Dialog */}
      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'zh' ? '關閉此日期？' : 'Close This Date?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dateToClose && formatDateDisplay(dateToClose)}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {bookingWarning && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {language === 'zh'
                  ? `警告：此日期已有 ${bookingWarning.count} 個預約。關閉後用戶將無法預約此日期，但現有預約不受影響。`
                  : `Warning: ${bookingWarning.count} booking(s) exist on this date. Closing will prevent new bookings, but existing ones remain valid.`}
              </AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowCloseDialog(false);
              setBookingWarning(null);
            }}>
              {language === 'zh' ? '取消' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmCloseDate}>
              {language === 'zh' ? '確認關閉' : 'Confirm Close'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Custom CSS for calendar */}
      <style jsx global>{`
        .rdp-custom {
          --rdp-cell-size: 40px;
        }
        .rdp-custom .rdp-day {
          cursor: pointer;
        }
        .rdp-custom .rdp-day:hover:not(.rdp-day_disabled) {
          background-color: #f3f4f6;
        }
      `}</style>
    </div>
  );
};
