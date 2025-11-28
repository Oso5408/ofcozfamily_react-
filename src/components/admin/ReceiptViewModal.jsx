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

  // Drag/Pan state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

  // Reset position when zoom changes
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
  }, [zoom]);

  // Reset everything when modal closes
  useEffect(() => {
    if (!isOpen) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [isOpen]);

  if (!booking) return null;

  // For token/DP20 bookings, no receipt is needed
  const isTokenPayment = booking.paymentMethod === 'token' || booking.paymentMethod === 'dp20';
  const hasReceipt = !!booking.receipt_url;

  // Drag event handlers
  const handleMouseDown = (e) => {
    // Allow dragging at all zoom levels
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault(); // Prevent text selection
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

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
            {isTokenPayment
              ? (language === 'zh' ? '確認預約' : 'Confirm Booking')
              : t.booking.receipt.viewReceipt
            }
          </DialogTitle>
          <DialogDescription>
            {isTokenPayment
              ? (language === 'zh' ? '查看套票預約詳情' : 'View token booking details')
              : (language === 'zh' ? '查看客戶上傳的付款收據' : 'View customer payment receipt')
            }
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
              <div>
                <span className="font-semibold text-amber-800">
                  {language === 'zh' ? '付款方式:' : 'Payment Method:'}
                </span>{' '}
                <span className={`text-amber-700 font-medium ${isTokenPayment ? 'text-green-700' : ''}`}>
                  {booking.paymentMethod === 'token' && (language === 'zh' ? '套票' : 'Token')}
                  {booking.paymentMethod === 'dp20' && (language === 'zh' ? 'DP20套票' : 'DP20 Package')}
                  {booking.paymentMethod === 'cash' && (language === 'zh' ? '網上支付' : 'Online Payment')}
                </span>
              </div>
              <div>
                <span className="font-semibold text-amber-800">
                  {language === 'zh' ? '付款狀態:' : 'Payment Status:'}
                </span>{' '}
                <span className={`font-medium ${(booking.payment_status || booking.paymentStatus) === 'completed' ? 'text-green-700' : 'text-yellow-700'}`}>
                  {(booking.payment_status || booking.paymentStatus) === 'completed'
                    ? (language === 'zh' ? '已付款' : 'Paid')
                    : (language === 'zh' ? '待付款' : 'Pending')}
                </span>
              </div>
            </div>
          </div>

          {/* Receipt Image/PDF Viewer - Only show if receipt exists */}
          {hasReceipt && (
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
              <div
                className="overflow-hidden h-full flex items-center justify-center p-4 select-none"
                style={{
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
              >
                <img
                  src={receiptUrl}
                  alt="Receipt"
                  style={{
                    transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                    transformOrigin: 'center',
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                  }}
                  className="max-w-full h-auto"
                  draggable={false}
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
          )}

          {/* Token Payment Info - Show when no receipt */}
          {isTokenPayment && !hasReceipt && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <div className="text-center">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-green-800 mb-2">
                  {language === 'zh' ? '套票付款已完成' : 'Token Payment Completed'}
                </h3>
                <p className="text-green-700 mb-4">
                  {language === 'zh'
                    ? '此預約使用套票付款，已自動扣除相應額度。無需上傳收據。'
                    : 'This booking was paid with tokens. Payment has been automatically deducted. No receipt required.'}
                </p>
                <div className="bg-white rounded-lg p-4 inline-block">
                  <p className="text-sm text-gray-600">
                    {language === 'zh' ? '付款方式:' : 'Payment Method:'}{' '}
                    <span className="font-semibold text-green-700">
                      {booking.paymentMethod === 'dp20' ? 'DP20' : (language === 'zh' ? '套票' : 'Token')}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <div className="flex space-x-2">
              {/* Only show download button if receipt exists */}
              {hasReceipt && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownload}
                  className="border-amber-300"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {language === 'zh' ? '下載' : 'Download'}
                </Button>
              )}
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
