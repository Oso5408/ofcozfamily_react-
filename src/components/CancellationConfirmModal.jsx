import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import cancellationPolicyService from '@/services/cancellationPolicyService';
import { bookingService } from '@/services';
import { AlertTriangle, Clock, XCircle, CheckCircle2, Calendar, Info } from 'lucide-react';
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
  const [hoursBeforeBooking, setHoursBeforeBooking] = useState(0);
  const [policyCheck, setPolicyCheck] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);

  // Calculate hours and check policy when modal opens
  useEffect(() => {
    const loadPolicyInfo = async () => {
      if (!booking || !isOpen || !user) return;

      // Calculate hours before booking
      const hours = cancellationPolicyService.calculateHoursBeforeBooking(booking.start_time);
      setHoursBeforeBooking(hours);

      // Check if token should be deducted
      const check = await cancellationPolicyService.shouldDeductToken(user.id, hours);
      setPolicyCheck(check);

      // Get monthly cancellation stats
      const stats = await cancellationPolicyService.getUserMonthlyCancellations(user.id);
      setMonthlyStats(stats);

      console.log('📋 Policy check:', check);
      console.log('📊 Monthly stats:', stats);
    };

    if (isOpen && booking) {
      loadPolicyInfo();
      setReason('');
      setConfirmChecked(false);
    }
  }, [isOpen, booking, user]);

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
      const result = await bookingService.cancelBooking(
        booking.id,
        user.id,
        reason,
        policyCheck
      );

      if (!result.success) {
        if (result.insufficientTokens) {
          toast({
            title: t.cancellation.insufficientTokens,
            description: t.cancellation.insufficientTokensDesc.replace('{tokens}', user.tokens || 0),
            variant: 'destructive'
          });
        } else {
          toast({
            title: t.cancellation.cancelError,
            description: result.error,
            variant: 'destructive'
          });
        }
        return;
      }

      // Success
      toast({
        title: t.cancellation.cancelSuccess,
        description: result.tokenDeducted
          ? t.cancellation.cancelledWithToken
          : t.cancellation.cancelSuccessDesc
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

  const willDeductToken = policyCheck?.shouldDeduct || false;
  const freeCancellationsRemaining = policyCheck?.currentStats?.freeCancellationsRemaining || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-amber-800 flex items-center">
            <XCircle className="w-5 h-5 mr-2" />
            {t.cancellation.cancelTitle}
          </DialogTitle>
          <DialogDescription>
            {t.cancellation.cancelDesc}
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

          {/* Time Remaining */}
          <div className={`rounded-lg p-4 border-2 ${
            hoursBeforeBooking < 0 ? 'bg-red-50 border-red-300' :
            hoursBeforeBooking < 48 ? 'bg-yellow-50 border-yellow-300' :
            'bg-green-50 border-green-300'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                <span className="font-semibold">
                  {t.cancellation.hoursRemaining.replace('{hours}', Math.max(0, hoursBeforeBooking))}
                </span>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded ${
                hoursBeforeBooking >= 48 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {hoursBeforeBooking >= 48 ? t.cancellation.moreThan48h : t.cancellation.lessThan48h}
              </span>
            </div>
          </div>

          {/* Token Deduction Warning */}
          {willDeductToken ? (
            <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-orange-600 mr-2 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-orange-900">{t.cancellation.willDeductToken}</p>
                  <p className="text-sm text-orange-700 mt-1">
                    {policyCheck?.reason}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                <p className="font-semibold text-green-900">{t.cancellation.freeCancel}</p>
              </div>
            </div>
          )}

          {/* Monthly Cancellation Stats */}
          {monthlyStats && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                <Info className="w-4 h-4 mr-2" />
                {t.cancellation.monthlyStats}
              </h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>{t.cancellation.freeCancellationsUsed
                  .replace('{used}', monthlyStats.totalWithoutToken)
                  .replace('{total}', 3)}
                </p>
                <p>{t.cancellation.freeCancellationsRemaining
                  .replace('{remaining}', freeCancellationsRemaining)}
                </p>
              </div>
            </div>
          )}

          {/* Cancellation Policy */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">{t.cancellation.policyTitle}</h4>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              {t.cancellation.policyRules.map((rule, index) => (
                <li key={index}>{rule}</li>
              ))}
            </ul>
          </div>

          {/* Cancellation Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.cancellation.cancelReason}
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t.cancellation.reasonPlaceholder}
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
              {t.cancellation.confirmCheckbox}
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
                {t.cancellation.confirmCancel}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
