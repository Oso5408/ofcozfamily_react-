import React from 'react';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Users, Calendar, CheckCircle, XCircle, Clock, Eye, EyeOff } from 'lucide-react';
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from '@/components/ui/use-toast';
import { translations } from '@/data/translations';

export const AdminDashboardStats = ({ bookings, users, setFilterStatus, rooms, onToggleRoomVisibility }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();

  const safeBookings = bookings || [];
  const safeUsers = users || [];

  const handleToggle = (roomId, isHidden) => {
    onToggleRoomVisibility(roomId, !isHidden);
    toast({
      title: language === 'zh' ? '房間狀態已更新' : 'Room Status Updated',
      description: language === 'zh' 
        ? `房間已${!isHidden ? '隱藏' : '公開'}`
        : `The room is now ${!isHidden ? 'hidden' : 'visible'}`
    });
  };

  const stats = [
    {
      title: language === 'zh' ? '總預約數' : 'Total Bookings',
      value: safeBookings.length,
      icon: Calendar,
      color: 'from-blue-400 to-blue-600',
      filter: 'all'
    },
    {
      title: language === 'zh' ? '已確認預約' : 'Confirmed',
      value: safeBookings.filter(b => b.status === 'confirmed').length,
      icon: CheckCircle,
      color: 'from-green-400 to-green-600',
      filter: 'confirmed'
    },
    {
      title: language === 'zh' ? '待確認預約' : 'Pending',
      value: safeBookings.filter(b => b.status === 'pending').length,
      icon: Clock,
      color: 'from-amber-400 to-orange-500',
      filter: 'pending'
    },
    {
      title: language === 'zh' ? '已取消預約' : 'Cancelled',
      value: safeBookings.filter(b => b.status === 'cancelled').length,
      icon: XCircle,
      color: 'from-red-400 to-red-600',
      filter: 'cancelled'
    },
    {
      title: language === 'zh' ? '註冊用戶' : 'Registered Users',
      value: safeUsers.length,
      icon: Users,
      color: 'from-purple-400 to-purple-600',
      filter: null
    }
  ];

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        {stats.map((stat, index) => (
          <button
            key={index}
            onClick={() => stat.filter && setFilterStatus(stat.filter)}
            disabled={!stat.filter}
            className={`w-full text-left ${stat.filter ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <Card className="p-6 glass-effect cat-shadow border-amber-200 h-full hover:border-amber-400 transition-colors">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-full flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-800">{stat.value}</p>
                  <p className="text-amber-600">{stat.title}</p>
                </div>
              </div>
            </Card>
          </button>
        ))}
      </div>
      <Card className="p-6 mb-8 border-amber-200 glass-effect">
        <h3 className="text-xl font-bold text-amber-800 mb-4">{language === 'zh' ? '房間可見性管理' : 'Room Visibility Management'}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {rooms.map((room) => (
            <div key={room.id} className="flex flex-col items-center space-y-2 p-4 bg-amber-50 rounded-lg">
              <Label htmlFor={`room-visibility-${room.id}`} className="font-semibold text-amber-800">{t.rooms.roomNames[room.name]}</Label>
              <div className="flex items-center space-x-2">
                <EyeOff className={`w-4 h-4 ${room.hidden ? 'text-red-500' : 'text-gray-400'}`} />
                <Switch
                  id={`room-visibility-${room.id}`}
                  checked={!room.hidden}
                  onCheckedChange={() => handleToggle(room.id, room.hidden)}
                />
                <Eye className={`w-4 h-4 ${!room.hidden ? 'text-green-500' : 'text-gray-400'}`} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
};