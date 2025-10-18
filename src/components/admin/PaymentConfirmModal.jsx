import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { DollarSign, Calendar, Clock, User, Mail, Phone, Users, MapPin } from 'lucide-react';
import { format } from 'date-fns';

export const PaymentConfirmModal = ({ isOpen, onClose, booking, onConfirm, isLoading }) => {
  const { language } = useLanguage();
  const [adminNotes, setAdminNotes] = useState('');

  if (!booking) return null;

  // Parse booking notes to get customer details
  let bookingDetails = {};
  try {
    bookingDetails = booking.notes ? JSON.parse(booking.notes) : {};
  } catch (e) {
    console.error('Error parsing booking notes:', e);
  }

  const handleConfirm = () => {
    onConfirm(adminNotes);
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (dateString) => {
    try {
      return format(new Date(dateString), 'HH:mm');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-amber-800">
            {language === 'zh' ? '確認收到付款' : 'Confirm Payment Received'}
          </DialogTitle>
          <DialogDescription>
            {language === 'zh'
              ? '請確認您已收到此預約的現金付款。此操作將把預約狀態更新為已確認。'
              : 'Please confirm that you have received cash payment for this booking. This will update the booking status to confirmed.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Amount to Collect */}
          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100">
              <DollarSign className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-amber-700">
                {language === 'zh' ? '應收金額' : 'Amount to Collect'}
              </p>
              <p className="text-2xl font-bold text-amber-900">
                ${booking.total_cost || '0.00'}
              </p>
              <p className="text-xs text-amber-600">
                {booking.payment_method === 'cash'
                  ? (language === 'zh' ? '現金付款' : 'Cash Payment')
                  : (language === 'zh' ? 'Token付款' : 'Token Payment')}
              </p>
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-2 border-t pt-4">
            <h4 className="font-semibold text-amber-800 mb-3">
              {language === 'zh' ? '預約詳情' : 'Booking Details'}
            </h4>

            <div className="grid gap-2">
              {/* Room */}
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{language === 'zh' ? '房間：' : 'Room:'}</span>
                <span className="font-medium">{booking.rooms?.name || 'N/A'}</span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{language === 'zh' ? '日期：' : 'Date:'}</span>
                <span className="font-medium">{formatDate(booking.start_time)}</span>
              </div>

              {/* Time */}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{language === 'zh' ? '時間：' : 'Time:'}</span>
                <span className="font-medium">
                  {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                </span>
              </div>

              {/* Customer Name */}
              {bookingDetails.name && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{language === 'zh' ? '客戶：' : 'Customer:'}</span>
                  <span className="font-medium">{bookingDetails.name}</span>
                </div>
              )}

              {/* Email */}
              {bookingDetails.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{language === 'zh' ? '電郵：' : 'Email:'}</span>
                  <span className="font-medium text-xs">{bookingDetails.email}</span>
                </div>
              )}

              {/* Phone */}
              {bookingDetails.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{language === 'zh' ? '電話：' : 'Phone:'}</span>
                  <span className="font-medium">{bookingDetails.phone}</span>
                </div>
              )}

              {/* Guests */}
              {bookingDetails.guests && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{language === 'zh' ? '人數：' : 'Guests:'}</span>
                  <span className="font-medium">{bookingDetails.guests}</span>
                </div>
              )}
            </div>
          </div>

          {/* Admin Notes */}
          <div className="space-y-2">
            <Label htmlFor="admin-notes" className="text-amber-800">
              {language === 'zh' ? '付款備註（可選）' : 'Payment Notes (Optional)'}
            </Label>
            <Textarea
              id="admin-notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder={
                language === 'zh'
                  ? '例如：收到現金 $120，找零 $10'
                  : 'e.g., Received $120 cash, gave $10 change'
              }
              className="border-amber-200 focus:border-amber-400"
              rows={3}
            />
            <p className="text-xs text-gray-500">
              {language === 'zh'
                ? '記錄付款細節、付款方式或其他相關資訊'
                : 'Record payment details, method, or any relevant information'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="border-gray-300"
          >
            {language === 'zh' ? '取消' : 'Cancel'}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
          >
            {isLoading
              ? (language === 'zh' ? '處理中...' : 'Processing...')
              : (language === 'zh' ? '確認已收款' : 'Confirm Payment Received')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
