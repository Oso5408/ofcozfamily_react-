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
import { blockedDatesService } from '@/services/blockedDatesService';
import { Calendar, Trash2, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

export const BlockedDatesTab = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();

  const [blockedDates, setBlockedDates] = useState([]);
  const [blockedDateObjects, setBlockedDateObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [pendingBlockDate, setPendingBlockDate] = useState(null);
  const [showUnblockDialog, setShowUnblockDialog] = useState(false);
  const [dateToUnblock, setDateToUnblock] = useState(null);
  const [bookingWarning, setBookingWarning] = useState(null);

  // Load blocked dates on mount
  useEffect(() => {
    loadBlockedDates();
  }, []);

  const loadBlockedDates = async () => {
    setLoading(true);
    const result = await blockedDatesService.getBlockedDates();

    if (result.success) {
      setBlockedDateObjects(result.dates);
      // Convert to Date objects for DayPicker
      const dateObjs = result.dates.map(d => new Date(d.blocked_date + 'T00:00:00'));
      setBlockedDates(dateObjs);
    } else {
      toast({
        title: language === 'zh' ? '載入失敗' : 'Load Failed',
        description: result.error,
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  const handleDateClick = async (date) => {
    if (!date) return;

    const dateString = formatDateToYYYYMMDD(date);

    // Check if date is already blocked
    const isBlocked = blockedDates.some(
      d => formatDateToYYYYMMDD(d) === dateString
    );

    if (isBlocked) {
      // Unblock date
      setDateToUnblock(dateString);
      setShowUnblockDialog(true);
    } else {
      // Check for existing bookings before blocking
      const bookingResult = await blockedDatesService.countBookingsOnDate(dateString);

      if (bookingResult.success && bookingResult.count > 0) {
        setBookingWarning({
          date: dateString,
          count: bookingResult.count
        });
      }

      // Show reason input
      setPendingBlockDate(dateString);
      setShowReasonInput(true);
    }
  };

  const confirmBlockDate = async () => {
    if (!pendingBlockDate) return;

    const result = await blockedDatesService.blockDate(pendingBlockDate, reason || null);

    if (result.success) {
      toast({
        title: t.admin.blockedDates.dateBlocked,
        description: `${pendingBlockDate} ${language === 'zh' ? '已被封鎖' : 'has been blocked'}`,
      });
      loadBlockedDates();
    } else {
      toast({
        title: language === 'zh' ? '操作失敗' : 'Operation Failed',
        description: result.error,
        variant: 'destructive'
      });
    }

    // Reset state
    setShowReasonInput(false);
    setPendingBlockDate(null);
    setReason('');
    setBookingWarning(null);
  };

  const cancelBlockDate = () => {
    setShowReasonInput(false);
    setPendingBlockDate(null);
    setReason('');
    setBookingWarning(null);
  };

  const confirmUnblockDate = async () => {
    if (!dateToUnblock) return;

    const result = await blockedDatesService.unblockDate(dateToUnblock);

    if (result.success) {
      toast({
        title: t.admin.blockedDates.dateUnblocked,
        description: `${dateToUnblock} ${language === 'zh' ? '已解除封鎖' : 'has been unblocked'}`,
      });
      loadBlockedDates();
    } else {
      toast({
        title: language === 'zh' ? '操作失敗' : 'Operation Failed',
        description: result.error,
        variant: 'destructive'
      });
    }

    setShowUnblockDialog(false);
    setDateToUnblock(null);
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

  // Custom CSS for blocked dates
  const modifiers = {
    blocked: blockedDates
  };

  const modifiersStyles = {
    blocked: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
      fontWeight: 'bold'
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t.admin.blockedDates.title}
          </CardTitle>
          <CardDescription>
            {t.admin.blockedDates.clickToToggle}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Calendar and List in 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar Picker */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {language === 'zh' ? '選擇日期' : 'Select Dates'}
            </CardTitle>
            <CardDescription>
              {language === 'zh'
                ? '點擊日期以封鎖或解除封鎖'
                : 'Click a date to block or unblock it'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <DayPicker
              mode="single"
              onDayClick={handleDateClick}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              fromDate={new Date()}
              disabled={{ before: new Date() }}
              className="rdp-custom"
            />
          </CardContent>
        </Card>

        {/* Blocked Dates List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t.admin.blockedDates.blockedDatesList}
            </CardTitle>
            <CardDescription>
              {blockedDateObjects.length} {language === 'zh' ? '個日期已被封鎖' : 'dates blocked'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">
                {language === 'zh' ? '載入中...' : 'Loading...'}
              </p>
            ) : blockedDateObjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t.admin.blockedDates.noBlockedDates}
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {blockedDateObjects.map((blockedDate) => (
                  <div
                    key={blockedDate.id}
                    className="flex items-start justify-between p-3 border rounded-lg bg-red-50 border-red-200"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-red-900">
                        {formatDateDisplay(blockedDate.blocked_date)}
                      </p>
                      {blockedDate.reason && (
                        <p className="text-sm text-red-700 mt-1">
                          {t.admin.blockedDates.reason}: {blockedDate.reason}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDateToUnblock(blockedDate.blocked_date);
                        setShowUnblockDialog(true);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
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
            ? '封鎖的日期將不會在用戶的預約日曆中顯示。已存在的預約將不受影響。'
            : 'Blocked dates will not appear in user booking calendars. Existing bookings will not be affected.'}
        </AlertDescription>
      </Alert>

      {/* Reason Input Dialog */}
      <AlertDialog open={showReasonInput} onOpenChange={setShowReasonInput}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'zh' ? '封鎖日期' : 'Block Date'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingBlockDate && formatDateDisplay(pendingBlockDate)}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {bookingWarning && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t.admin.blockedDates.warningExistingBookings.replace('{count}', bookingWarning.count)}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">{t.admin.blockedDates.addReason}</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={language === 'zh' ? '例如：公眾假期、維修等' : 'e.g., Public holiday, Maintenance'}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelBlockDate}>
              {language === 'zh' ? '取消' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmBlockDate}>
              {language === 'zh' ? '確認封鎖' : 'Confirm Block'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unblock Confirmation Dialog */}
      <AlertDialog open={showUnblockDialog} onOpenChange={setShowUnblockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.admin.blockedDates.confirmUnblock}</AlertDialogTitle>
            <AlertDialogDescription>
              {dateToUnblock && formatDateDisplay(dateToUnblock)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUnblockDialog(false)}>
              {language === 'zh' ? '取消' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmUnblockDate}>
              {language === 'zh' ? '確認解除' : 'Confirm Unblock'}
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
