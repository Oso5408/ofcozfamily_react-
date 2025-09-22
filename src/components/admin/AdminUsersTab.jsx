import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Minus, Shield, User, KeyRound, Edit, Trash2 } from 'lucide-react';
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
  const { user: adminUser, updateUserTokens, updateUser, deleteUser } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();
  const [tokenAmount, setTokenAmount] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '' });
  const [userToDelete, setUserToDelete] = useState(null);

  const safeUsers = users || [];

  const handleTokenUpdate = (userId, operation) => {
    const targetUser = safeUsers.find(u => u.id === userId);
    if (!targetUser) return;

    const amount = parseInt(tokenAmount, 10);
    if (isNaN(amount) || amount <= 0) return;

    const newTokenCount = operation === 'add' 
      ? (targetUser.tokens || 0) + amount
      : Math.max(0, (targetUser.tokens || 0) - amount);

    const updatedUser = updateUserTokens(userId, newTokenCount, operation === 'add');

    const updatedUsersList = safeUsers.map(u => 
      u.id === userId ? updatedUser : u
    );
    setUsers(updatedUsersList);

    toast({
      title: t.admin.tokensUpdated,
      description: t.admin.tokensUpdatedDesc
    });
  };

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

  return (
    <div>
      <h2 className="text-2xl font-bold text-amber-800 mb-6">
        {t.admin.userManagement}
      </h2>

      <Card className="p-6 mb-6 border-amber-200">
        <h3 className="text-lg font-semibold text-amber-800 mb-4">
          {t.dashboard.manageTokens}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-amber-800">{language === 'zh' ? '選擇用戶' : 'Select User'}</Label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full p-2 border border-amber-200 rounded-md focus:border-amber-400 focus:outline-none bg-white"
            >
              <option value="">{language === 'zh' ? '選擇用戶' : 'Select a user'}</option>
              {safeUsers.filter(u => !u.isAdmin).map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-amber-800">{language === 'zh' ? '代幣數量' : 'Token Amount'}</Label>
            <Input
              type="number"
              min="1"
              value={tokenAmount}
              onChange={(e) => setTokenAmount(parseInt(e.target.value) || 1)}
              className="border-amber-200 focus:border-amber-400"
            />
          </div>
          <div className="flex items-end space-x-2">
            <Button
              onClick={() => handleTokenUpdate(selectedUserId, 'add')}
              disabled={!selectedUserId}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              {t.admin.addTokens}
            </Button>
            <Button
              onClick={() => handleTokenUpdate(selectedUserId, 'remove')}
              disabled={!selectedUserId}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <Minus className="w-4 h-4 mr-1" />
              {t.admin.removeTokens}
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {safeUsers.map((user) => (
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
                <div>
                  <h3 className="text-lg font-semibold text-amber-800">{user.name} {user.isAdmin && `(${language === 'zh' ? '管理員' : 'Admin'})`}</h3>
                  <p className="text-amber-600">{user.email}</p>
                  <p className="text-sm text-amber-600">{language === 'zh' ? '註冊於' : 'Registered on'}: {new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-2 flex-wrap gap-2">
                  <div className="text-right">
                    <div className="token-badge mb-1"><span className="token-icon"></span>{user.tokens || 0} {language === 'zh' ? '代幣' : 'Tokens'}</div>
                    <p className="text-xs text-amber-600">{t.dashboard.validUntil.replace('{date}', new Date(user.tokenValidUntil).toLocaleDateString())}</p>
                  </div>
                  {adminUser.id !== user.id && (
                    <>
                      <Button onClick={() => startEdit(user)} variant="outline" size="sm"><Edit className="w-4 h-4 mr-2" />{language === 'zh' ? '修改' : 'Edit'}</Button>
                      <Button onClick={() => onPasswordReset(user.id)} variant="outline" size="sm"><KeyRound className="w-4 h-4 mr-2" />{t.admin.resetPassword}</Button>
                      <Button onClick={() => onRoleChange(user.id, !user.isAdmin)} variant={user.isAdmin ? "destructive" : "default"} size="sm" className={user.isAdmin ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"}>
                        {user.isAdmin ? <User className="w-4 h-4 mr-2" /> : <Shield className="w-4 h-4 mr-2" />}{user.isAdmin ? t.admin.demoteToUser : t.admin.promoteToAdmin}
                      </Button>
                      <AlertDialog open={userToDelete === user.id} onOpenChange={() => setUserToDelete(null)}>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive" size="sm" onClick={() => setUserToDelete(user.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />{language === 'zh' ? '刪除' : 'Delete'}
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
        ))}
      </div>
    </div>
  );
};