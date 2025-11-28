import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from "react-helmet-async";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Users, Calendar, List, Bell, Star, Home, Ban } from 'lucide-react';
import { AdminDashboardStats } from '@/components/admin/AdminDashboardStats';
import { AdminBookingsTab } from '@/components/admin/AdminBookingsTab';
import { AdminUsersTab } from '@/components/admin/AdminUsersTab';
import { AdminRoomsTab } from '@/components/admin/AdminRoomsTab';
import { BookingCalendar } from '@/components/admin/BookingCalendar';
import { AvailableDatesTab } from '@/components/admin/AvailableDatesTab';
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
import { auditService } from '@/services/auditService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [userToResetPassword, setUserToResetPassword] = useState(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [userToChangePassword, setUserToChangePassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
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

  // Show confirmation dialog for password reset
  const handlePasswordReset = (userId) => {
    setUserToResetPassword(userId);
  };

  // Confirm and execute password reset
  const confirmPasswordReset = async () => {
    if (!userToResetPassword) return;

    setIsResettingPassword(true);

    try {
      const targetUser = users.find(u => u.id === userToResetPassword);

      if (!targetUser || !targetUser.email) {
        toast({
          title: language === 'zh' ? '❌ 重設失敗' : '❌ Reset Failed',
          description: language === 'zh' ? '找不到用戶電郵' : 'User email not found',
          variant: 'destructive'
        });
        return;
      }

      // Step 1: Check rate limit (max 3 resets per hour)
      console.log('🔒 Checking rate limit for user:', userToResetPassword);
      const rateLimitCheck = await auditService.checkPasswordResetRateLimit(userToResetPassword);

      if (!rateLimitCheck.allowed) {
        toast({
          title: language === 'zh' ? '⚠️ 操作過於頻繁' : '⚠️ Too Many Attempts',
          description: language === 'zh'
            ? `此用戶的密碼重設請求過於頻繁。請稍後再試。（${rateLimitCheck.count} 次 / 小時）`
            : `Too many password reset requests for this user. Please try again later. (${rateLimitCheck.count} attempts in the last hour)`,
          variant: 'destructive',
          duration: 7000
        });
        return;
      }

      // Step 2: Send password reset email via Supabase
      const { supabase } = await import('@/lib/supabase');

      console.log('📧 Sending password reset email to:', targetUser.email);
      const { error } = await supabase.auth.resetPasswordForEmail(targetUser.email, {
        redirectTo: `${window.location.origin}/#/reset-password`,
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        toast({
          title: language === 'zh' ? '❌ 重設失敗' : '❌ Reset Failed',
          description: error.message || (language === 'zh' ? '無法發送重設郵件' : 'Failed to send reset email'),
          variant: 'destructive',
          duration: 5000
        });
        return;
      }

      // Step 3: Log the action in audit trail
      console.log('📝 Logging password reset action...');
      await auditService.logPasswordReset(userToResetPassword, {
        user_email: targetUser.email,
        user_name: targetUser.full_name || targetUser.name
      });

      // Step 4: Show success message
      toast({
        title: language === 'zh' ? '✅ 郵件已發送' : '✅ Email Sent',
        description: language === 'zh'
          ? `密碼重設郵件已發送到 ${targetUser.email}。此操作已記錄在系統日誌中。`
          : `Password reset email has been sent to ${targetUser.email}. This action has been logged.`,
        duration: 5000
      });

      console.log('✅ Password reset successful and logged');
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      toast({
        title: language === 'zh' ? '❌ 發生錯誤' : '❌ Error Occurred',
        description: error.message || (language === 'zh' ? '無法重設密碼' : 'Failed to reset password'),
        variant: 'destructive'
      });
    } finally {
      setIsResettingPassword(false);
      setUserToResetPassword(null);
    }
  };

  // Show dialog for direct password change
  const handleDirectPasswordChange = (userId) => {
    setUserToChangePassword(userId);
    setNewPassword('');
    setConfirmNewPassword('');
  };

  // Confirm and execute direct password change
  const confirmDirectPasswordChange = async () => {
    if (!userToChangePassword) return;

    // Validate passwords match
    if (newPassword !== confirmNewPassword) {
      toast({
        title: language === 'zh' ? '❌ 密碼不匹配' : '❌ Passwords do not match',
        description: language === 'zh' ? '請確保兩次輸入的密碼相同' : 'Please ensure both passwords are identical',
        variant: 'destructive'
      });
      return;
    }

    // Validate password strength
    if (newPassword.length < 6) {
      toast({
        title: language === 'zh' ? '❌ 密碼太短' : '❌ Password too short',
        description: language === 'zh' ? '密碼必須至少6個字符' : 'Password must be at least 6 characters',
        variant: 'destructive'
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const targetUser = users.find(u => u.id === userToChangePassword);

      if (!targetUser) {
        toast({
          title: language === 'zh' ? '❌ 找不到用戶' : '❌ User not found',
          variant: 'destructive'
        });
        return;
      }

      console.log('🔐 Calling admin password update Edge Function...');

      // Call Edge Function to update password
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/admin-update-user-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'x-application-name': 'ofcoz-family'
        },
        body: JSON.stringify({
          userId: userToChangePassword,
          newPassword: newPassword
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('❌ Password update error:', result.error);
        throw new Error(result.error || 'Failed to update password');
      }

      // Show success message
      toast({
        title: language === 'zh' ? '✅ 密碼已更新' : '✅ Password Updated',
        description: language === 'zh'
          ? `用戶 ${targetUser.email} 的密碼已成功更新。此操作已記錄在系統日誌中。`
          : `Password for ${targetUser.email} has been updated successfully. This action has been logged.`,
        duration: 5000
      });

      console.log('✅ Password updated successfully via Edge Function');

      // Close dialog and reset form
      setUserToChangePassword(null);
      setNewPassword('');
      setConfirmNewPassword('');

    } catch (error) {
      console.error('❌ Error updating password:', error);
      toast({
        title: language === 'zh' ? '❌ 更新失敗' : '❌ Update Failed',
        description: error.message || (language === 'zh' ? '無法更新密碼' : 'Failed to update password'),
        variant: 'destructive',
        duration: 7000
      });
    } finally {
      setIsChangingPassword(false);
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
    if (filterStatus === 'pending_cancellation_review') {
      return booking.status === 'cancelled' && !booking.cancellation_reviewed;
    }
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
              <Button
                onClick={() => setActiveTab('available-dates')}
                variant={activeTab === 'available-dates' ? 'default' : 'outline'}
                className={activeTab === 'available-dates'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                  : 'border-amber-300 text-amber-700'
                }
              >
                <Calendar className="w-4 h-4 mr-2" />
                {language === 'zh' ? '開放日期' : 'Available Dates'}
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
                <AdminUsersTab users={users} setUsers={setUsers} onRoleChange={handleRoleChange} onPasswordReset={handlePasswordReset} onDirectPasswordChange={handleDirectPasswordChange} />
              )}
              {activeTab === 'reviews' && (
                <ReviewsTab bookings={bookings} reviews={reviews} setReviews={setReviews} isAdmin={true} />
              )}
              {activeTab === 'rooms' && (
                <AdminRoomsTab rooms={rooms} onRoomUpdate={handleRoomUpdate} />
              )}
              {activeTab === 'available-dates' && (
                <AvailableDatesTab />
              )}
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Password Reset Confirmation Dialog */}
      <AlertDialog open={!!userToResetPassword} onOpenChange={(open) => !open && setUserToResetPassword(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'zh' ? '確認重設密碼' : 'Confirm Password Reset'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const targetUser = users.find(u => u.id === userToResetPassword);
                const userName = targetUser?.full_name || targetUser?.name || targetUser?.email || '';
                const userEmail = targetUser?.email || '';

                return language === 'zh'
                  ? `確定要為用戶 "${userName}" (${userEmail}) 發送密碼重設郵件嗎？\n\n用戶將收到一封包含重設連結的郵件。此操作將被記錄在系統日誌中。`
                  : `Are you sure you want to send a password reset email to "${userName}" (${userEmail})?\n\nThe user will receive an email with a reset link. This action will be logged.`;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResettingPassword}>
              {language === 'zh' ? '取消' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPasswordReset}
              disabled={isResettingPassword}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              {isResettingPassword
                ? (language === 'zh' ? '發送中...' : 'Sending...')
                : (language === 'zh' ? '確認發送' : 'Confirm Send')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Direct Password Change Dialog */}
      <AlertDialog open={!!userToChangePassword} onOpenChange={(open) => {
        if (!open) {
          setUserToChangePassword(null);
          setNewPassword('');
          setConfirmNewPassword('');
        }
      }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'zh' ? '直接設定密碼' : 'Set Password Directly'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const targetUser = users.find(u => u.id === userToChangePassword);
                const userName = targetUser?.full_name || targetUser?.name || targetUser?.email || '';
                const userEmail = targetUser?.email || '';

                return language === 'zh'
                  ? `為用戶 "${userName}" (${userEmail}) 設定新密碼。\n\n用戶將立即使用新密碼登入。此操作將被記錄在系統日誌中。`
                  : `Set a new password for "${userName}" (${userEmail}).\n\nThe user will be able to login immediately with the new password. This action will be logged.`;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">
                {language === 'zh' ? '新密碼' : 'New Password'}
              </Label>
              <PasswordInput
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={language === 'zh' ? '輸入新密碼（至少6個字符）' : 'Enter new password (min 6 characters)'}
                disabled={isChangingPassword}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">
                {language === 'zh' ? '確認新密碼' : 'Confirm New Password'}
              </Label>
              <PasswordInput
                id="confirm-new-password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder={language === 'zh' ? '再次輸入新密碼' : 'Re-enter new password'}
                disabled={isChangingPassword}
                className="w-full"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isChangingPassword}>
              {language === 'zh' ? '取消' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDirectPasswordChange}
              disabled={isChangingPassword || !newPassword || !confirmNewPassword}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              {isChangingPassword
                ? (language === 'zh' ? '更新中...' : 'Updating...')
                : (language === 'zh' ? '確認更新' : 'Confirm Update')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};