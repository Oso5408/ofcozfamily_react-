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
  const { user: adminUser, updateUserTokens, assignBRPackage, assignDP20Package, updateUser, deleteUser } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();
  const [tokenAmount, setTokenAmount] = useState(1);
  const [tokenReason, setTokenReason] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedBRUserId, setSelectedBRUserId] = useState('');
  const [brReason, setBrReason] = useState('');
  const [selectedDP20UserId, setSelectedDP20UserId] = useState('');
  const [dp20Reason, setDp20Reason] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '' });
  const [userToDelete, setUserToDelete] = useState(null);

  const safeUsers = users || [];

  // Debug logs
  console.log('👥 AdminUsersTab - All users:', users);
  console.log('👥 AdminUsersTab - Safe users count:', safeUsers.length);
  console.log('👥 AdminUsersTab - Sample user structure:', safeUsers[0]);

  const nonAdminUsers = safeUsers.filter(u => !u.is_admin && !u.isAdmin);
  console.log('👥 AdminUsersTab - Non-admin users:', nonAdminUsers);
  console.log('👥 AdminUsersTab - Non-admin users count:', nonAdminUsers.length);

  const handleTokenUpdate = async (userId, operation) => {
    const targetUser = safeUsers.find(u => u.id === userId);
    if (!targetUser) return;

    const amount = parseInt(tokenAmount, 10);
    if (isNaN(amount) || amount <= 0) return;

    const newTokenCount = operation === 'add'
      ? (targetUser.tokens || 0) + amount
      : Math.max(0, (targetUser.tokens || 0) - amount);

    console.log('💰 Updating tokens:', { userId, amount, operation, reason: tokenReason });

    const updatedUser = await updateUserTokens(userId, newTokenCount, operation === 'add', tokenReason);

    const updatedUsersList = safeUsers.map(u =>
      u.id === userId ? updatedUser : u
    );
    setUsers(updatedUsersList);

    toast({
      title: t.admin.tokensUpdated,
      description: tokenReason
        ? `${t.admin.tokensUpdatedDesc} - ${language === 'zh' ? '原因' : 'Reason'}: ${tokenReason}`
        : t.admin.tokensUpdatedDesc
    });

    // Clear the reason field after successful update
    setTokenReason('');
  };

  const handleBRPackageAssignment = async (packageType) => {
    console.log('🔘 BR Package button clicked:', packageType);
    console.log('👤 Selected user ID:', selectedBRUserId);
    console.log('👨‍💼 Admin user:', adminUser);
    console.log('🆔 Admin user ID:', adminUser?.id);
    console.log('📝 Reason:', brReason);

    if (!selectedBRUserId) {
      console.error('❌ No user selected!');
      toast({
        title: language === 'zh' ? '請選擇用戶' : 'Please Select User',
        description: language === 'zh' ? '請先選擇一個用戶' : 'Please select a user first',
        variant: 'destructive'
      });
      return;
    }

    if (!adminUser?.id) {
      console.error('❌ No admin user ID!');
      toast({
        title: language === 'zh' ? '管理員錯誤' : 'Admin Error',
        description: language === 'zh' ? '無法獲取管理員ID' : 'Cannot get admin ID',
        variant: 'destructive'
      });
      return;
    }

    console.log('✅ Calling assignBRPackage...');
    const result = await assignBRPackage(selectedBRUserId, packageType, adminUser.id, brReason);
    console.log('📦 Result:', result);

    if (result.success) {
      console.log('✅ Success! Updating users list...');
      const updatedUsersList = safeUsers.map(u =>
        u.id === selectedBRUserId ? result.profile : u
      );
      setUsers(updatedUsersList);

      toast({
        title: language === 'zh' ? '套票已分配' : 'Package Assigned',
        description: brReason
          ? `${language === 'zh' ? `已成功分配 ${packageType} 套票` : `Successfully assigned ${packageType} package`} - ${language === 'zh' ? '原因' : 'Reason'}: ${brReason}`
          : language === 'zh'
            ? `已成功分配 ${packageType} 套票`
            : `Successfully assigned ${packageType} package`
      });

      // Clear the reason field after successful assignment
      setBrReason('');
    } else {
      console.error('❌ Failed:', result.error);
      toast({
        title: language === 'zh' ? '分配失敗' : 'Assignment Failed',
        description: result.error,
        variant: 'destructive'
      });
    }
  };

  const handleDP20PackageAssignment = async () => {
    console.log('🔘 DP20 Package button clicked');
    console.log('👤 Selected user ID:', selectedDP20UserId);
    console.log('👨‍💼 Admin user:', adminUser);
    console.log('🆔 Admin user ID:', adminUser?.id);
    console.log('📝 Reason:', dp20Reason);

    if (!selectedDP20UserId) {
      console.error('❌ No user selected!');
      toast({
        title: language === 'zh' ? '請選擇用戶' : 'Please Select User',
        description: language === 'zh' ? '請先選擇一個用戶' : 'Please select a user first',
        variant: 'destructive'
      });
      return;
    }

    if (!adminUser?.id) {
      console.error('❌ No admin user ID!');
      toast({
        title: language === 'zh' ? '管理員錯誤' : 'Admin Error',
        description: language === 'zh' ? '無法獲取管理員ID' : 'Cannot get admin ID',
        variant: 'destructive'
      });
      return;
    }

    console.log('✅ Calling assignDP20Package...');
    const result = await assignDP20Package(selectedDP20UserId, adminUser.id, dp20Reason);
    console.log('📦 Result:', result);

    if (result.success) {
      console.log('✅ Success! Updating users list...');
      const updatedUsersList = safeUsers.map(u =>
        u.id === selectedDP20UserId ? result.profile : u
      );
      setUsers(updatedUsersList);

      toast({
        title: language === 'zh' ? 'DP20 套票已分配' : 'DP20 Package Assigned',
        description: dp20Reason
          ? `${language === 'zh' ? '已成功分配 DP20 套票 (20次, 90日有效)' : 'Successfully assigned DP20 package (20 visits, 90-day validity)'} - ${language === 'zh' ? '原因' : 'Reason'}: ${dp20Reason}`
          : language === 'zh'
            ? '已成功分配 DP20 套票 (20次, 90日有效)'
            : 'Successfully assigned DP20 package (20 visits, 90-day validity)'
      });

      // Clear the reason field after successful assignment
      setDp20Reason('');
    } else {
      console.error('❌ Failed:', result.error);
      toast({
        title: language === 'zh' ? '分配失敗' : 'Assignment Failed',
        description: result.error,
        variant: 'destructive'
      });
    }
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Label className="text-amber-800">{language === 'zh' ? '選擇用戶' : 'Select User'}</Label>
            <select
              value={selectedUserId}
              onChange={(e) => {
                console.log('🔄 Token dropdown changed:', e.target.value);
                setSelectedUserId(e.target.value);
              }}
              className="w-full p-2 border border-amber-200 rounded-md focus:border-amber-400 focus:outline-none bg-white"
            >
              <option value="">{language === 'zh' ? '選擇用戶' : 'Select a user'}</option>
              {nonAdminUsers.map(user => {
                const userName = user.name || user.full_name || user.email;
                console.log('📝 Rendering token dropdown option:', user.id, userName, user.email);
                return (
                  <option key={user.id} value={user.id}>
                    {userName} ({user.email})
                  </option>
                );
              })}
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
          <div>
            <Label className="text-amber-800">{language === 'zh' ? '原因' : 'Reason'}</Label>
            <Input
              type="text"
              placeholder={language === 'zh' ? '例如：促銷活動、補償等' : 'e.g., Promotion, Compensation'}
              value={tokenReason}
              onChange={(e) => setTokenReason(e.target.value)}
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

      <Card className="p-6 mb-6 border-amber-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <h3 className="text-lg font-semibold text-amber-800 mb-4">
          {language === 'zh' ? '分配 BR 套票' : 'Assign BR Packages'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-amber-800">{language === 'zh' ? '選擇用戶' : 'Select User'}</Label>
            <select
              value={selectedBRUserId}
              onChange={(e) => {
                console.log('🔄 BR dropdown changed:', e.target.value);
                setSelectedBRUserId(e.target.value);
              }}
              className="w-full p-2 border border-amber-200 rounded-md focus:border-amber-400 focus:outline-none bg-white"
            >
              <option value="">{language === 'zh' ? '選擇用戶' : 'Select a user'}</option>
              {nonAdminUsers.map(user => {
                const userName = user.name || user.full_name || user.email;
                console.log('📝 Rendering BR dropdown option:', user.id, userName, user.email);
                return (
                  <option key={user.id} value={user.id}>
                    {userName} ({user.email})
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <Label className="text-amber-800">{language === 'zh' ? '原因' : 'Reason'}</Label>
            <Input
              type="text"
              placeholder={language === 'zh' ? '例如：購買套票、促銷活動等' : 'e.g., Purchase, Promotion'}
              value={brReason}
              onChange={(e) => setBrReason(e.target.value)}
              className="border-amber-200 focus:border-amber-400"
            />
          </div>
          <div className="flex items-end space-x-2 md:col-span-2">
            <Button
              onClick={() => handleBRPackageAssignment('BR15')}
              disabled={!selectedBRUserId}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              {language === 'zh' ? '分配 BR15 套票 (+15 BR)' : 'Assign BR15 Package (+15 BR)'}
            </Button>
            <Button
              onClick={() => handleBRPackageAssignment('BR30')}
              disabled={!selectedBRUserId}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              {language === 'zh' ? '分配 BR30 套票 (+30 BR)' : 'Assign BR30 Package (+30 BR)'}
            </Button>
          </div>
        </div>
        {selectedBRUserId && (
          <div className="mt-4 p-4 bg-white/50 rounded-md border border-amber-200">
            <p className="text-sm text-amber-700">
              <strong>{language === 'zh' ? '當前餘額：' : 'Current Balance:'}</strong>
              {safeUsers.find(u => u.id === selectedBRUserId) && (
                <>
                  <span className="ml-2">
                    BR15: {safeUsers.find(u => u.id === selectedBRUserId)?.br15_balance || 0} BR
                  </span>
                  <span className="ml-4">
                    BR30: {safeUsers.find(u => u.id === selectedBRUserId)?.br30_balance || 0} BR
                  </span>
                </>
              )}
            </p>
          </div>
        )}
      </Card>

      <Card className="p-6 mb-6 border-amber-200 bg-gradient-to-r from-green-50 to-teal-50">
        <h3 className="text-lg font-semibold text-amber-800 mb-4">
          {language === 'zh' ? '分配 DP20 套票' : 'Assign DP20 Package'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-amber-800">{language === 'zh' ? '選擇用戶' : 'Select User'}</Label>
            <select
              value={selectedDP20UserId}
              onChange={(e) => {
                console.log('🔄 DP20 dropdown changed:', e.target.value);
                setSelectedDP20UserId(e.target.value);
              }}
              className="w-full p-2 border border-amber-200 rounded-md focus:border-amber-400 focus:outline-none bg-white"
            >
              <option value="">{language === 'zh' ? '選擇用戶' : 'Select a user'}</option>
              {nonAdminUsers.map(user => {
                const userName = user.name || user.full_name || user.email;
                console.log('📝 Rendering DP20 dropdown option:', user.id, userName, user.email);
                return (
                  <option key={user.id} value={user.id}>
                    {userName} ({user.email})
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <Label className="text-amber-800">{language === 'zh' ? '原因' : 'Reason'}</Label>
            <Input
              type="text"
              placeholder={language === 'zh' ? '例如：購買套票、促銷活動等' : 'e.g., Purchase, Promotion'}
              value={dp20Reason}
              onChange={(e) => setDp20Reason(e.target.value)}
              className="border-amber-200 focus:border-amber-400"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => handleDP20PackageAssignment()}
              disabled={!selectedDP20UserId}
              className="w-full bg-gradient-to-r from-green-600 to-teal-700 hover:from-green-700 hover:to-teal-800 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              {language === 'zh' ? '分配 DP20 套票 (+20次)' : 'Assign DP20 Package (+20 visits)'}
            </Button>
          </div>
        </div>
        {selectedDP20UserId && (
          <div className="mt-4 p-4 bg-white/50 rounded-md border border-amber-200">
            <p className="text-sm text-amber-700">
              <strong>{language === 'zh' ? '當前餘額：' : 'Current Balance:'}</strong>
              {safeUsers.find(u => u.id === selectedDP20UserId) && (
                <>
                  <span className="ml-2">
                    DP20: {safeUsers.find(u => u.id === selectedDP20UserId)?.dp20_balance || 0} {language === 'zh' ? '次' : 'visits'}
                  </span>
                  {safeUsers.find(u => u.id === selectedDP20UserId)?.dp20_expiry && (
                    <span className="ml-4 text-xs">
                      ({language === 'zh' ? '有效期至' : 'Valid until'}: {new Date(safeUsers.find(u => u.id === selectedDP20UserId)?.dp20_expiry).toLocaleDateString(language === 'zh' ? 'zh-HK' : 'en-US')})
                    </span>
                  )}
                </>
              )}
            </p>
          </div>
        )}
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
                    <div className="flex gap-2 text-xs flex-wrap">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        BR15: {user.br15_balance || 0}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                        BR30: {user.br30_balance || 0}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                        DP20: {user.dp20_balance || 0}
                      </span>
                    </div>
                    {user.dp20_expiry && (
                      <p className="text-xs text-green-600 mt-1">
                        {language === 'zh' ? 'DP20 有效期至' : 'DP20 valid until'}: {new Date(user.dp20_expiry).toLocaleDateString(language === 'zh' ? 'zh-HK' : 'en-US')}
                      </p>
                    )}
                    <p className="text-xs text-amber-600 mt-1">{t.dashboard.validUntil.replace('{date}', new Date(user.tokenValidUntil).toLocaleDateString())}</p>
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