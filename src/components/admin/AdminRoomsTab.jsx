import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { Edit, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';
import { EditRoomModal } from './EditRoomModal';

export const AdminRoomsTab = ({ rooms, onRoomUpdate }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const handleEditClick = (room) => {
    setSelectedRoom(room);
    setEditModalOpen(true);
  };

  const handleEditSuccess = (updatedRoom) => {
    if (onRoomUpdate) {
      onRoomUpdate(updatedRoom);
    }
  };

  const getRoomImage = (room) => {
    // Use Supabase image_url if available, otherwise fallback to Unsplash
    if (room.image_url) {
      return room.image_url;
    }
    // Fallback to Unsplash with room-specific seed
    const roomSeed = room.id + 10;
    return `https://source.unsplash.com/800x600/?workspace,cozy,${roomSeed}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-amber-800">
            {language === 'zh' ? '房間管理' : 'Room Management'}
          </h2>
          <p className="text-amber-600 mt-1">
            {language === 'zh'
              ? '管理房間圖片和說明'
              : 'Manage room images and descriptions'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => {
          const roomName = t.rooms.roomNames?.[room.name] || room.name;
          const roomKey = room.description || room.name;
          const description = t.rooms.roomDescriptions?.[roomKey] || '';

          return (
            <Card key={room.id} className="overflow-hidden glass-effect cat-shadow border-amber-200 hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={getRoomImage(room)}
                  alt={roomName}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  {room.hidden && (
                    <div className="px-2 py-1 bg-gray-800 bg-opacity-75 text-white text-xs rounded-full flex items-center">
                      <EyeOff className="w-3 h-3 mr-1" />
                      {language === 'zh' ? '已隱藏' : 'Hidden'}
                    </div>
                  )}
                  {room.image_url && (
                    <div className="px-2 py-1 bg-green-600 bg-opacity-75 text-white text-xs rounded-full flex items-center">
                      <ImageIcon className="w-3 h-3 mr-1" />
                      {language === 'zh' ? '自訂' : 'Custom'}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold text-amber-800 mb-2">
                  {roomName}
                </h3>

                <div className="space-y-2 text-sm text-amber-700 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{language === 'zh' ? '容量' : 'Capacity'}:</span>
                    <span>{room.capacity} {language === 'zh' ? '人' : 'guests'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{language === 'zh' ? '大小' : 'Size'}:</span>
                    <span>{room.size || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{language === 'zh' ? '狀態' : 'Status'}:</span>
                    <span className="flex items-center">
                      {room.hidden ? (
                        <>
                          <EyeOff className="w-3 h-3 mr-1 text-gray-500" />
                          <span className="text-gray-500">{language === 'zh' ? '已隱藏' : 'Hidden'}</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3 mr-1 text-green-600" />
                          <span className="text-green-600">{language === 'zh' ? '可見' : 'Visible'}</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {description && (
                  <p className="text-xs text-amber-600 mb-4 line-clamp-3">
                    {description}
                  </p>
                )}

                <Button
                  onClick={() => handleEditClick(room)}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {language === 'zh' ? '編輯房間' : 'Edit Room'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {rooms.length === 0 && (
        <div className="text-center py-12">
          <p className="text-amber-600">
            {language === 'zh' ? '沒有找到房間' : 'No rooms found'}
          </p>
        </div>
      )}

      <EditRoomModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        room={selectedRoom}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};
