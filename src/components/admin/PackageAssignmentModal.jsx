import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const PackageAssignmentModal = ({
  isOpen,
  onClose,
  onSubmit,
  userId,
  userName,
  language,
  mode = 'add' // 'add' or 'deduct'
}) => {
  const [packageType, setPackageType] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [expiry, setExpiry] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!packageType) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        packageType,
        quantity: parseInt(quantity),
        expiry,
        reason,
        mode
      });

      // Reset form
      setPackageType('');
      setQuantity(1);
      setExpiry('');
      setReason('');
      onClose();
    } catch (error) {
      console.error('Error submitting package:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setPackageType('');
    setQuantity(1);
    setExpiry('');
    setReason('');
    onClose();
  };

  // Just return the quantity - no multiplication
  const getBRAmount = () => {
    return quantity;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className={mode === 'deduct' ? 'text-red-800' : 'text-amber-800'}>
            {mode === 'deduct'
              ? (language === 'zh' ? '扣除' : 'Deduct Package')
              : (language === 'zh' ? '增值' : 'Add Package')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'deduct'
              ? (language === 'zh' ? `為 ${userName} 扣除套票` : `Deduct package from ${userName}`)
              : (language === 'zh' ? `為 ${userName} 分配套票` : `Assign package to ${userName}`)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Package Type Selection */}
          <div className="space-y-2">
            <Label className="text-amber-800">
              {language === 'zh' ? '代幣 *' : 'Package *'}
            </Label>
            <Select value={packageType} onValueChange={setPackageType}>
              <SelectTrigger className="border-amber-200 focus:border-amber-400">
                <SelectValue placeholder={language === 'zh' ? '請選擇' : 'Please select'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BR15">BR15 ({language === 'zh' ? '15次預約/套票' : '15 bookings per package'})</SelectItem>
                <SelectItem value="BR30">BR30 ({language === 'zh' ? '30次預約/套票' : '30 bookings per package'})</SelectItem>
                <SelectItem value="DP20">DP20 ({language === 'zh' ? '20次入場 (90日有效)' : '20 visits (90-day validity)'})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity Input - Only show after package is selected */}
          {packageType && (
            <>
              <div className="space-y-2">
                <Label className="text-amber-800">
                  {language === 'zh' ? '數量 *' : 'Quantity *'}
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="border-amber-200 focus:border-amber-400"
                />
                <p className={`text-sm ${mode === 'deduct' ? 'text-red-600' : 'text-amber-600'}`}>
                  {mode === 'deduct'
                    ? (language === 'zh' ? '將扣除' : 'Will deduct')
                    : (language === 'zh' ? '將增加' : 'Will add')
                  } <strong>{getBRAmount()}</strong> {packageType === 'DP20' ? (language === 'zh' ? '次' : 'visits') : 'BR'}
                </p>
              </div>

              {/* Expiry Date Picker - Only show for add mode */}
              {mode === 'add' && (
                <div className="space-y-2">
                  <Label className="text-amber-800">
                    {language === 'zh' ? '有效期 *' : 'Expiry *'}
                  </Label>
                  <DatePicker
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="border-amber-200 focus:border-amber-400 w-full"
                  />
                  <p className="text-xs text-amber-600">
                    {language === 'zh' ? '選擇套票的到期日期' : 'Select the expiry date for the package'}
                  </p>
                </div>
              )}

              {/* Reason Input */}
              <div className="space-y-2">
                <Label className="text-amber-800">
                  {language === 'zh' ? '原因' : 'Reason'}
                </Label>
                <Input
                  type="text"
                  placeholder={language === 'zh' ? '原因' : 'Reason'}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="border-amber-200 focus:border-amber-400"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-amber-300 text-amber-700"
            disabled={isSubmitting}
          >
            {language === 'zh' ? '關閉' : 'Close'}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!packageType || isSubmitting || (mode === 'add' && !expiry)}
            className={mode === 'deduct'
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
              : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white'}
          >
            {isSubmitting
              ? (language === 'zh' ? '提交中...' : 'Submitting...')
              : (language === 'zh' ? '提交' : 'Submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
