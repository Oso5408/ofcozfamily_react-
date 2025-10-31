import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { roomService } from '@/services/roomService';
import { useToast } from '@/components/ui/use-toast';

export const EditRoomModal = ({ isOpen, onClose, room, onSuccess }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    descriptionEn: '',
    descriptionZh: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (room) {
      // Get room descriptions from translations
      const roomKey = room.description || room.name; // e.g., "RoomBDescription" or "Room B"
      const enDescription = t.rooms.roomDescriptions?.[roomKey] || '';
      const zhDescription = translations['zh'].rooms.roomDescriptions?.[roomKey] || '';

      setFormData({
        descriptionEn: enDescription,
        descriptionZh: zhDescription,
      });
      setPreviewUrl(room.image_url || null);
      setSelectedFile(null);
    }
  }, [room, t]);

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: language === 'zh' ? '檔案過大' : 'File too large',
        description: language === 'zh' ? '檔案大小不能超過 5MB' : 'File size must not exceed 5MB',
        variant: 'destructive',
      });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: language === 'zh' ? '無效的檔案格式' : 'Invalid file type',
        description: language === 'zh' ? '只支援 JPG、PNG 和 WebP 格式' : 'Only JPG, PNG, and WebP formats are supported',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    setPreviewUrl(room?.image_url || null);
  };

  const handleSave = async () => {
    if (!room) return;

    setUploading(true);
    try {
      let imageUpdateResult = null;

      // Upload new image if selected
      if (selectedFile) {
        imageUpdateResult = await roomService.updateRoomImage(
          room.id,
          selectedFile,
          room.image_url
        );

        if (!imageUpdateResult.success) {
          throw new Error(imageUpdateResult.error);
        }
      }

      // Note: Descriptions are stored in translation files
      // For now, we'll show a message to admin to update manually
      // In future, could implement a JSON-based translation update system

      toast({
        title: language === 'zh' ? '✅ 房間已更新' : '✅ Room Updated',
        description: language === 'zh'
          ? selectedFile ? '房間圖片已成功更新' : '房間資料已保存'
          : selectedFile ? 'Room image has been successfully updated' : 'Room data has been saved',
      });

      if (formData.descriptionEn !== t.rooms.roomDescriptions?.[room.description] ||
          formData.descriptionZh !== translations['zh'].rooms.roomDescriptions?.[room.description]) {
        toast({
          title: language === 'zh' ? '📝 說明更新提示' : '📝 Description Update Note',
          description: language === 'zh'
            ? '房間說明需要手動更新翻譯檔案。請將以下內容複製到 src/data/translations 中：\n\nEN: ' + formData.descriptionEn + '\n\nZH: ' + formData.descriptionZh
            : 'Room descriptions require manual translation file updates. Please copy the following to src/data/translations:\n\nEN: ' + formData.descriptionEn + '\n\nZH: ' + formData.descriptionZh,
          duration: 10000,
        });
      }

      if (onSuccess) {
        onSuccess(imageUpdateResult?.room || room);
      }
      onClose();
    } catch (error) {
      console.error('Error saving room:', error);
      toast({
        title: language === 'zh' ? '❌ 保存失敗' : '❌ Save Failed',
        description: error.message || (language === 'zh' ? '無法保存房間資料' : 'Failed to save room data'),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  if (!room) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-amber-800">
            {language === 'zh' ? '編輯房間' : 'Edit Room'}
          </DialogTitle>
          <DialogDescription>
            {t.rooms.roomNames?.[room.name] || room.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Image Upload Section */}
          <div>
            <Label className="text-amber-800 font-semibold mb-2 block">
              {language === 'zh' ? '房間圖片' : 'Room Image'}
            </Label>

            {previewUrl && (
              <div className="relative mb-4">
                <img
                  src={previewUrl}
                  alt="Room preview"
                  className="w-full h-64 object-cover rounded-lg border-2 border-amber-200"
                />
                {selectedFile && (
                  <button
                    onClick={clearImage}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    type="button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-300 hover:border-amber-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="room-image"
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileInputChange}
              />
              <label htmlFor="room-image" className="cursor-pointer">
                <div className="flex flex-col items-center">
                  {selectedFile ? (
                    <Upload className="w-12 h-12 text-green-500 mb-2" />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-amber-500 mb-2" />
                  )}
                  <p className="text-sm text-gray-600 mb-1">
                    {language === 'zh'
                      ? '點擊或拖放圖片到此處'
                      : 'Click or drag and drop an image here'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {language === 'zh'
                      ? '支援 JPG、PNG、WebP（最大 5MB）'
                      : 'Supports JPG, PNG, WebP (max 5MB)'}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Description (English) */}
          <div>
            <Label htmlFor="desc-en" className="text-amber-800 font-semibold">
              {language === 'zh' ? '說明（英文）' : 'Description (English)'}
            </Label>
            <Textarea
              id="desc-en"
              value={formData.descriptionEn}
              onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
              placeholder="Enter English description..."
              className="border-amber-200 focus:border-amber-400 mt-2 min-h-[100px]"
            />
          </div>

          {/* Description (Chinese) */}
          <div>
            <Label htmlFor="desc-zh" className="text-amber-800 font-semibold">
              {language === 'zh' ? '說明（中文）' : 'Description (Chinese)'}
            </Label>
            <Textarea
              id="desc-zh"
              value={formData.descriptionZh}
              onChange={(e) => setFormData({ ...formData, descriptionZh: e.target.value })}
              placeholder="輸入中文說明..."
              className="border-amber-200 focus:border-amber-400 mt-2 min-h-[100px]"
            />
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              {language === 'zh'
                ? '⚠️ 注意：房間說明的更改需要手動更新翻譯檔案才能在網站上顯示。'
                : '⚠️ Note: Description changes require manual translation file updates to appear on the website.'}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={uploading}
            className="w-full sm:w-auto border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            {language === 'zh' ? '取消' : 'Cancel'}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={uploading}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white disabled:opacity-50"
          >
            {uploading
              ? language === 'zh' ? '儲存中...' : 'Saving...'
              : language === 'zh' ? '儲存' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
