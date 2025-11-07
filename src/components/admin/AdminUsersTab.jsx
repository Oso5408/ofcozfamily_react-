import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { useToast } from '@/components/ui/use-toast';
import { Eye, Shield, User, KeyRound, Edit, Trash2, Search } from 'lucide-react';
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

export const AdminUsersTab = ({ users, setUsers, onRoleChange, onPasswordReset }) => {
  const navigate = useNavigate();
  const { user: adminUser, updateUser, deleteUser } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '' });
  const [userToDelete, setUserToDelete] = useState(null);

  const safeUsers = users || [];

  // Filter users based on search query (name & phone)
  const filteredUsers = safeUsers.filter(user => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const userName = (user.name || user.full_name || user.email || '').toLowerCase();
    const userPhone = (user.phone || '').toLowerCase();

    return userName.includes(query) || userPhone.includes(query);
  });

  const startEdit = (user) => {
    setEditingUser(user.id);
    setProfileData({ name: user.name, email: user.email, phone: user.phone || '' });
  };

  const cancelEdit = () => {
    setEditingUser(null);
  };

  const handleProfileUpdate = () => {
    if (!editingUser) return;
    const updatedUser = updateUser(profileData, editingUser);
    setUsers(safeUsers.map(u => u.id === editingUser ? { ...u, ...updatedUser } : u));
    toast({ title: t.dashboard.profileUpdated });
    setEditingUser(null);
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;
    deleteUser(userToDelete);
    setUsers(safeUsers.filter(u => u.id !== userToDelete));
    toast({ title: language === 'zh' ? '用戶已刪除' : 'User Deleted' });
    setUserToDelete(null);
  };

  const handleViewDetails = (userId) => {
    navigate(`/admin/users/${userId}`);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-amber-800 mb-6">
        {language === 'zh' ? '客戶管理' : 'User Management'}
      </h2>

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
              {editingUser === user.id ? (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label className="text-amber-800">{language === 'zh' ? '姓名' : 'Name'}</Label>
                      <Input value={profileData.name} onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))} className="border-amber-200 focus:border-amber-400" />
                    </div>
                    <div>
                      <Label className="text-amber-800">{language === 'zh' ? '電郵' : 'Email'}</Label>
                      <Input value={profileData.email} onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))} className="border-amber-200 focus:border-amber-400" />
                    </div>
                    <div>
                      <Label className="text-amber-800">{language === 'zh' ? '電話' : 'Phone'}</Label>
                      <Input value={profileData.phone} onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))} className="border-amber-200 focus:border-amber-400" />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleProfileUpdate} size="sm">{language === 'zh' ? '保存' : 'Save'}</Button>
                    <Button onClick={cancelEdit} variant="outline" size="sm">{language === 'zh' ? '取消' : 'Cancel'}</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1">
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
                    {/* Package Balances */}
                    <div className="text-right mr-4">
                      <div className="flex gap-2 text-xs flex-wrap">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                          BR15: {user.br15_balance || 0}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-medium">
                          BR30: {user.br30_balance || 0}
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
                          DP20: {user.dp20_balance || 0}
                        </span>
                      </div>
                      {user.dp20_expiry && (
                        <p className="text-xs text-green-600 mt-1">
                          {language === 'zh' ? 'DP20 有效期至' : 'DP20 valid until'}: {new Date(user.dp20_expiry).toLocaleDateString(language === 'zh' ? 'zh-HK' : 'en-US')}
                        </p>
                      )}
                    </div>

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
                        <Button onClick={() => startEdit(user)} variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          {language === 'zh' ? '修改' : 'Modify'}
                        </Button>
                        <Button onClick={() => onPasswordReset(user.id)} variant="outline" size="sm">
                          <KeyRound className="w-4 h-4 mr-2" />
                          {t.admin.resetPassword}
                        </Button>
                        <Button
                          onClick={() => onRoleChange(user.id, !(user.isAdmin || user.is_admin))}
                          variant={(user.isAdmin || user.is_admin) ? "destructive" : "default"}
                          size="sm"
                          className={(user.isAdmin || user.is_admin) ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"}
                        >
                          {(user.isAdmin || user.is_admin) ? <User className="w-4 h-4 mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                          {(user.isAdmin || user.is_admin) ? t.admin.demoteToUser : t.admin.promoteToAdmin}
                        </Button>
                        <AlertDialog open={userToDelete === user.id} onOpenChange={() => setUserToDelete(null)}>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" onClick={() => setUserToDelete(user.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              {language === 'zh' ? '刪除' : 'Delete'}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{language === 'zh' ? '確認刪除用戶' : 'Confirm User Deletion'}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {language === 'zh' ? `您確定要永久刪除用戶 ${user.name} 嗎？此操作無法撤銷。` : `Are you sure you want to permanently delete the user ${user.name}? This action cannot be undone.`}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setUserToDelete(null)}>{language === 'zh' ? '返回' : 'Back'}</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteUser}>{language === 'zh' ? '確認刪除' : 'Confirm Delete'}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
