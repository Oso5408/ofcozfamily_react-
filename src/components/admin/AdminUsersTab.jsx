import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { useToast } from '@/components/ui/use-toast';
import { Eye, Shield, User, KeyRound, Trash2, Search, ChevronDown, Mail, Lock, UserPlus } from 'lucide-react';
import { CreateUserModal } from './CreateUserModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const AdminUsersTab = ({ users, setUsers, onRoleChange, onPasswordReset, onDirectPasswordChange, onRefreshUsers }) => {
  const navigate = useNavigate();
  const { user: adminUser, deleteUser } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);

  const safeUsers = users || [];

  // Filter users based on search query (name & phone)
  const filteredUsers = safeUsers.filter(user => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const userName = (user.name || user.full_name || user.email || '').toLowerCase();
    const userPhone = (user.phone || '').toLowerCase();

    return userName.includes(query) || userPhone.includes(query);
  });

  const handleDeleteUser = async (userId) => {
    console.log('🗑️ handleDeleteUser called with userId:', userId);

    if (!userId) {
      console.warn('⚠️ No user ID provided for deletion');
      return;
    }

    if (!deleteUser) {
      console.error('❌ deleteUser function not available from useAuth');
      toast({
        title: language === 'zh' ? '刪除失敗' : 'Delete Failed',
        description: language === 'zh' ? '刪除功能不可用' : 'Delete function not available',
        variant: 'destructive'
      });
      return;
    }

    try {
      console.log('📞 Calling deleteUser function...');
      const result = await deleteUser(userId);
      console.log('📬 deleteUser result:', result);

      if (result && result.success) {
        console.log('✅ Delete successful, updating UI');
        setUsers(safeUsers.filter(u => u.id !== userId));
        toast({
          title: language === 'zh' ? '用戶已刪除' : 'User Deleted',
          description: result.warning || (language === 'zh' ? '用戶資料已從資料庫刪除' : 'User profile has been removed from database'),
          duration: 5000
        });
      } else {
        console.error('❌ Delete failed:', result);
        toast({
          title: language === 'zh' ? '刪除失敗' : 'Delete Failed',
          description: result?.error || (language === 'zh' ? '無法刪除用戶' : 'Failed to delete user'),
          variant: 'destructive',
          duration: 7000
        });
      }
    } catch (error) {
      console.error('❌ Delete user error:', error);
      toast({
        title: language === 'zh' ? '發生錯誤' : 'Error Occurred',
        description: error.message || (language === 'zh' ? '無法刪除用戶' : 'Failed to delete user'),
        variant: 'destructive'
      });
    } finally {
      console.log('🧹 Cleaning up, closing dialog');
      setUserToDelete(null);
    }
  };

  const handleViewDetails = (userId) => {
    navigate(`/admin/users/${userId}`);
  };

  const handleUserCreated = async () => {
    // Refresh user list without page reload to prevent session issues
    console.log('👤 User created, refreshing list...');
    if (onRefreshUsers) {
      await onRefreshUsers();
    } else {
      console.warn('⚠️ onRefreshUsers not provided, falling back to reload');
      window.location.reload();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-amber-800">
          {language === 'zh' ? '客戶管理' : 'User Management'}
        </h2>
        <Button
          onClick={() => setShowCreateUserModal(true)}
          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {language === 'zh' ? '新增用戶' : 'Create User'}
        </Button>
      </div>

      {/* Search Filter */}
      <Card className="p-4 mb-6 border-amber-200">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-amber-600" />
          <Input
            type="text"
            placeholder={language === 'zh' ? '搜尋用戶名稱或電話' : 'Search by name or phone'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-amber-200 focus:border-amber-400"
          />
        </div>
        <p className="text-xs text-amber-600 mt-2">
          {language === 'zh'
            ? `顯示 ${filteredUsers.length} / ${safeUsers.length} 位用戶`
            : `Showing ${filteredUsers.length} / ${safeUsers.length} users`}
        </p>
      </Card>

      {/* User List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <Card className="p-8 text-center border-amber-200">
            <p className="text-amber-600">
              {searchQuery.trim()
                ? (language === 'zh' ? '找不到符合的用戶' : 'No users found')
                : (language === 'zh' ? '暫無用戶' : 'No users yet')}
            </p>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-amber-200 rounded-lg p-6 bg-white/50"
            >
              {/* User Card Content */}
              <div className="space-y-4">
                {/* Top Row: User Info and Actions */}
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-amber-800">
                        {user.name || user.full_name || user.email}
                      </h3>
                      {(user.isAdmin || user.is_admin) && (
                        <span className="px-2 py-1 bg-amber-500 text-white text-xs rounded-full">
                          {language === 'zh' ? '管理員' : 'Admin'}
                        </span>
                      )}
                    </div>
                    <p className="text-amber-600 text-sm">{user.email}</p>
                    {user.phone && (
                      <p className="text-amber-600 text-sm">{language === 'zh' ? '電話' : 'Phone'}: {user.phone}</p>
                    )}
                    <p className="text-sm text-amber-500 mt-1">
                      {language === 'zh' ? '註冊於' : 'Registered on'}: {new Date(user.created_at || user.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 flex-wrap gap-2">

                    {/* Action Buttons */}
                    <Button
                      onClick={() => handleViewDetails(user.id)}
                      variant="default"
                      size="sm"
                      className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {language === 'zh' ? '編輯' : 'Edit'}
                    </Button>

                    {adminUser.id !== user.id && (
                      <>
                        {/* Password Management Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <KeyRound className="w-4 h-4 mr-2" />
                              {language === 'zh' ? '密碼管理' : 'Password'}
                              <ChevronDown className="w-4 h-4 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => onPasswordReset(user.id)}>
                              <Mail className="w-4 h-4 mr-2" />
                              {language === 'zh' ? '發送重設郵件' : 'Send Reset Email'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDirectPasswordChange(user.id)}>
                              <Lock className="w-4 h-4 mr-2" />
                              {language === 'zh' ? '直接更改密碼' : 'Set Password Directly'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                          onClick={() => onRoleChange(user.id, !(user.isAdmin || user.is_admin))}
                          variant={(user.isAdmin || user.is_admin) ? "destructive" : "default"}
                          size="sm"
                          className={(user.isAdmin || user.is_admin) ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"}
                        >
                          {(user.isAdmin || user.is_admin) ? <User className="w-4 h-4 mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                          {(user.isAdmin || user.is_admin) ? t.admin.demoteToUser : t.admin.promoteToAdmin}
                        </Button>

                        {/* Delete Button */}
                        <Button
                          onClick={() => {
                            console.log('🔴 DELETE BUTTON CLICKED for user:', user.id, user.email);
                            setUserToDelete(user.id);
                          }}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {language === 'zh' ? '刪除' : 'Delete'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Package Balances Section */}
                <div className="border-t border-amber-200 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* BR15 Package */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-600 mb-1">
                        BR 15 {language === 'zh' ? '小時' : 'Hours'}
                      </p>
                      <p className="text-3xl font-bold text-blue-700">
                        {user.br15_balance || 0}
                      </p>
                      {user.br15_expiry && (
                        <p className="text-xs text-blue-600 mt-2">
                          {language === 'zh' ? '有效期至' : 'Valid until'}: {new Date(user.br15_expiry).toLocaleDateString(language === 'zh' ? 'zh-HK' : 'en-US')}
                        </p>
                      )}
                    </div>

                    {/* BR30 Package */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                      <p className="text-sm font-medium text-purple-600 mb-1">
                        BR 30 {language === 'zh' ? '小時' : 'Hours'}
                      </p>
                      <p className="text-3xl font-bold text-purple-700">
                        {user.br30_balance || 0}
                      </p>
                      {user.br30_expiry && (
                        <p className="text-xs text-purple-600 mt-2">
                          {language === 'zh' ? '有效期至' : 'Valid until'}: {new Date(user.br30_expiry).toLocaleDateString(language === 'zh' ? 'zh-HK' : 'en-US')}
                        </p>
                      )}
                    </div>

                    {/* DP20 Package */}
                    <div className="bg-gradient-to-br from-green-50 to-teal-100 p-4 rounded-lg border border-green-200">
                      <p className="text-sm font-medium text-green-600 mb-1">
                        DP20 {language === 'zh' ? '日' : 'Days'}
                      </p>
                      <p className="text-3xl font-bold text-green-700">
                        {user.dp20_balance || 0}
                      </p>
                      {user.dp20_expiry && (
                        <p className="text-xs text-green-600 mt-2">
                          {language === 'zh' ? '有效期至' : 'Valid until'}: {new Date(user.dp20_expiry).toLocaleDateString(language === 'zh' ? 'zh-HK' : 'en-US')}
                          {new Date(user.dp20_expiry) < new Date() && (
                            <span className="ml-2 text-red-600 font-semibold">
                              ({language === 'zh' ? '已過期' : 'Expired'})
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Delete Confirmation Dialog - Outside the card content area */}
              <AlertDialog open={userToDelete === user.id} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{language === 'zh' ? '確認刪除用戶' : 'Confirm User Deletion'}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {language === 'zh' ? `您確定要永久刪除用戶 ${user.name || user.full_name || user.email} 嗎？此操作無法撤銷。` : `Are you sure you want to permanently delete the user ${user.name || user.full_name || user.email}? This action cannot be undone.`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => {
                      console.log('🔵 CANCEL clicked');
                      setUserToDelete(null);
                    }}>
                      {language === 'zh' ? '返回' : 'Back'}
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                      console.log('🟢 CONFIRM DELETE clicked for:', user.id);
                      handleDeleteUser(user.id);
                    }}>
                      {language === 'zh' ? '確認刪除' : 'Confirm Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </motion.div>
          ))
        )}
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        onUserCreated={handleUserCreated}
      />
    </div>
  );
};
