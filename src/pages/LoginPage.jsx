import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, LogIn, Mail, AlertCircle } from 'lucide-react';
import { ResendConfirmationEmail } from '@/components/ResendConfirmationEmail';
import { sanitizeAndValidateEmail, sanitizeAndValidatePassword, loginRateLimiter } from '@/lib/validation';

export const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailConfirmNotice, setShowEmailConfirmNotice] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const { login } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get returnUrl from location state (set by LoginPromptModal or BookingPage)
  const returnUrl = location.state?.returnUrl || '/dashboard';

  useEffect(() => {
    // Check if user just registered and needs to confirm email
    const emailSent = searchParams.get('emailSent');
    if (emailSent === 'true') {
      setShowEmailConfirmNotice(true);
    }
  }, [searchParams]);

  // Validate inputs before submission
  const validateForm = () => {
    const newErrors = { email: '', password: '' };
    let isValid = true;

    // Validate email using utility function
    const emailValidation = sanitizeAndValidateEmail(email);
    if (!email.trim()) {
      newErrors.email = language === 'zh' ? '請輸入電郵地址' : 'Email is required';
      isValid = false;
    } else if (!emailValidation.isValid) {
      newErrors.email = language === 'zh' ? '電郵格式無效' : 'Invalid email format';
      isValid = false;
    } else if (emailValidation.hasSuspiciousContent) {
      newErrors.email = language === 'zh' ? '電郵包含無效字符' : 'Email contains invalid characters';
      isValid = false;
    }

    // Validate password using utility function
    const passwordValidation = sanitizeAndValidatePassword(password);
    if (!password.trim()) {
      newErrors.password = language === 'zh' ? '請輸入密碼' : 'Password is required';
      isValid = false;
    } else if (!passwordValidation.isValid) {
      newErrors.password = language === 'zh' ? '密碼格式無效' : passwordValidation.error || 'Invalid password format';
      isValid = false;
    }

    // Check rate limiting (client-side)
    if (isValid && loginRateLimiter.isRateLimited(emailValidation.sanitized)) {
      newErrors.email = language === 'zh' ? '嘗試次數過多，請稍後再試' : 'Too many attempts. Please try again later.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({ email: '', password: '' });

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Sanitize inputs using validation utilities
      const emailValidation = sanitizeAndValidateEmail(email);
      const passwordValidation = sanitizeAndValidatePassword(password);

      const result = await login(emailValidation.sanitized, passwordValidation.sanitized, rememberMe);

      if (result.success) {
        // Clear rate limiting on successful login
        loginRateLimiter.clearAttempts(emailValidation.sanitized);

        toast({
          title: language === 'zh' ? '登入成功！' : 'Login Successful!',
          description: language === 'zh' ? '歡迎回來！' : 'Welcome back!'
        });

        // Navigate to returnUrl if provided, otherwise go to dashboard
        navigate(returnUrl);
      } else {
        // Record failed attempt for rate limiting
        loginRateLimiter.recordFailedAttempt(emailValidation.sanitized);

        // Handle specific error cases
        let errorDescription = result.error || (language === 'zh' ? '電郵或密碼錯誤' : 'Invalid email or password');

        toast({
          title: language === 'zh' ? '登入失敗' : 'Login Failed',
          description: errorDescription,
          variant: "destructive"
        });
      }
    } catch (error) {
      // Handle unexpected errors (network issues, etc.)
      console.error('Login error:', error);

      toast({
        title: language === 'zh' ? '登入失敗' : 'Login Failed',
        description: language === 'zh' ? '發生錯誤，請稍後再試' : 'An error occurred. Please try again later.',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{`${t.loginPage.title} - Ofcoz Family`}</title>
        <meta name="description" content={t.loginPage.description} />
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
                {language === 'zh' ? '登入' : 'Login'}
              </h1>
              <p className="text-amber-600">
                {language === 'zh' ? '登入您的Ofcoz Family帳戶' : 'Sign in to your Ofcoz Family account'}
              </p>
            </div>

            {showEmailConfirmNotice && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-1">
                      {language === 'zh' ? '請確認您的電郵' : 'Please Confirm Your Email'}
                    </h3>
                    <p className="text-sm text-blue-700 mb-3">
                      {language === 'zh'
                        ? '我們已向您的電郵地址發送確認連結。請檢查您的收件箱並點擊連結以啟用您的帳戶。'
                        : 'We sent a confirmation link to your email address. Please check your inbox and click the link to activate your account.'}
                    </p>
                    <ResendConfirmationEmail email={email} />
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-amber-800">
                  {language === 'zh' ? '電郵地址' : 'Email Address'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    // Clear error when user starts typing
                    if (errors.email) {
                      setErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  className={`border-amber-200 focus:border-amber-400 ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                  maxLength={255}
                  disabled={isLoading}
                />
                {errors.email && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-amber-800">
                      {language === 'zh' ? '密碼' : 'Password'}
                    </Label>
                    <Link
                      to="/forgot-password"
                      className="text-sm text-amber-700 hover:text-amber-900"
                    >
                      {language === 'zh' ? '忘記密碼？' : 'Forgot Password?'}
                    </Link>
                </div>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    // Clear error when user starts typing
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                  className={`border-amber-200 focus:border-amber-400 ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                  maxLength={255}
                  disabled={isLoading}
                />
                {errors.password && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.password}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={setRememberMe}
                />
                <Label htmlFor="remember" className="text-amber-700 text-sm cursor-pointer">
                  {language === 'zh' ? '記住我' : 'Remember me'}
                </Label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
              >
                <LogIn className="w-4 h-4 mr-2" />
                {isLoading 
                  ? (language === 'zh' ? '登入中...' : 'Signing in...') 
                  : (language === 'zh' ? '登入' : 'Sign In')
                }
              </Button>
            </form>

            <div className="mt-6 text-center space-y-4">
              <p className="text-amber-700">
                {language === 'zh' ? '還沒有帳戶？' : "Don't have an account?"}{' '}
                <Link to="/register" className="text-amber-800 hover:text-amber-900 font-medium">
                  {language === 'zh' ? '立即註冊' : 'Sign up now'}
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