import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

export const PaymentInstructionsModal = ({ isOpen, onClose, booking }) => {
  const { language } = useLanguage();

  // Calculate total cost from booking
  const totalPrice = booking?.total_cost || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-amber-800">
            {language === 'zh' ? '付款方式' : 'Payment Method'}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="pt-2">
              <p className="text-amber-700">
                {language === 'zh' ? '請使用以下方式付款' : 'Please pay using one of the following methods'}
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
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

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              {language === 'zh'
                ? '💡 付款後，請在「我的預約」中上傳付款收據以便確認您的預約。'
                : '💡 After payment, please upload your receipt in "My Bookings" to confirm your booking.'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
          >
            {language === 'zh' ? '已了解' : 'Got it'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
