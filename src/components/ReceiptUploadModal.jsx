import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { useToast } from '@/components/ui/use-toast';
import { storageService, bookingService, emailService } from '@/services';
import { Upload, FileText, X, Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export const ReceiptUploadModal = ({ isOpen, onClose, booking, onUploadSuccess }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

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

  const handleUpload = async () => {
    if (!selectedFile || !booking) return;

    setUploading(true);
    setUploadProgress(30);

    try {
      // Upload to Supabase Storage
      const uploadResult = await storageService.uploadReceipt(booking.id, selectedFile);
      setUploadProgress(70);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      // Update booking with receipt URL
      const updateResult = await bookingService.uploadReceiptForBooking(
        booking.id,
        uploadResult.url
      );
      setUploadProgress(100);

      if (!updateResult.success) {
        throw new Error(updateResult.error);
      }

      // Send receipt received email notification
      console.log('📧 Sending receipt received email to user...');
      const emailResult = await emailService.sendReceiptReceivedEmail(
        updateResult.booking,
        language
      );

      if (!emailResult.success) {
        console.error('❌ Failed to send receipt received email:', emailResult.error);
      } else {
        console.log('✅ Receipt received email sent successfully');
      }

      toast({
        title: t.booking.receipt.uploadSuccess,
        description: t.booking.receipt.awaitingConfirmation
      });

      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess(updateResult.booking);
      }

      // Close modal after short delay
      setTimeout(() => {
        handleClose();
      }, 1000);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: t.booking.receipt.uploadError,
        description: error.message || 'An error occurred',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setUploadProgress(0);
    onClose();
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-800">
            {t.booking.receipt.uploadTitle}
          </DialogTitle>
          <DialogDescription>
            {t.booking.receipt.uploadDesc}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drag & Drop Area */}
          {!selectedFile && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
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
                id="receipt-upload"
              />
              <label htmlFor="receipt-upload" className="cursor-pointer block">
                <Upload className="w-12 h-12 mx-auto mb-4 text-amber-600" />
                <p className="text-amber-700 font-medium mb-2">
                  {t.booking.receipt.dragDrop}
                </p>
                <p className="text-sm text-amber-600 mb-4">{t.booking.receipt.or}</p>
                <span className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-amber-300 bg-white hover:bg-amber-50 h-10 px-4 py-2 cursor-pointer">
                  {t.booking.receipt.selectFile}
                </span>
                <p className="text-xs text-gray-500 mt-4">
                  {t.booking.receipt.allowedFormats}
                </p>
                <p className="text-xs text-gray-500">{t.booking.receipt.maxSize}</p>
              </label>
            </div>
          )}

          {/* File Preview */}
          {selectedFile && (
            <div className="border border-amber-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Receipt preview"
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <FileText className="w-16 h-16 text-amber-600" />
                  )}
                  <div>
                    <p className="font-medium text-amber-800 truncate max-w-[200px]">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
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
                <div className="mt-3">
                  <img
                    src={preview}
                    alt="Receipt preview"
                    className="w-full max-h-64 object-contain rounded border border-gray-200"
                  />
                </div>
              )}
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-amber-700">{t.booking.receipt.uploading}</span>
                <span className="text-amber-600">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
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
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
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
                  {t.booking.receipt.upload}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
