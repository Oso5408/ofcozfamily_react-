import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Users, Calendar, List, Bell, Star, Home } from 'lucide-react';
import { AdminDashboardStats } from '@/components/admin/AdminDashboardStats';
import { AdminBookingsTab } from '@/components/admin/AdminBookingsTab';
import { AdminUsersTab } from '@/components/admin/AdminUsersTab';
import { AdminRoomsTab } from '@/components/admin/AdminRoomsTab';
import { BookingCalendar } from '@/components/admin/BookingCalendar';
import { ReviewsTab } from '@/components/dashboard/ReviewsTab';
import { roomsData as initialRoomsData } from '@/data/roomsData';
import { generatePassword } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { bookingService } from '@/services/bookingService';
import { roomService } from '@/services/roomService';
import { userService } from '@/services/userService';

export const AdminPage = () => {
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [activeTab, setActiveTab] = useState('calendar');
  const [filterStatus, setFilterStatus] = useState('all');
  const [notifications, setNotifications] = useState([]);
  
  const { updateUserRole, adminResetPassword } = useAuth();


  useEffect(() => {
    console.log('🔒 AdminPage access check:', {
      user,
      'user.isAdmin': user?.isAdmin,
      'user.is_admin': user?.is_admin,
      'will_redirect': !user || (!user.isAdmin && !user.is_admin)
    });

    if (!user || (!user.isAdmin && !user.is_admin)) {
      console.log('⛔ Access denied - redirecting to home');
      navigate('/');
      return;
    }

    // Load data from Supabase
    const loadAdminData = async () => {
      try {
        // Fetch all bookings from Supabase
        const bookingsResult = await bookingService.getAllBookings();
        if (bookingsResult.success) {
          const allBookings = bookingsResult.bookings;
          console.log('📚 Loaded bookings from Supabase:', allBookings.length);
          setBookings(allBookings);

          // Check for new bookings since last login
          const lastLogin = localStorage.getItem('admin_last_login');
          const newBookings = allBookings.filter(b =>
            (b.status === 'pending_payment' || b.payment_status === 'pending') &&
            (!lastLogin || new Date(b.created_at) > new Date(lastLogin))
          );
          if (newBookings.length > 0) {
            setNotifications(newBookings);
            console.log('🔔 New bookings:', newBookings.length);
          }
        }

        // Fetch all rooms from Supabase (including hidden ones for admin)
        const roomsResult = await roomService.getRooms(true);
        if (roomsResult.success) {
          console.log('🏠 Loaded rooms from Supabase:', roomsResult.rooms.length);
          setRooms(roomsResult.rooms);
        } else {
          // Fallback to local data
          setRooms(initialRoomsData);
        }

        // Fetch all users from Supabase
        const usersResult = await userService.getAllUsers();
        if (usersResult.success) {
          console.log('👥 Loaded users from Supabase:', usersResult.users.length);
          console.log('👥 Sample user:', usersResult.users[0]);
          setUsers(usersResult.users);
        } else {
          console.error('❌ Failed to load users:', usersResult.error);
        }

        // Still need to get reviews from localStorage for now
        const allReviews = JSON.parse(localStorage.getItem('ofcoz_reviews') || '[]');
        setReviews(allReviews);

        localStorage.setItem('admin_last_login', new Date().toISOString());
      } catch (error) {
        console.error('❌ Error loading admin data:', error);
        toast({
          title: language === 'zh' ? '載入失敗' : 'Load Failed',
          description: language === 'zh' ? '無法載入數據' : 'Failed to load data',
          variant: 'destructive'
        });
      }
    };

    loadAdminData();
  }, [user, navigate, language, toast]);

  const handleRoleChange = (userId, newIsAdmin) => {
    updateUserRole(userId, newIsAdmin);
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? {...u, isAdmin: newIsAdmin} : u));
    
    const targetUser = users.find(u => u.id === userId);
    toast({
      title: t.admin.roleUpdated,
      description: t.admin.roleUpdatedDesc
        .replace('{name}', targetUser.name)
        .replace('{role}', newIsAdmin ? (language === 'zh' ? '管理員' : 'Admin') : (language === 'zh' ? '用戶' : 'User'))
    });
  };

  const handlePasswordReset = (userId) => {
    const newPassword = generatePassword();
    const result = adminResetPassword(userId, newPassword);
    if(result.success) {
      const targetUser = users.find(u => u.id === userId);
      toast({
        title: t.admin.resetPasswordSuccess.replace('{name}', targetUser.name),
        description: `${language === 'zh' ? '新密碼是：' : 'The new password is: '}${newPassword}`
      });
    }
  };
  
  const handleToggleRoomVisibility = async (roomId, currentlyHidden) => {
    try {
      const newHiddenState = !currentlyHidden; // Toggle the state
      console.log('🔄 Toggling room visibility:', { roomId, currentlyHidden, newHiddenState });

      // Update in Supabase
      const result = await roomService.toggleRoomVisibility(roomId, newHiddenState);

      if (result.success) {
        // Update local state
        const updatedRooms = rooms.map(r => r.id === roomId ? { ...r, hidden: newHiddenState } : r);
        setRooms(updatedRooms);

        const roomName = result.room.name;
        toast({
          title: language === 'zh' ? '房間狀態已更新' : 'Room Status Updated',
          description: language === 'zh'
            ? `${roomName} 現在${newHiddenState ? '隱藏' : '可見'}`
            : `${roomName} is now ${newHiddenState ? 'hidden' : 'visible'}`,
        });

        console.log('✅ Room visibility updated successfully');
      } else {
        toast({
          title: language === 'zh' ? '更新失敗' : 'Update Failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ Error toggling room visibility:', error);
      toast({
        title: language === 'zh' ? '發生錯誤' : 'Error Occurred',
        description: language === 'zh' ? '無法更新房間狀態' : 'Could not update room status',
        variant: 'destructive',
      });
    }
  };

  const handleRoomUpdate = (updatedRoom) => {
    // Update the room in the local state
    const updatedRooms = rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r);
    setRooms(updatedRooms);
    console.log('✅ Room updated in local state:', updatedRoom);
  };


  const filteredBookings = bookings.filter(booking => {
    if (filterStatus === 'all') return true;
    return booking.status === filterStatus;
  });

  const handleSetFilter = (status) => {
    setFilterStatus(status);
    setActiveTab('bookings');
  };

  const handleBookingClickFromCalendar = (booking) => {
    const status = booking.status || 'all';
    setFilterStatus(status);
    setActiveTab('bookings');
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user || (!user.isAdmin && !user.is_admin)) return null;

  return (
    <>
      <Helmet>
        <title>{`${t.adminPage.title} - Ofcoz Family`}</title>
        <meta name="description" content={t.adminPage.description} />
      </Helmet>

      <div className="min-h-screen p-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between mb-8">
              <Link 
                to="/dashboard" 
                className="inline-flex items-center text-amber-700 hover:text-amber-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                {t.admin.backToDashboard}
              </Link>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-amber-700" />
                    {notifications.length > 0 && (
                      <span className="absolute top-0 right-0 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">{t.notifications.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t.notifications.description}
                      </p>
                    </div>
                    <div className="grid gap-2">
                      {notifications.length > 0 ? notifications.map(n => {
                        // Parse notes to get user name
                        let userName = 'Unknown';
                        try {
                          const notes = JSON.parse(n.notes || '{}');
                          userName = notes.name || 'Unknown';
                        } catch (e) {
                          console.error('Failed to parse booking notes:', e);
                        }

                        // Find room by room_id
                        const room = rooms.find(r => r.id === n.room_id);
                        const roomName = room ? t.rooms.roomNames[room.name] : `Room ${n.room_id}`;

                        return (
                          <div key={n.id} className="text-sm">
                            <span className="font-semibold">{userName}</span> {language === 'zh' ? '預約了' : 'booked'} {roomName}
                          </div>
                        );
                      }) : <p className="text-sm text-muted-foreground">{t.notifications.noNew}</p>}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Card className="p-8 glass-effect cat-shadow border-amber-200 mb-8">
              <h1 className="text-3xl font-bold text-amber-800 mb-2">
                {t.admin.header}
              </h1>
              <p className="text-amber-600">
                {t.admin.subHeader}
              </p>
            </Card>

            <AdminDashboardStats 
              bookings={bookings} 
              users={users} 
              setFilterStatus={handleSetFilter} 
              rooms={rooms} 
              onToggleRoomVisibility={handleToggleRoomVisibility} 
            />


            <div className="flex space-x-4 mb-6">
              <Button
                onClick={() => { setActiveTab('calendar'); }}
                variant={activeTab === 'calendar' ? 'default' : 'outline'}
                className={activeTab === 'calendar' 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' 
                  : 'border-amber-300 text-amber-700'
                }
              >
                <Calendar className="w-4 h-4 mr-2" />
                {t.admin.calendarView}
              </Button>
              <Button
                onClick={() => { setActiveTab('bookings'); setFilterStatus('all'); }}
                variant={activeTab === 'bookings' ? 'default' : 'outline'}
                className={activeTab === 'bookings' 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' 
                  : 'border-amber-300 text-amber-700'
                }
              >
                <List className="w-4 h-4 mr-2" />
                {t.admin.bookings}
              </Button>
              <Button
                onClick={() => setActiveTab('users')}
                variant={activeTab === 'users' ? 'default' : 'outline'}
                className={activeTab === 'users' 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' 
                  : 'border-amber-300 text-amber-700'
                }
              >
                <Users className="w-4 h-4 mr-2" />
                {t.admin.users}
              </Button>
               <Button
                onClick={() => setActiveTab('reviews')}
                variant={activeTab === 'reviews' ? 'default' : 'outline'}
                className={activeTab === 'reviews'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                  : 'border-amber-300 text-amber-700'
                }
              >
                <Star className="w-4 h-4 mr-2" />
                {language === 'zh' ? '評價管理' : 'Reviews'}
              </Button>
              <Button
                onClick={() => setActiveTab('rooms')}
                variant={activeTab === 'rooms' ? 'default' : 'outline'}
                className={activeTab === 'rooms'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                  : 'border-amber-300 text-amber-700'
                }
              >
                <Home className="w-4 h-4 mr-2" />
                {language === 'zh' ? '房間管理' : 'Rooms'}
              </Button>
            </div>

            <Card className="p-8 glass-effect cat-shadow border-amber-200">
              {activeTab === 'calendar' && (
                <BookingCalendar bookings={bookings} onBookingClick={handleBookingClickFromCalendar} />
              )}
              {activeTab === 'bookings' && (
                <AdminBookingsTab bookings={filteredBookings} setBookings={setBookings} users={users} setUsers={setUsers} filterStatus={filterStatus} />
              )}
              {activeTab === 'users' && (
                <AdminUsersTab users={users} setUsers={setUsers} onRoleChange={handleRoleChange} onPasswordReset={handlePasswordReset} />
              )}
              {activeTab === 'reviews' && (
                <ReviewsTab bookings={bookings} reviews={reviews} setReviews={setReviews} isAdmin={true} />
              )}
              {activeTab === 'rooms' && (
                <AdminRoomsTab rooms={rooms} onRoomUpdate={handleRoomUpdate} />
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};