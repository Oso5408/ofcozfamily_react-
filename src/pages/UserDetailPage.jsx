import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from "react-helmet-async";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Plus, Minus, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import { PackageAssignmentModal } from '@/components/admin/PackageAssignmentModal';
import { bookingService } from '@/services/bookingService';
import { userService } from '@/services/userService';
import { supabase } from '@/lib/supabase';

export const UserDetailPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: adminUser, assignBRPackage, assignDP20Package, refreshProfile } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();

  const [userProfile, setUserProfile] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const [packageHistory, setPackageHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'deduct'
  const [isBookingExpanded, setIsBookingExpanded] = useState(true);
  const [isPackageExpanded, setIsPackageExpanded] = useState(true);
  const [bookingStartDate, setBookingStartDate] = useState('');
  const [bookingEndDate, setBookingEndDate] = useState('');
  const [editingExpiryId, setEditingExpiryId] = useState(null);
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Check admin access
  useEffect(() => {
    if (!adminUser || (!adminUser.isAdmin && !adminUser.is_admin)) {
      navigate('/');
      return;
    }
  }, [adminUser, navigate]);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);

        // Fetch user profile
        const profileResult = await userService.getUserProfile(userId);
        if (profileResult.success) {
          setUserProfile(profileResult.profile);
        } else {
          toast({
            title: language === 'zh' ? '載入失敗' : 'Load Failed',
            description: language === 'zh' ? '無法載入用戶資料' : 'Failed to load user data',
            variant: 'destructive'
          });
        }

        // Fetch user bookings
        const bookingsResult = await bookingService.getUserBookings(userId);
        if (bookingsResult.success) {
          setUserBookings(bookingsResult.bookings || []);
        }

        // Fetch package history
        const { data: historyData, error: historyError } = await supabase
          .from('package_history')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!historyError && historyData) {
          setPackageHistory(historyData);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast({
          title: language === 'zh' ? '發生錯誤' : 'Error Occurred',
          description: language === 'zh' ? '無法載入數據' : 'Failed to load data',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadUserData();
    }
  }, [userId, language, toast]);

  const handlePackageAssignment = async (packageData) => {
    const { packageType, quantity, expiry, reason, mode } = packageData;

    try {
      let result;
      // For deduction, quantity should be negative
      const amount = mode === 'deduct' ? -Math.abs(quantity) : quantity;

      // Call the function once with quantity as the amount, and pass expiry date
      if (packageType === 'DP20') {
        result = await assignDP20Package(userId, adminUser.id, amount, expiry, reason);
      } else {
        // BR15 or BR30
        result = await assignBRPackage(userId, packageType, adminUser.id, amount, expiry, reason);
      }

      if (result && result.success) {
        // Refresh user profile
        const profileResult = await userService.getUserProfile(userId);
        if (profileResult.success) {
          setUserProfile(profileResult.profile);
        }

        // Refresh package history
        const { data: historyData } = await supabase
          .from('package_history')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (historyData) {
          setPackageHistory(historyData);
        }

        const actionText = mode === 'deduct'
          ? (language === 'zh' ? '已扣除' : 'Deducted')
          : (language === 'zh' ? '已分配' : 'Assigned');

        toast({
          title: language === 'zh' ? `套票${actionText}` : `Package ${actionText}`,
          description: reason
            ? `${language === 'zh' ? `已成功${actionText} ${packageType} 套票` : `Successfully ${actionText.toLowerCase()} ${packageType} package`} - ${language === 'zh' ? '原因' : 'Reason'}: ${reason}`
            : language === 'zh'
              ? `已成功${actionText} ${packageType} 套票`
              : `Successfully ${actionText.toLowerCase()} ${packageType} package`
        });
      } else {
        toast({
          title: mode === 'deduct'
            ? (language === 'zh' ? '扣除失敗' : 'Deduction Failed')
            : (language === 'zh' ? '分配失敗' : 'Assignment Failed'),
          description: result?.error || (language === 'zh' ? '發生錯誤' : 'An error occurred'),
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error assigning package:', error);
      toast({
        title: mode === 'deduct'
          ? (language === 'zh' ? '扣除失敗' : 'Deduction Failed')
          : (language === 'zh' ? '分配失敗' : 'Assignment Failed'),
        description: language === 'zh' ? '發生錯誤' : 'An error occurred',
        variant: 'destructive'
      });
    }
  };

  // Filter bookings by date range and sort by date (newest first)
  const filteredBookings = userBookings
    .filter(booking => {
      if (!bookingStartDate && !bookingEndDate) return true;

      const bookingDate = new Date(booking.start_time);
      const startDate = bookingStartDate ? new Date(bookingStartDate) : null;
      const endDate = bookingEndDate ? new Date(bookingEndDate + 'T23:59:59') : null;

      if (startDate && endDate) {
        return bookingDate >= startDate && bookingDate <= endDate;
      } else if (startDate) {
        return bookingDate >= startDate;
      } else if (endDate) {
        return bookingDate <= endDate;
      }
      return true;
    })
    .sort((a, b) => new Date(b.start_time) - new Date(a.start_time)); // Sort newest first

  const clearBookingFilter = () => {
    setBookingStartDate('');
    setBookingEndDate('');
  };

  const handleEditExpiry = (item) => {
    setEditingExpiryId(item.id);
    setNewExpiryDate(item.expiry_date ? item.expiry_date.split('T')[0] : '');
  };

  const handleSaveExpiry = async (itemId) => {
    try {
      console.log('🔄 Attempting to update expiry date:', { itemId, newExpiryDate });

      const { data, error } = await supabase
        .from('package_history')
        .update({ expiry_date: newExpiryDate })
        .eq('id', itemId)
        .select();

      if (error) {
        console.error('❌ Supabase error:', error);

        // Check if it's a permission error
        if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
          toast({
            title: language === 'zh' ? '權限錯誤' : 'Permission Error',
            description: language === 'zh'
              ? '缺少更新權限。請在 Supabase 執行 add-package-history-update-policy.sql'
              : 'Missing UPDATE policy. Please run add-package-history-update-policy.sql in Supabase',
            variant: 'destructive',
            duration: 10000
          });
          return;
        }

        throw error;
      }

      console.log('✅ Update successful:', data);

      // Refresh package history
      const { data: historyData } = await supabase
        .from('package_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (historyData) {
        setPackageHistory(historyData);
      }

      setEditingExpiryId(null);
      setNewExpiryDate('');

      toast({
        title: language === 'zh' ? '更新成功' : 'Updated Successfully',
        description: language === 'zh' ? '到期日已更新' : 'Expiry date has been updated'
      });
    } catch (error) {
      console.error('❌ Error updating expiry date:', error);
      toast({
        title: language === 'zh' ? '更新失敗' : 'Update Failed',
        description: error.message || (language === 'zh' ? '無法更新到期日' : 'Failed to update expiry date'),
        variant: 'destructive'
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingExpiryId(null);
    setNewExpiryDate('');
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setEditedProfile({
      full_name: userProfile.full_name || userProfile.name || '',
      email: userProfile.email || '',
      phone: userProfile.phone || ''
    });
  };

  const handleCancelProfileEdit = () => {
    setIsEditingProfile(false);
    setEditedProfile({});
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      console.log('🔄 Updating user profile:', { userId, editedProfile });

      const { data, error } = await supabase
        .from('users')
        .update({
          full_name: editedProfile.full_name,
          email: editedProfile.email,
          phone: editedProfile.phone
        })
        .eq('id', userId)
        .select();

      if (error) {
        console.error('❌ Supabase error:', error);

        // Check if it's a permission error
        if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
          toast({
            title: language === 'zh' ? '權限錯誤' : 'Permission Error',
            description: language === 'zh'
              ? '缺少更新權限。請在 Supabase 執行 check-and-fix-users-update-policy.sql'
              : 'Missing UPDATE policy. Please run check-and-fix-users-update-policy.sql in Supabase',
            variant: 'destructive',
            duration: 10000
          });
          return;
        }

        throw error;
      }

      console.log('✅ Profile update successful:', data);

      // Refresh user profile
      const profileResult = await userService.getUserProfile(userId);
      if (profileResult.success) {
        setUserProfile(profileResult.profile);
      }

      setIsEditingProfile(false);
      setEditedProfile({});

      toast({
        title: language === 'zh' ? '更新成功' : 'Updated Successfully',
        description: language === 'zh' ? '用戶資料已更新' : 'User profile has been updated'
      });
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      toast({
        title: language === 'zh' ? '更新失敗' : 'Update Failed',
        description: error.message || (language === 'zh' ? '無法更新用戶資料' : 'Failed to update user profile'),
        variant: 'destructive'
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const getStatusBadge = (booking) => {
    const status = booking.status || 'pending';
    const statusColors = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    };

    const statusText = {
      confirmed: language === 'zh' ? '確認' : 'Confirmed',
      pending: language === 'zh' ? '待處理' : 'Pending',
      cancelled: language === 'zh' ? '已取消' : 'Cancelled',
      completed: language === 'zh' ? '已完成' : 'Completed'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || statusColors.pending}`}>
        {statusText[status] || status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-amber-700">
          {language === 'zh' ? '載入中...' : 'Loading...'}
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-amber-700">
          {language === 'zh' ? '找不到用戶' : 'User not found'}
        </div>
      </div>
    );
  }

  const userName = userProfile.name || userProfile.full_name || userProfile.email;

  return (
    <>
      <Helmet>
        <title>{`${userName} - ${t.adminPage.title} - Ofcoz Family`}</title>
      </Helmet>

      <div className="min-h-screen p-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <Link
                to="/admin"
                className="inline-flex items-center text-amber-700 hover:text-amber-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                {language === 'zh' ? '返回客戶管理' : 'Back to User Management'}
              </Link>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Left Column - User Details */}
              <Card className="p-6 glass-effect cat-shadow border-amber-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-amber-800">
                    {language === 'zh' ? '詳情' : 'Details'}
                  </h2>
                  {!isEditingProfile && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEditProfile}
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      {language === 'zh' ? '編輯' : 'Edit'}
                    </Button>
                  )}
                </div>

                {/* Profile Photo Placeholder */}
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-20 h-20 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl text-amber-700">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-amber-800 mb-1">
                      {userName}
                    </h3>
                    {userProfile.is_admin && (
                      <span className="inline-block px-2 py-1 bg-amber-500 text-white text-xs rounded-full">
                        {language === 'zh' ? '管理員' : 'Admin'}
                      </span>
                    )}
                  </div>
                </div>

                {/* User Information */}
                <div className="space-y-4">
                  {isEditingProfile ? (
                    <>
                      {/* Editing Mode */}
                      <div>
                        <Label className="text-amber-800 mb-2">
                          {language === 'zh' ? '姓名' : 'Name'}
                        </Label>
                        <Input
                          value={editedProfile.full_name || ''}
                          onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
                          className="border-amber-200 focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <Label className="text-amber-800 mb-2">
                          {language === 'zh' ? '電郵' : 'Email'}
                        </Label>
                        <Input
                          type="email"
                          value={editedProfile.email || ''}
                          onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                          className="border-amber-200 focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <Label className="text-amber-800 mb-2">
                          {language === 'zh' ? '電話' : 'Phone'}
                        </Label>
                        <Input
                          value={editedProfile.phone || ''}
                          onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                          className="border-amber-200 focus:border-amber-400"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4">
                        <Button
                          onClick={handleSaveProfile}
                          disabled={isSavingProfile}
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white flex-1"
                        >
                          {isSavingProfile ? (language === 'zh' ? '保存中...' : 'Saving...') : (language === 'zh' ? '保存' : 'Save')}
                        </Button>
                        <Button
                          onClick={handleCancelProfileEdit}
                          variant="outline"
                          disabled={isSavingProfile}
                          className="border-amber-300 text-amber-700 flex-1"
                        >
                          {language === 'zh' ? '取消' : 'Cancel'}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Display Mode */}
                      <div>
                        <p className="text-sm text-amber-600 mb-1">
                          {language === 'zh' ? '姓名' : 'Name'}
                        </p>
                        <p className="text-amber-800 font-medium">
                          {userProfile.full_name || userProfile.name || '-'}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-amber-600 mb-1">
                          {language === 'zh' ? '電郵' : 'Email'}
                        </p>
                        <p className="text-amber-800 font-medium">
                          {userProfile.email}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-amber-600 mb-1">
                          {language === 'zh' ? '電話' : 'Phone'}
                        </p>
                        <p className="text-amber-800 font-medium">
                          {userProfile.phone || '-'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* Right Column - Booking Records */}
              <Card className="p-6 glass-effect cat-shadow border-amber-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-amber-800">
                    {language === 'zh' ? '預訂紀錄' : 'Booking Records'}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsBookingExpanded(!isBookingExpanded)}
                  >
                    {isBookingExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </Button>
                </div>

                {isBookingExpanded && (
                  <>
                    {/* Date Filter */}
                    <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-amber-800 text-sm mb-1">
                            {language === 'zh' ? '開始日期' : 'Start Date'}
                          </Label>
                          <DatePicker
                            value={bookingStartDate}
                            onChange={(e) => setBookingStartDate(e.target.value)}
                            className="border-amber-200 focus:border-amber-400 w-full"
                          />
                        </div>
                        <div>
                          <Label className="text-amber-800 text-sm mb-1">
                            {language === 'zh' ? '結束日期' : 'End Date'}
                          </Label>
                          <DatePicker
                            value={bookingEndDate}
                            onChange={(e) => setBookingEndDate(e.target.value)}
                            className="border-amber-200 focus:border-amber-400 w-full"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            onClick={clearBookingFilter}
                            variant="outline"
                            size="sm"
                            className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                          >
                            {language === 'zh' ? '清除篩選' : 'Clear Filter'}
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-amber-600 mt-2">
                        {language === 'zh'
                          ? `顯示 ${filteredBookings.length} 筆預訂 (共 ${userBookings.length} 筆)`
                          : `Showing ${filteredBookings.length} bookings (of ${userBookings.length} total)`}
                      </p>
                    </div>

                    {/* Booking List */}
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {filteredBookings.length === 0 ? (
                        <p className="text-amber-600 text-center py-8">
                          {language === 'zh' ? '暫無預訂紀錄' : 'No booking records'}
                        </p>
                      ) : (
                        filteredBookings.map((booking) => {
                        // Parse notes to get additional booking info
                        let bookingNotes = {};
                        try {
                          bookingNotes = typeof booking.notes === 'string' ? JSON.parse(booking.notes) : booking.notes || {};
                        } catch (e) {
                          console.error('Failed to parse booking notes:', e);
                        }

                        const roomName = booking.rooms?.name || `Room ${booking.room_id}`;
                        const startTime = new Date(booking.start_time);
                        const endTime = new Date(booking.end_time);

                        return (
                          <Card key={booking.id} className="p-4 border-amber-200 hover:shadow-md transition-shadow">
                            <div className="space-y-2">
                              {/* Header Row */}
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-amber-800">
                                    {t.rooms?.roomNames?.[roomName] || roomName}
                                  </p>
                                  <p className="text-sm text-amber-600">
                                    {startTime.toLocaleDateString(language === 'zh' ? 'zh-HK' : 'en-US')}
                                  </p>
                                </div>
                                {getStatusBadge(booking)}
                              </div>

                              {/* Time and Receipt */}
                              <div className="text-sm text-amber-600">
                                <p>
                                  {language === 'zh' ? '時間' : 'Time'}: {startTime.toLocaleTimeString(language === 'zh' ? 'zh-HK' : 'en-US', { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString(language === 'zh' ? 'zh-HK' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {booking.receipt_number && (
                                  <p className="text-xs text-amber-500 mt-1">
                                    {language === 'zh' ? '收據號' : 'Receipt'}: {booking.receipt_number}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Card>
                        );
                      })
                    )}
                    </div>
                  </>
                )}
              </Card>
            </div>

            {/* Package Settings Section (代幣設定) - Bottom */}
            <Card className="p-6 glass-effect cat-shadow border-amber-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-amber-800">
                  {language === 'zh' ? '代幣設定' : 'Package Settings'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPackageExpanded(!isPackageExpanded)}
                >
                  {isPackageExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </Button>
              </div>

              {isPackageExpanded && (
                <>
                  {/* Package Type Selector and Balance Display */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-amber-600 mb-2">{language === 'zh' ? '代幣' : 'Package'}</p>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-semibold text-amber-800">
                            BR 30 {language === 'zh' ? '小時' : 'Hours'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-amber-600 mb-2">{language === 'zh' ? '尚餘代幣數量' : 'Remaining Balance'}</p>
                        <p className="text-3xl font-bold text-amber-800">
                          {(userProfile.br15_balance || 0) + (userProfile.br30_balance || 0) + (userProfile.dp20_balance || 0)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-amber-600">
                      {language === 'zh' ? '如需增值,付款後請聯絡客服.' : 'To top up, please contact customer service after payment.'}
                    </p>
                    <div className="flex gap-3 mt-3">
                      <Button
                        onClick={() => {
                          setModalMode('add');
                          setIsModalOpen(true);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {language === 'zh' ? '增值' : 'Add'}
                      </Button>
                      <Button
                        onClick={() => {
                          setModalMode('deduct');
                          setIsModalOpen(true);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Minus className="w-4 h-4 mr-1" />
                        {language === 'zh' ? '扣除' : 'Deduct'}
                      </Button>
                    </div>
                  </div>

                  {/* Package History Table */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-amber-800 mb-4">
                      {language === 'zh' ? '代幣記錄' : 'Package History'}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-amber-50 border-b border-amber-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-amber-800">
                              {language === 'zh' ? '代幣 / 數量' : 'Package / Amount'}
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-amber-800">
                              {language === 'zh' ? '詳情' : 'Details'}
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-amber-800">
                              {language === 'zh' ? '到期日' : 'Expiry Date'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {packageHistory.length === 0 ? (
                            <tr>
                              <td colSpan="3" className="px-4 py-8 text-center text-amber-600">
                                {language === 'zh' ? '暫無代幣記錄' : 'No package history'}
                              </td>
                            </tr>
                          ) : (
                            packageHistory.map((item) => {
                              // Display package name with amount
                              const packageDisplay = `${item.package_type} ${language === 'zh' ? '小時' : 'Hours'}`;
                              const amountDisplay = `(${item.br_amount})`;

                              return (
                                <tr key={item.id} className="border-b border-amber-100 hover:bg-amber-50">
                                  <td className="px-4 py-3">
                                    <p className="font-semibold text-amber-800">
                                      {packageDisplay} <span className="text-green-600">{amountDisplay}</span>
                                    </p>
                                    <p className="text-xs text-amber-600 mt-1">
                                      {item.id?.substring(0, 8).toUpperCase() || 'N/A'}
                                    </p>
                                  </td>
                                  <td className="px-4 py-3">
                                    <p className="text-sm text-amber-700">
                                      {item.reason || item.notes || (language === 'zh' ? '增值 ( 人手 )' : 'Top up (Manual)')}
                                    </p>
                                    <p className="text-xs text-amber-500 mt-1">
                                      {new Date(item.created_at).toLocaleDateString(language === 'zh' ? 'zh-HK' : 'en-US', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit'
                                      })}
                                    </p>
                                  </td>
                                  <td className="px-4 py-3">
                                    {editingExpiryId === item.id ? (
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="date"
                                          value={newExpiryDate}
                                          onChange={(e) => setNewExpiryDate(e.target.value)}
                                          className="border-amber-200 focus:border-amber-400 text-sm"
                                        />
                                        <Button
                                          size="sm"
                                          onClick={() => handleSaveExpiry(item.id)}
                                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs"
                                        >
                                          {language === 'zh' ? '保存' : 'Save'}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={handleCancelEdit}
                                          className="border-amber-300 text-amber-700 px-2 py-1 text-xs"
                                        >
                                          {language === 'zh' ? '取消' : 'Cancel'}
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm text-amber-700">
                                          {item.expiry_date
                                            ? new Date(item.expiry_date).toLocaleDateString(language === 'zh' ? 'zh-HK' : 'en-US', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit'
                                              })
                                            : (language === 'zh' ? '無限期' : 'Unlimited')}
                                        </p>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleEditExpiry(item)}
                                          className="p-1 h-auto hover:bg-amber-100"
                                        >
                                          <Edit2 className="w-4 h-4 text-amber-600" />
                                        </Button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                      {packageHistory.length > 0 && (
                        <p className="text-xs text-amber-600 mt-2">
                          {language === 'zh'
                            ? `顯示第 1 到 ${packageHistory.length} 項，共 ${packageHistory.length} 項結果`
                            : `Showing 1 to ${packageHistory.length} of ${packageHistory.length} results`}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Package Assignment Modal */}
      <PackageAssignmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handlePackageAssignment}
        userId={userId}
        userName={userName}
        language={language}
        mode={modalMode}
      />
    </>
  );
};
