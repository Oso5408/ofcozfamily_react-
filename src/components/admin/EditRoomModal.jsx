import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Upload, X, Image as ImageIcon, Crop, Check, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { roomService } from '@/services/roomService';
import { useToast } from '@/components/ui/use-toast';
import Cropper from 'react-easy-crop';

const MAX_IMAGES = 3;

// Helper function to create cropped image
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.95);
  });
}

export const EditRoomModal = ({ isOpen, onClose, room, onSuccess }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    descriptionEn: '',
    descriptionZh: '',
  });

  // Images state: array of {file, url, visible, order, isNew}
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Cropping state
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageIndex, setCropImageIndex] = useState(null);
  const [originalImageSrc, setOriginalImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    if (room) {
      // Get room descriptions from translations
      const roomKey = room.description || room.name;
      const enDescription = t.rooms.roomDescriptions?.[roomKey] || '';
      const zhDescription = translations['zh'].rooms.roomDescriptions?.[roomKey] || '';

      setFormData({
        descriptionEn: enDescription,
        descriptionZh: zhDescription,
      });

      // Load existing images from room.images array
      let existingImages = room.images || [];

      // If no images array but has image_url, convert it to images array format
      if (existingImages.length === 0 && room.image_url) {
        existingImages = [{
          url: room.image_url,
          visible: true,
          order: 1
        }];
      }

      const loadedImages = existingImages.map((img, index) => ({
        url: img.url,
        visible: img.visible !== false, // default to true
        order: img.order || index + 1,
        isNew: false,
        file: null,
      }));

      setImages(loadedImages);
      console.log('📸 Loaded images for room:', { roomId: room.id, imageCount: loadedImages.length });
      setShowCropper(false);
      setOriginalImageSrc(null);
    }
  }, [room, t]);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (file) => {
    if (!file) return;

    // Check max images limit
    if (images.length >= MAX_IMAGES) {
      toast({
        title: language === 'zh' ? '已達上限' : 'Max Limit Reached',
        description: language === 'zh' ? `最多只能上傳 ${MAX_IMAGES} 張圖片` : `Maximum ${MAX_IMAGES} images allowed`,
        variant: 'destructive',
      });
      return;
    }

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

    const reader = new FileReader();
    reader.onloadend = () => {
      setOriginalImageSrc(reader.result);
      setCropImageIndex(images.length); // new image
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async () => {
    try {
      const croppedBlob = await getCroppedImg(originalImageSrc, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], `room-image-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const croppedUrl = URL.createObjectURL(croppedBlob);

      if (cropImageIndex < images.length) {
        // Replacing existing image
        const updatedImages = [...images];
        updatedImages[cropImageIndex] = {
          ...updatedImages[cropImageIndex],
          file: croppedFile,
          url: croppedUrl,
          isNew: true,
        };
        setImages(updatedImages);
      } else {
        // Adding new image
        setImages([
          ...images,
          {
            url: croppedUrl,
            file: croppedFile,
            visible: true,
            order: images.length + 1,
            isNew: true,
          },
        ]);
      }

      setShowCropper(false);
      setCropImageIndex(null);
      setOriginalImageSrc(null);

      toast({
        title: language === 'zh' ? '✅ 裁切完成' : '✅ Crop Complete',
        description: language === 'zh' ? '圖片已裁切，點擊儲存上傳' : 'Image cropped, click save to upload',
      });
    } catch (error) {
      console.error('Error cropping image:', error);
      toast({
        title: language === 'zh' ? '❌ 裁切失敗' : '❌ Crop Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setOriginalImageSrc(null);
    setCropImageIndex(null);
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

  const removeImage = (index) => {
    const updatedImages = images.filter((_, i) => i !== index);
    // Update orders
    const reorderedImages = updatedImages.map((img, i) => ({
      ...img,
      order: i + 1,
    }));
    setImages(reorderedImages);
  };

  const toggleImageVisibility = (index) => {
    const updatedImages = [...images];
    updatedImages[index] = {
      ...updatedImages[index],
      visible: !updatedImages[index].visible,
    };
    setImages(updatedImages);
  };

  const moveImage = (index, direction) => {
    if (
      (direction === 'left' && index === 0) ||
      (direction === 'right' && index === images.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'left' ? index - 1 : index + 1;
    const updatedImages = [...images];
    [updatedImages[index], updatedImages[newIndex]] = [updatedImages[newIndex], updatedImages[index]];

    // Update orders
    const reorderedImages = updatedImages.map((img, i) => ({
      ...img,
      order: i + 1,
    }));

    setImages(reorderedImages);
  };

  const handleSave = async () => {
    if (!room) return;

    setUploading(true);
    try {
      console.log('💾 Saving room...', { roomId: room.id, imagesCount: images.length });

      // Check if there are any images to save
      if (images.length > 0) {
        // Check if there are any new images to upload
        const newImages = images.filter(img => img.isNew && img.file);
        console.log('📤 New images to upload:', newImages.length);

        // Upload new images or keep existing ones
        const uploadPromises = images.map(async (img, index) => {
          if (img.isNew && img.file) {
            console.log(`📤 Uploading new image ${index + 1}...`);
            const result = await roomService.uploadRoomImage(room.id, img.file, index);
            if (!result.success) {
              throw new Error(`Failed to upload image ${index + 1}: ${result.error}`);
            }
            console.log(`✅ Image ${index + 1} uploaded:`, result.url);
            return {
              url: result.url,
              visible: img.visible,
              order: img.order,
            };
          } else {
            console.log(`✓ Keeping existing image ${index + 1}:`, { visible: img.visible, order: img.order });
            return {
              url: img.url,
              visible: img.visible,
              order: img.order,
            };
          }
        });

        const uploadedImages = await Promise.all(uploadPromises);
        console.log('📦 Final images array:', uploadedImages);

        // Update room with new images array
        const updateResult = await roomService.updateRoomImages(room.id, uploadedImages);

        if (!updateResult.success) {
          throw new Error(updateResult.error);
        }

        console.log('✅ Room updated successfully');

        toast({
          title: language === 'zh' ? '✅ 房間已更新' : '✅ Room Updated',
          description: language === 'zh'
            ? newImages.length > 0
              ? '房間圖片已成功更新'
              : '圖片順序和顯示設定已更新'
            : newImages.length > 0
              ? 'Room images have been successfully updated'
              : 'Image order and visibility updated',
        });

        if (onSuccess) {
          onSuccess(updateResult.room || room);
        }
      } else {
        // No images - just save the room data (e.g., descriptions)
        console.log('📝 No images to save, updating room with empty images array');

        const updateResult = await roomService.updateRoomImages(room.id, []);

        if (!updateResult.success) {
          throw new Error(updateResult.error);
        }

        toast({
          title: language === 'zh' ? '✅ 房間已更新' : '✅ Room Updated',
          description: language === 'zh' ? '房間資料已更新' : 'Room data updated',
        });

        if (onSuccess) {
          onSuccess(updateResult.room || room);
        }
      }

      onClose();
    } catch (error) {
      console.error('❌ Error saving room:', error);
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
      <DialogContent className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6">
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
              {language === 'zh' ? `房間圖片 (${images.length}/${MAX_IMAGES})` : `Room Images (${images.length}/${MAX_IMAGES})`}
            </Label>

            {showCropper ? (
              <div className="space-y-4">
                <div className="relative w-full h-96 bg-black rounded-lg">
                  <Cropper
                    image={originalImageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={4 / 3}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-amber-700">
                    {language === 'zh' ? '縮放' : 'Zoom'}
                  </Label>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleCropConfirm}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {language === 'zh' ? '確認裁切' : 'Confirm Crop'}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCropCancel}
                    variant="outline"
                    className="flex-1 border-gray-300"
                  >
                    <X className="w-4 h-4 mr-2" />
                    {language === 'zh' ? '取消' : 'Cancel'}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Existing Images Grid */}
                {images.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {images.map((img, index) => (
                      <div key={index} className="relative group border-2 border-amber-200 rounded-lg overflow-hidden">
                        <img
                          src={img.url}
                          alt={`Room image ${index + 1}`}
                          className="w-full h-48 object-cover"
                        />

                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 z-10">
                          {/* Move Left */}
                          {index > 0 && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveImage(index, 'left');
                              }}
                              className="opacity-0 group-hover:opacity-100 bg-amber-600 hover:bg-amber-700 text-white transition-opacity pointer-events-auto"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                          )}

                          {/* Visibility Toggle */}
                          <Button
                            type="button"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleImageVisibility(index);
                            }}
                            className={`opacity-0 group-hover:opacity-100 text-white transition-opacity pointer-events-auto ${
                              img.visible ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
                            }`}
                          >
                            {img.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </Button>

                          {/* Remove */}
                          <Button
                            type="button"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                            className="opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-700 text-white transition-opacity pointer-events-auto"
                          >
                            <X className="w-4 h-4" />
                          </Button>

                          {/* Move Right */}
                          {index < images.length - 1 && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveImage(index, 'right');
                              }}
                              className="opacity-0 group-hover:opacity-100 bg-amber-600 hover:bg-amber-700 text-white transition-opacity pointer-events-auto"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className="absolute top-2 left-2 flex gap-2">
                          <span className="px-2 py-1 text-xs bg-amber-600 text-white rounded">
                            #{img.order}
                          </span>
                          {img.visible ? (
                            <span className="px-2 py-1 text-xs bg-green-600 text-white rounded">
                              {language === 'zh' ? '顯示' : 'Visible'}
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs bg-gray-600 text-white rounded">
                              {language === 'zh' ? '隱藏' : 'Hidden'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Area */}
                {images.length < MAX_IMAGES && (
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
                        <ImageIcon className="w-12 h-12 text-amber-500 mb-2" />
                        <p className="text-sm text-gray-600 mb-1">
                          {language === 'zh'
                            ? '點擊或拖放圖片到此處'
                            : 'Click or drag and drop an image here'}
                        </p>
                        <p className="text-xs text-gray-500 mb-2">
                          {language === 'zh'
                            ? `支援 JPG、PNG、WebP（最大 5MB）· 最多 ${MAX_IMAGES} 張`
                            : `Supports JPG, PNG, WebP (max 5MB) · Max ${MAX_IMAGES} images`}
                        </p>
                        <p className="text-xs text-amber-600 font-medium">
                          {language === 'zh'
                            ? '📐 上傳後可裁切 · 👁️ 可選擇顯示/隱藏'
                            : '📐 Crop after upload · 👁️ Show/Hide control'}
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {images.length >= MAX_IMAGES && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-center">
                    <p className="text-sm text-amber-800">
                      {language === 'zh'
                        ? `已達到最大圖片數量 (${MAX_IMAGES} 張)。如需新增，請先刪除現有圖片。`
                        : `Maximum number of images reached (${MAX_IMAGES}). Remove existing images to add new ones.`}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              {language === 'zh'
                ? '💡 提示：點擊眼睛圖示可控制圖片是否顯示給客戶。拖動左右箭頭可調整圖片順序。'
                : '💡 Tip: Click the eye icon to control image visibility to customers. Use left/right arrows to reorder images.'}
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
            disabled={uploading || showCropper}
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
