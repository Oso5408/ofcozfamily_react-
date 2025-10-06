import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, UserPlus, AlertCircle } from 'lucide-react';
import { PasswordStrengthIndicator } from '@/components/ui/PasswordStrengthIndicator';
import {
  validateEmail,
  validatePassword,
  validateName,
  getValidationMessages,
} from '@/utils/validation';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const { register } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();
  const { toast } = useToast();
  const validationMessages = getValidationMessages(language);

  // Validation state
  const nameError = touched.name && !validateName(name) ? validationMessages.nameRequired : '';
  const emailError = touched.email && !validateEmail(email) ? validationMessages.emailInvalid : '';
  const passwordValidation = validatePassword(password);
  const passwordError = touched.password && password.length > 0 && !passwordValidation.isValid;
  const confirmPasswordError = touched.confirmPassword && password !== confirmPassword
    ? validationMessages.passwordMismatch
    : '';

  // Only require minimum validation for submission (not full strength)
  const hasMinimumPasswordRequirements = password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password);

  const hasErrors = !validateName(name) ||
                    !validateEmail(email) ||
                    !hasMinimumPasswordRequirements ||
                    password !== confirmPassword ||
                    password.length === 0 ||
                    confirmPassword.length === 0;

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    // Validate all fields
    if (!validateName(name)) {
      toast({
        title: language === 'zh' ? '驗證錯誤' : 'Validation Error',
        description: validationMessages.nameRequired,
        variant: 'destructive',
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: language === 'zh' ? '驗證錯誤' : 'Validation Error',
        description: validationMessages.emailInvalid,
        variant: 'destructive',
      });
      return;
    }

    // Check minimum password requirements (not full validation)
    if (!hasMinimumPasswordRequirements) {
      toast({
        title: language === 'zh' ? '密碼不符合要求' : 'Password Requirements Not Met',
        description: language === 'zh'
          ? '密碼必須至少8個字符，包含大寫字母、小寫字母和數字'
          : 'Password must be at least 8 characters with uppercase, lowercase, and numbers',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: language === 'zh' ? '密碼不匹配' : 'Passwords do not match',
        description: language === 'zh' ? '請確認您輸入的密碼相同' : 'Please ensure your passwords match.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('🚀 Starting registration...');
      const result = await register({ name, email, password, fullName: name, phone: '' });
      console.log('📝 Registration result:', result);

      if (result.success) {
        // Check if email confirmation is required
        if (result.emailConfirmationRequired) {
          console.log('📧 Email confirmation required');
          toast({
            title: language === 'zh' ? '請確認您的電郵' : 'Please Confirm Your Email',
            description: language === 'zh'
              ? '我們已向您的電郵地址發送確認連結。請檢查您的收件箱。'
              : 'We sent a confirmation link to your email address. Please check your inbox.',
          });
          // Redirect to a waiting page or login with message
          setTimeout(() => navigate('/login?emailSent=true'), 1000);
        } else if (result.requiresManualLogin) {
          console.log('🔄 Redirecting to login page...');
          toast({
            title: language === 'zh' ? '請登入' : 'Please Login',
            description: language === 'zh'
              ? '註冊成功！請使用您的帳戶登入。'
              : 'Registration successful! Please login with your account.',
          });
          setTimeout(() => navigate('/login'), 500);
        } else {
          toast({
            title: language === 'zh' ? '註冊成功！' : 'Registration Successful!',
            description: language === 'zh' ? '歡迎加入Ofcoz Family！' : 'Welcome to the Ofcoz Family!',
          });
          console.log('✅ Auto-login successful, redirecting to dashboard...');
          setTimeout(() => {
            console.log('🏠 Navigating to dashboard');
            navigate('/dashboard');
          }, 500);
        }
      } else {
        // Display user-friendly error message
        let errorMessage = result.error || (language === 'zh' ? '註冊失敗。請稍後再試。' : 'Registration failed. Please try again.');

        toast({
          title: language === 'zh' ? '註冊失敗' : 'Registration Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: language === 'zh' ? '發生錯誤' : 'An Error Occurred',
        description: language === 'zh'
          ? '無法完成註冊。請檢查您的網絡連接並重試。'
          : 'Could not complete registration. Please check your network connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{`${t.registerPage.title} - Ofcoz Family`}</title>
        <meta name="description" content={t.registerPage.description} />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 glass-effect cat-shadow border-amber-200">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden">
                <img
                  src="https://storage.googleapis.com/hostinger-horizons-assets-prod/39c194f1-5fbb-4e09-860b-f8ae67cf7c2e/bb0bf6301ee831106ab15fefad558edf.jpg"
                  alt="Ofcoz Family Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-3xl font-bold text-amber-800 mb-2">
                {language === 'zh' ? '創建帳戶' : 'Create Account'}
              </h1>
              <p className="text-amber-600">
                {language === 'zh' ? '加入Ofcoz Family' : 'Join the Ofcoz Family'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-amber-800">
                  {language === 'zh' ? '姓名' : 'Name'}
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => handleBlur('name')}
                  className={`border-amber-200 focus:border-amber-400 ${nameError ? 'border-red-500' : ''}`}
                  required
                />
                {nameError && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    <span>{nameError}</span>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="email" className="text-amber-800">
                  {language === 'zh' ? '電郵地址' : 'Email Address'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={`border-amber-200 focus:border-amber-400 ${emailError ? 'border-red-500' : ''}`}
                  required
                />
                {emailError && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    <span>{emailError}</span>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="text-amber-800">
                  {language === 'zh' ? '密碼' : 'Password'}
                </Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={`border-amber-200 focus:border-amber-400 ${passwordError ? 'border-red-500' : ''}`}
                  required
                />
                <PasswordStrengthIndicator password={password} language={language} />
                {passwordError && (
                  <div className="flex items-start gap-1 mt-1 text-xs text-red-600">
                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <div className="space-y-0.5">
                      {language === 'zh' ? '密碼還需要：' : 'Password still needs:'}
                      <ul className="list-none ml-2 space-y-0.5">
                        {passwordValidation.errors.minLength && (
                          <li>• {language === 'zh' ? '至少8個字符' : 'At least 8 characters'}</li>
                        )}
                        {passwordValidation.errors.hasUpperCase && (
                          <li>• {language === 'zh' ? '至少一個大寫字母 (A-Z)' : 'At least one uppercase letter (A-Z)'}</li>
                        )}
                        {passwordValidation.errors.hasLowerCase && (
                          <li>• {language === 'zh' ? '至少一個小寫字母 (a-z)' : 'At least one lowercase letter (a-z)'}</li>
                        )}
                        {passwordValidation.errors.hasNumber && (
                          <li>• {language === 'zh' ? '至少一個數字 (0-9)' : 'At least one number (0-9)'}</li>
                        )}
                        {passwordValidation.errors.hasSpecialChar && (
                          <li>• {language === 'zh' ? '至少一個特殊字符 (@$!%*?&)' : 'At least one special character (@$!%*?&)'}</li>
                        )}
                      </ul>
                      <div className="mt-1 text-amber-600">
                        {language === 'zh'
                          ? '提示：特殊字符不是必需的，只要有大小寫字母和數字即可註冊'
                          : 'Tip: Special characters are optional - just uppercase, lowercase, and numbers are enough'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-amber-800">
                  {language === 'zh' ? '確認密碼' : 'Confirm Password'}
                </Label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  className={`border-amber-200 focus:border-amber-400 ${confirmPasswordError ? 'border-red-500' : ''}`}
                  required
                />
                {confirmPasswordError && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    <span>{confirmPasswordError}</span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading || hasErrors}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {isLoading
                  ? language === 'zh' ? '註冊中...' : 'Registering...'
                  : language === 'zh' ? '註冊' : 'Register'}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-4">
              <p className="text-amber-700">
                {language === 'zh' ? '已經有帳戶？' : 'Already have an account?'}{' '}
                <Link to="/login" className="text-amber-800 hover:text-amber-900 font-medium">
                  {language === 'zh' ? '立即登入' : 'Sign in now'}
                </Link>
              </p>

              <Link
                to="/"
                className="inline-flex items-center text-amber-700 hover:text-amber-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'zh' ? '返回首頁' : 'Back to Home'}
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </>
  );
};