import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { useToast } from '@/components/ui/use-toast';
import { authService } from '@/services';
import { supabase } from '@/lib/supabase';
import { UserPlus, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';

export const CreateUserModal = ({ isOpen, onClose, onUserCreated }) => {
  const { language } = useLanguage();
  const t = translations[language].admin;
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: ''
  });

  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = language === 'zh' ? '請輸入電郵地址' : 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = language === 'zh' ? '電郵格式不正確' : 'Invalid email format';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = language === 'zh' ? '請輸入密碼' : 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = language === 'zh' ? '密碼至少需要8個字符' : 'Password must be at least 8 characters';
    }

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = language === 'zh' ? '請輸入姓名' : 'Full name is required';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = language === 'zh' ? '請輸入電話號碼' : 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: language === 'zh' ? '表單驗證失敗' : 'Validation Failed',
        description: language === 'zh' ? '請檢查所有必填欄位' : 'Please check all required fields',
        variant: 'destructive'
      });
      return;
    }

    setCreating(true);

    try {
      // IMPORTANT: Save admin's current session before creating new user
      // signUp() will create a new session for the new user, logging out the admin
      console.log('💾 Saving admin session before creating new user...');
      const { data: { session: adminSession } } = await supabase.auth.getSession();

      if (!adminSession) {
        console.error('❌ No admin session found!');
        toast({
          title: language === 'zh' ? '會話錯誤' : 'Session Error',
          description: language === 'zh' ? '找不到管理員會話，請重新登入' : 'Admin session not found, please login again',
          variant: 'destructive'
        });
        return;
      }

      console.log('✅ Admin session saved:', adminSession.user.email);

      // Use authService.signUp to create new user
      // Database trigger will automatically create user profile
      const result = await authService.signUp(
        formData.email,
        formData.password,
        {
          firstName: formData.fullName.split(' ')[0] || formData.fullName,
          lastName: formData.fullName.split(' ').slice(1).join(' ') || '',
          phone: formData.phone,
          title: 'Mr' // Default title
        }
      );

      if (!result.success) {
        // Restore admin session even on failure
        console.log('⚠️ User creation failed, restoring admin session...');
        await supabase.auth.setSession({
          access_token: adminSession.access_token,
          refresh_token: adminSession.refresh_token
        });

        toast({
          title: language === 'zh' ? '創建失敗' : 'Creation Failed',
          description: result.error || (language === 'zh' ? '無法創建用戶' : 'Failed to create user'),
          variant: 'destructive'
        });
        return;
      }

      console.log('✅ New user created successfully');
      console.log('🔄 Restoring admin session...');

      // CRITICAL: Restore admin's session immediately after user creation
      // This prevents the admin from being logged out
      const { error: restoreError } = await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token
      });

      if (restoreError) {
        console.error('❌ Failed to restore admin session:', restoreError);
        toast({
          title: language === 'zh' ? '會話恢復失敗' : 'Session Restore Failed',
          description: language === 'zh'
            ? '用戶已創建但您可能需要重新登入'
            : 'User created but you may need to login again',
          variant: 'destructive'
        });
      } else {
        console.log('✅ Admin session restored successfully');
      }

      // Success
      toast({
        title: language === 'zh' ? '用戶已創建' : 'User Created',
        description: language === 'zh'
          ? `用戶 ${formData.email} 已成功創建`
          : `User ${formData.email} has been successfully created`
      });

      // Reset form
      setFormData({
        email: '',
        password: '',
        fullName: '',
        phone: ''
      });
      setErrors({});

      // Wait a bit for auth state to fully propagate before refreshing user list
      // This prevents redirect issues during state updates
      console.log('⏳ Waiting for auth state to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Notify parent to refresh user list
      if (onUserCreated) {
        console.log('📞 Calling onUserCreated...');
        await onUserCreated();
      }

      onClose();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: language === 'zh' ? '發生錯誤' : 'Error Occurred',
        description: error.message || (language === 'zh' ? '無法創建用戶' : 'Failed to create user'),
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    if (!creating) {
      setFormData({
        email: '',
        password: '',
        fullName: '',
        phone: ''
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-amber-800 flex items-center">
            <UserPlus className="w-5 h-5 mr-2" />
            {language === 'zh' ? '新增用戶' : 'Create New User'}
          </DialogTitle>
          <DialogDescription>
            {language === 'zh'
              ? '創建新用戶帳號。所有欄位均為必填。'
              : 'Create a new user account. All fields are required.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-amber-800 flex items-center">
              <Mail className="w-4 h-4 mr-1" />
              {language === 'zh' ? '電郵地址' : 'Email Address'}
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`border-amber-200 focus:border-amber-400 ${errors.email ? 'border-red-500' : ''}`}
              placeholder={language === 'zh' ? '請輸入電郵地址' : 'Enter email address'}
              disabled={creating}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password" className="text-amber-800 flex items-center">
              <Lock className="w-4 h-4 mr-1" />
              {language === 'zh' ? '密碼' : 'Password'}
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`border-amber-200 focus:border-amber-400 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                placeholder={language === 'zh' ? '請輸入密碼 (至少8個字符)' : 'Enter password (min 8 characters)'}
                disabled={creating}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-600 hover:text-amber-800"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* Full Name */}
          <div>
            <Label htmlFor="fullName" className="text-amber-800 flex items-center">
              <User className="w-4 h-4 mr-1" />
              {language === 'zh' ? '姓名' : 'Full Name'}
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className={`border-amber-200 focus:border-amber-400 ${errors.fullName ? 'border-red-500' : ''}`}
              placeholder={language === 'zh' ? '請輸入姓名' : 'Enter full name'}
              disabled={creating}
            />
            {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone" className="text-amber-800 flex items-center">
              <Phone className="w-4 h-4 mr-1" />
              {language === 'zh' ? '電話號碼' : 'Phone Number'}
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={`border-amber-200 focus:border-amber-400 ${errors.phone ? 'border-red-500' : ''}`}
              placeholder={language === 'zh' ? '請輸入電話號碼' : 'Enter phone number'}
              disabled={creating}
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              {language === 'zh'
                ? '💡 提示：新用戶將以零餘額開始。您可以稍後在用戶詳情頁面中添加套餐餘額。'
                : '💡 Note: New user will start with zero package balances. You can add balances later in user details page.'}
            </p>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={creating}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              {language === 'zh' ? '取消' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={creating}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
            >
              {creating ? (
                <>{language === 'zh' ? '創建中...' : 'Creating...'}</>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {language === 'zh' ? '創建用戶' : 'Create User'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
