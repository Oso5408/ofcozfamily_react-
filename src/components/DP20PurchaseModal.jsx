import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { useToast } from '@/components/ui/use-toast';
import { storageService, packagePurchaseService } from '@/services';
import { Upload, FileText, X, Check, MessageCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';

export const DP20PurchaseModal = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const t = translations[language];
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    // Validate file
    const validation = storageService.validateFile(file);
    if (!validation.valid) {
      toast({
        title: t.booking.receipt.uploadError,
        description: validation.error,
        variant: 'destructive'
      });
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null); // PDF files won't have preview
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  const handleSubmit = async () => {
    // Validate form
    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: language === 'zh' ? '請填寫所有欄位' : 'Please fill all fields',
        description: language === 'zh' ? '請提供您的姓名、電郵和電話' : 'Please provide your name, email and phone',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: t.booking.receipt.uploadError,
        description: language === 'zh' ? '請上傳付款收據' : 'Please upload payment receipt',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    setUploadProgress(30);

    try {
      // Upload receipt to storage
      // Use a special prefix for DP20 purchases (folder name)
      const timestamp = Date.now();
      const folderId = `dp20_${user.id.substring(0, 8)}_${timestamp}`;
      const uploadResult = await storageService.uploadReceipt(folderId, selectedFile);
      setUploadProgress(70);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      setUploadProgress(90);

      // Try to create purchase record in database
      const purchaseResult = await packagePurchaseService.createPurchase({
        packageType: 'DP20',
        amount: 1000,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        receiptUrl: uploadResult.url
      });

      if (!purchaseResult.success) {
        // Fallback to localStorage if table doesn't exist
        console.warn('⚠️ Database insert failed, using localStorage fallback:', purchaseResult.error);
        const purchaseRecord = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          receiptUrl: uploadResult.url,
          amount: 1000,
          status: 'pending'
        };
        const existingPurchases = JSON.parse(localStorage.getItem('dp20_purchases') || '[]');
        existingPurchases.push(purchaseRecord);
        localStorage.setItem('dp20_purchases', JSON.stringify(existingPurchases));
        console.log('📝 Saved to localStorage:', purchaseRecord.id);
      } else {
        console.log('✅ DP20 purchase created in database:', purchaseResult.data.id);
      }

      setUploadProgress(100);
      setUploadComplete(true);

      toast({
        title: language === 'zh' ? '收據已上傳' : 'Receipt Uploaded',
        description: language === 'zh'
          ? '請透過 WhatsApp 通知管理員確認您的套票購買'
          : 'Please notify admin via WhatsApp to confirm your package purchase'
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: t.booking.receipt.uploadError,
        description: error.message || 'An error occurred',
        variant: 'destructive'
      });
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleWhatsAppNotify = () => {
    // WhatsApp link to notify admin
    const message = encodeURIComponent(
      language === 'zh'
        ? `你好！我剛完成了 DP20 套票購買（HK$1,000）。\n\n姓名：${formData.name}\n電郵：${formData.email}\n電話：${formData.phone}\n\n已上傳付款收據，請確認並分配套票。謝謝！`
        : `Hello! I just completed DP20 Package purchase (HK$1,000).\n\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\n\nPayment receipt uploaded, please confirm and assign package. Thank you!`
    );

    // WhatsApp number (matches the one used in other components)
    const whatsappNumber = '85266238788';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

    window.open(whatsappUrl, '_blank');

    // Close modal after opening WhatsApp
    setTimeout(() => {
      handleClose();
    }, 1000);
  };

  const handleClose = () => {
    setFormData({
      name: user?.full_name || '',
      email: user?.email || '',
      phone: user?.phone || ''
    });
    setSelectedFile(null);
    setPreview(null);
    setUploadProgress(0);
    setUploadComplete(false);
    setUploading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-amber-800">
            {language === 'zh' ? '購買 DP20 套票' : 'Purchase DP20 Package'}
          </DialogTitle>
          <DialogDescription>
            {language === 'zh'
              ? '20次使用 | HK$1,000 | 90天有效期'
              : '20 visits | HK$1,000 | 90 days validity'}
          </DialogDescription>
        </DialogHeader>

        {!uploadComplete ? (
          <div className="space-y-4">
            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="name" className="text-amber-800">
                  {language === 'zh' ? '姓名' : 'Name'} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={language === 'zh' ? '請輸入您的姓名' : 'Enter your name'}
                  className="border-amber-200 focus:border-amber-500"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-amber-800">
                  {language === 'zh' ? '電郵' : 'Email'} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder={language === 'zh' ? '請輸入您的電郵' : 'Enter your email'}
                  className="border-amber-200 focus:border-amber-500"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-amber-800">
                  {language === 'zh' ? '電話' : 'Phone'} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder={language === 'zh' ? '請輸入您的電話號碼' : 'Enter your phone number'}
                  className="border-amber-200 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Receipt Upload Section */}
            <div className="border-t border-amber-200 pt-4">
              <Label className="text-amber-800 mb-2 block">
                {language === 'zh' ? '上傳付款收據' : 'Upload Payment Receipt'} <span className="text-red-500">*</span>
              </Label>

              {!selectedFile && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-amber-200 hover:border-amber-400'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="dp20-receipt-upload"
                  />
                  <label htmlFor="dp20-receipt-upload" className="cursor-pointer block">
                    <Upload className="w-10 h-10 mx-auto mb-3 text-amber-600" />
                    <p className="text-amber-700 font-medium mb-2">
                      {t.booking.receipt.dragDrop}
                    </p>
                    <p className="text-sm text-amber-600 mb-3">{t.booking.receipt.or}</p>
                    <span className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-amber-300 bg-white hover:bg-amber-50 h-9 px-4 py-2 cursor-pointer">
                      {t.booking.receipt.selectFile}
                    </span>
                    <p className="text-xs text-gray-500 mt-3">
                      {t.booking.receipt.allowedFormats}
                    </p>
                  </label>
                </div>
              )}

              {selectedFile && (
                <div className="border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {preview ? (
                        <img
                          src={preview}
                          alt="Receipt preview"
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <FileText className="w-12 h-12 text-amber-600" />
                      )}
                      <div>
                        <p className="font-medium text-amber-800 truncate max-w-[200px] text-sm">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    {!uploading && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeFile}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {preview && (
                    <div className="mt-2">
                      <img
                        src={preview}
                        alt="Receipt preview"
                        className="w-full max-h-48 object-contain rounded border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              )}

              {uploading && (
                <div className="space-y-2 mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-amber-700">{t.booking.receipt.uploading}</span>
                    <span className="text-amber-600">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={uploading}
                className="border-amber-300"
              >
                {language === 'zh' ? '取消' : 'Cancel'}
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={uploading}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
              >
                {uploading ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-pulse" />
                    {t.booking.receipt.uploading}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {language === 'zh' ? '提交' : 'Submit'}
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          // Success Screen with WhatsApp Notification
          <div className="space-y-4 py-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-800 mb-2">
                {language === 'zh' ? '收據已上傳！' : 'Receipt Uploaded!'}
              </h3>
              <p className="text-gray-600 mb-6">
                {language === 'zh'
                  ? '請點擊下方按鈕通知管理員確認您的套票購買'
                  : 'Please click the button below to notify admin about your package purchase'}
              </p>

              <Button
                onClick={handleWhatsAppNotify}
                className="bg-green-500 hover:bg-green-600 text-white w-full"
                size="lg"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                {language === 'zh' ? '透過 WhatsApp 通知管理員' : 'Notify Admin via WhatsApp'}
              </Button>

              <p className="text-xs text-gray-500 mt-4">
                {language === 'zh'
                  ? '管理員確認後會為您分配 DP20 套票'
                  : 'Admin will assign your DP20 package after confirmation'}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
