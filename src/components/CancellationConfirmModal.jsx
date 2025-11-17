import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { bookingService } from '@/services';
import { Clock, XCircle, Calendar } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

export const CancellationConfirmModal = ({ isOpen, onClose, booking, onCancelSuccess }) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const t = translations[language].booking;
  const { toast } = useToast();

  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [confirmChecked, setConfirmChecked] = useState(false);

  const handleCancel = async () => {
    if (!confirmChecked) {
      toast({
        title: t.cancellation.cancelError,
        description: t.cancellation.confirmCheckbox,
        variant: 'destructive'
      });
      return;
    }

    setCancelling(true);

    try {
      // Call cancelBooking with NO policy enforcement
      const result = await bookingService.cancelBooking(
        booking.id,
        user.id,
        reason
      );

      if (!result.success) {
        toast({
          title: t.cancellation.cancelError,
          description: result.error,
          variant: 'destructive'
        });
        return;
      }

      // Success - always FREE cancellation now
      toast({
        title: t.cancellation.cancelSuccess,
        description: language === 'zh'
          ? '預約已取消（免費）'
          : 'Booking cancelled (FREE - no charges)'
      });

      if (onCancelSuccess) {
        onCancelSuccess(result.booking);
      }

      onClose();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: t.cancellation.cancelError,
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setCancelling(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-amber-800 flex items-center">
            <XCircle className="w-5 h-5 mr-2" />
            {t.cancellation.cancelTitle}
          </DialogTitle>
          <DialogDescription>
            {language === 'zh'
              ? '您確定要取消此預約嗎？此操作無法撤銷。'
              : 'Are you sure you want to cancel this booking? This action cannot be undone.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Booking Details */}
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <h3 className="font-semibold text-amber-900 mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {language === 'zh' ? '預約詳情' : 'Booking Details'}
            </h3>
            <div className="text-sm text-amber-800 space-y-1">
              <p><strong>{language === 'zh' ? '房間：' : 'Room: '}</strong>
                {booking.rooms?.name || booking.room?.name || 'Unknown'}
              </p>
              <p><strong>{language === 'zh' ? '日期：' : 'Date: '}</strong>
                {new Date(booking.start_time).toLocaleDateString(language === 'zh' ? 'zh-HK' : 'en-US')}
              </p>
              <p><strong>{language === 'zh' ? '時間：' : 'Time: '}</strong>
                {new Date(booking.start_time).toLocaleTimeString(language === 'zh' ? 'zh-HK' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })} - {new Date(booking.end_time).toLocaleTimeString(language === 'zh' ? 'zh-HK' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          {/* FREE Cancellation Notice */}
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-semibold text-green-900">
                {language === 'zh' ? '✓ 免費取消 - 無需扣除代幣' : '✓ FREE Cancellation - No tokens deducted'}
              </p>
            </div>
          </div>

          {/* Cancellation Reason (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'zh' ? '取消原因（可選）' : 'Cancellation Reason (Optional)'}
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={language === 'zh' ? '請輸入取消原因...' : 'Enter reason for cancellation...'}
              className="min-h-[80px]"
            />
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="confirm-cancel"
              checked={confirmChecked}
              onCheckedChange={setConfirmChecked}
            />
            <label
              htmlFor="confirm-cancel"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {language === 'zh' ? '我確認要取消此預約' : 'I confirm I want to cancel this booking'}
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={cancelling}
          >
            {language === 'zh' ? '返回' : 'Back'}
          </Button>
          <Button
            onClick={handleCancel}
            disabled={cancelling || !confirmChecked}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {cancelling ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                {language === 'zh' ? '取消中...' : 'Cancelling...'}
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                {language === 'zh' ? '確認取消' : 'Confirm Cancellation'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
