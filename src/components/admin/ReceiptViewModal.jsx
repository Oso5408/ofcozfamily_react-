import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { storageService } from '@/services';
import { X, ZoomIn, ZoomOut, Download, Check, Loader2 } from 'lucide-react';

export const ReceiptViewModal = ({ isOpen, onClose, booking, onConfirm }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const [zoom, setZoom] = useState(1);
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  // Generate signed URL when modal opens
  useEffect(() => {
    const loadReceiptUrl = async () => {
      console.log('📸 ReceiptViewModal - Starting to load receipt');
      console.log('📸 Booking object:', booking);
      console.log('📸 Receipt path from booking:', booking?.receipt_url);

      if (!booking || !booking.receipt_url) {
        console.log('❌ No booking or receipt_url found');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log('🔄 Calling storageService.getReceiptUrl with path:', booking.receipt_url);
        const url = await storageService.getReceiptUrl(booking.receipt_url);
        console.log('✅ Generated signed URL:', url);
        setReceiptUrl(url);
      } catch (error) {
        console.error('❌ Error loading receipt URL:', error);
      } finally {
        setLoading(false);
        console.log('🏁 Loading complete');
      }
    };

    if (isOpen && booking) {
      console.log('🚀 Modal opened, loading receipt...');
      loadReceiptUrl();
    }
  }, [isOpen, booking]);

  if (!booking || !booking.receipt_url) return null;

  const handleDownload = () => {
    if (receiptUrl) {
      window.open(receiptUrl, '_blank');
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleConfirmPayment = () => {
    if (onConfirm) {
      onConfirm(booking);
    }
  };

  const isPdf = booking.receipt_url?.toLowerCase().endsWith('.pdf');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-amber-800">
            {t.booking.receipt.viewReceipt}
          </DialogTitle>
          <DialogDescription>
            {language === 'zh' ? '查看客戶上傳的付款收據' : 'View customer payment receipt'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Booking Info */}
          <div className="bg-amber-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-semibold text-amber-800">
                  {language === 'zh' ? '預約編號:' : 'Booking ID:'}
                </span>{' '}
                <span className="text-amber-700">{booking.receiptNumber || booking.id.slice(0, 8)}</span>
              </div>
              <div>
                <span className="font-semibold text-amber-800">
                  {language === 'zh' ? '客戶:' : 'Customer:'}
                </span>{' '}
                <span className="text-amber-700">{booking.name || booking.users?.full_name || 'N/A'}</span>
              </div>
              <div>
                <span className="font-semibold text-amber-800">
                  {language === 'zh' ? '房間:' : 'Room:'}
                </span>{' '}
                <span className="text-amber-700">
                  {booking.room?.name ? t.rooms?.roomNames?.[booking.room.name] : 'N/A'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-amber-800">
                  {language === 'zh' ? '金額:' : 'Amount:'}
                </span>{' '}
                <span className="text-amber-700">HK${booking.total_cost || booking.totalCost}</span>
              </div>
            </div>
          </div>

          {/* Receipt Image/PDF Viewer */}
          <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '400px', maxHeight: '500px' }}>
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
              </div>
            ) : !receiptUrl ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                {language === 'zh' ? '無法載入收據' : 'Unable to load receipt'}
              </div>
            ) : isPdf ? (
              <iframe
                src={receiptUrl}
                className="w-full h-full"
                style={{ minHeight: '400px' }}
                title="Receipt PDF"
              />
            ) : (
              <div className="overflow-auto h-full flex items-center justify-center p-4">
                <img
                  src={receiptUrl}
                  alt="Receipt"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                  className="max-w-full h-auto transition-transform"
                />
              </div>
            )}

            {/* Zoom Controls (for images only) */}
            {!isPdf && (
              <div className="absolute bottom-4 right-4 flex space-x-2 bg-white/90 rounded-lg p-2 shadow-lg">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="px-2 py-1 text-sm font-medium">{Math.round(zoom * 100)}%</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleDownload}
                className="border-amber-300"
              >
                <Download className="w-4 h-4 mr-2" />
                {language === 'zh' ? '下載' : 'Download'}
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-amber-300"
              >
                <X className="w-4 h-4 mr-2" />
                {language === 'zh' ? '關閉' : 'Close'}
              </Button>
              {booking.status === 'to_be_confirmed' && onConfirm && (
                <Button
                  type="button"
                  onClick={handleConfirmPayment}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {language === 'zh' ? '確認付款' : 'Confirm Payment'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
