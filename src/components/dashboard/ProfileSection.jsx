import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { useToast } from '@/components/ui/use-toast';
import { Edit, LogOut, KeyRound, CalendarCheck, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const ProfileSection = () => {
  const { user, logout, updateUser, changePassword } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.full_name || user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleProfileUpdate = () => {
    updateUser(profileData);
    setEditingProfile(false);
    toast({
      title: t.dashboard.profileUpdated,
      description: t.dashboard.profileUpdatedDesc
    });
  };

  const handlePasswordUpdate = async () => {
    // Validate password length
    if (passwordData.newPassword.length < 6) {
      toast({
        title: language === 'zh' ? '密碼太短' : 'Password too short',
        description: language === 'zh' ? '密碼必須至少6個字符' : 'Password must be at least 6 characters',
        variant: "destructive"
      });
      return;
    }

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: t.dashboard.passwordMismatch, variant: "destructive" });
      return;
    }

    // Call changePassword (it's async, so await it)
    const result = await changePassword(user.id, passwordData.oldPassword, passwordData.newPassword);

    if (result.success) {
      toast({ title: t.dashboard.passwordUpdated, description: t.dashboard.passwordUpdatedDesc });
      setEditingPassword(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      toast({ title: result.error, variant: "destructive" });
    }
  };

  const handleNotificationsClick = () => {
    toast({
        title: t.notifications.title,
        description: t.notifications.orderUpdate,
    });
     if(user.tokens < 20) {
        toast({
            title: t.notifications.title,
            description: t.notifications.lowToken,
            variant: "destructive",
            action: <Link to="/pricing"><Button variant="outline" size="sm">{t.notifications.rechargeNow}</Button></Link>
        });
    }
  };

  if (!user) return null;

  const tokenValidDate = user.tokenValidUntil ? new Date(user.tokenValidUntil).toLocaleDateString() : 'N/A';

  return (
    <Card className="p-8 glass-effect cat-shadow border-amber-200 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {(user.full_name || user.name)?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-amber-800">
              {t.dashboard.welcome}, {user.full_name || user.name || user.email.split('@')[0]}
            </h1>
            <p className="text-amber-600">{user.email}</p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <div className="token-badge">
                <span className="token-icon"></span>
                {user.tokens || 0} {language === 'zh' ? '代幣' : 'Tokens'}
              </div>
              <div className="flex gap-2 flex-wrap">
                <div className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-full text-sm font-semibold">
                  BR15: {user.br15_balance || 0}
                </div>
                <div className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 rounded-full text-sm font-semibold">
                  BR30: {user.br30_balance || 0}
                </div>
                <div className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-teal-200 text-green-700 rounded-full text-sm font-semibold">
                  DP20: {user.dp20_balance || 0}
                </div>
              </div>
            </div>
            {user.dp20_expiry && (
              <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-700">
                  {language === 'zh' ? 'DP20 有效期至：' : 'DP20 valid until: '}
                  <span className="font-semibold">
                    {new Date(user.dp20_expiry).toLocaleDateString(language === 'zh' ? 'zh-HK' : 'en-US')}
                  </span>
                  {new Date(user.dp20_expiry) < new Date() && (
                    <span className="ml-2 text-red-600 font-semibold">
                      ({language === 'zh' ? '已過期' : 'Expired'})
                    </span>
                  )}
                  {new Date(user.dp20_expiry) > new Date() && new Date(user.dp20_expiry) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                    <span className="ml-2 text-orange-600 font-semibold">
                      ({language === 'zh' ? '即將到期' : 'Expiring soon'})
                    </span>
                  )}
                </p>
              </div>
            )}
            <p className="text-sm text-amber-600 mt-2">
              {t.dashboard.topUpMessage}
            </p>
            <div className="mt-1">
              <p className="text-xs text-amber-500">
                {t.dashboard.validUntil.replace('{date}', tokenValidDate)}
              </p>
            </div>
            {user.isAdmin && (
              <Link
                to="/admin"
                className="text-sm bg-amber-100 text-amber-800 px-3 py-1 rounded-full hover:bg-amber-200 transition-colors inline-block mt-2"
              >
                {language === 'zh' ? '管理後台' : 'Admin Panel'}
              </Link>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleNotificationsClick}
            variant="ghost"
            size="icon"
            className="text-amber-700 hover:bg-amber-100"
          >
            <Bell className="w-5 h-5" />
          </Button>
          <div className="flex flex-col space-y-2">
            <Button
              onClick={() => { setEditingProfile(true); setEditingPassword(false); }}
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <Edit className="w-4 h-4 mr-2" />
              {t.dashboard.editProfile}
            </Button>
            <Button
              onClick={() => { setEditingPassword(true); setEditingProfile(false); }}
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <KeyRound className="w-4 h-4 mr-2" />
              {t.dashboard.changePassword}
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t.dashboard.logout}
            </Button>
          </div>
        </div>
      </div>

      {editingProfile && (
        <div className="border-t border-amber-200 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label className="text-amber-800">{language === 'zh' ? '姓名' : 'Name'}</Label>
              <Input
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                className="border-amber-200 focus:border-amber-400"
              />
            </div>
            <div>
              <Label className="text-amber-800">{language === 'zh' ? '電郵' : 'Email'}</Label>
              <Input
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                className="border-amber-200 focus:border-amber-400"
              />
            </div>
            <div>
              <Label className="text-amber-800">{language === 'zh' ? '電話' : 'Phone'}</Label>
              <Input
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                className="border-amber-200 focus:border-amber-400"
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <Button
              onClick={handleProfileUpdate}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
            >
              {language === 'zh' ? '保存' : 'Save'}
            </Button>
            <Button
              onClick={() => setEditingProfile(false)}
              variant="outline"
              className="border-amber-300 text-amber-700"
            >
              {language === 'zh' ? '取消' : 'Cancel'}
            </Button>
          </div>
        </div>
      )}

      {editingPassword && (
        <div className="border-t border-amber-200 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label className="text-amber-800">{t.dashboard.oldPassword}</Label>
              <PasswordInput
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, oldPassword: e.target.value }))}
                className="border-amber-200 focus:border-amber-400"
              />
            </div>
            <div>
              <Label className="text-amber-800">{t.dashboard.newPassword}</Label>
              <PasswordInput
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder={language === 'zh' ? '至少6個字符' : 'Min 6 characters'}
                className="border-amber-200 focus:border-amber-400"
              />
            </div>
            <div>
              <Label className="text-amber-800">{t.dashboard.confirmPassword}</Label>
              <PasswordInput
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder={language === 'zh' ? '再次輸入新密碼' : 'Re-enter new password'}
                className="border-amber-200 focus:border-amber-400"
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <Button
              onClick={handlePasswordUpdate}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
            >
              {t.dashboard.changePassword}
            </Button>
            <Button
              onClick={() => setEditingPassword(false)}
              variant="outline"
              className="border-amber-300 text-amber-700"
            >
              {language === 'zh' ? '取消' : 'Cancel'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};