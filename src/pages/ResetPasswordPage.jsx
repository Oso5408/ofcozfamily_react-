import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { useToast } from '@/components/ui/use-toast';
import { KeyRound, ArrowLeft } from 'lucide-react';

export const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const { resetPassword } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    const storedTokenData = JSON.parse(localStorage.getItem('password_reset_token'));
    if (
      storedTokenData &&
      storedTokenData.token === token &&
      storedTokenData.email === email &&
      storedTokenData.expires > Date.now()
    ) {
      setIsValidToken(true);
    } else {
        toast({
            title: language === 'zh' ? '連結無效或已過期' : 'Invalid or expired link',
            description: language === 'zh' ? '請重新申請重設密碼。' : 'Please request a new password reset.',
            variant: 'destructive'
        });
        navigate('/forgot-password');
    }
  }, [token, email, language, navigate, t, toast]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: language === 'zh' ? '密碼不匹配' : 'Passwords do not match',
        variant: 'destructive'
      });
      return;
    }
    setIsLoading(true);
    const result = resetPassword(email, password);
    if (result.success) {
        toast({
            title: language === 'zh' ? '密碼已重設' : 'Password Reset',
            description: language === 'zh' ? '您的密碼已成功更新。' : 'Your password has been updated successfully.'
        });
        localStorage.removeItem('password_reset_token');
        navigate('/login');
    } else {
        toast({
            title: language === 'zh' ? '重設失敗' : 'Reset Failed',
            description: result.error,
            variant: 'destructive'
        });
    }
    setIsLoading(false);
  };

  if (!isValidToken) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <p>{language === 'zh' ? '驗證連結中...' : 'Verifying link...'}</p>
        </div>
      );
  }

  return (
    <>
      <Helmet>
        <title>{`${t.resetPasswordPage.title} - Ofcoz Family`}</title>
        <meta name="description" content={t.resetPasswordPage.description} />
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
              <h1 className="text-3xl font-bold text-amber-800 mb-2">
                {language === 'zh' ? '重設密碼' : 'Reset Password'}
              </h1>
              <p className="text-amber-600">
                {language === 'zh' ? '為您的帳戶設定新密碼' : 'Set a new password for your account'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="password" className="text-amber-800">
                  {language === 'zh' ? '新密碼' : 'New Password'}
                </Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-amber-200 focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-amber-800">
                  {language === 'zh' ? '確認新密碼' : 'Confirm New Password'}
                </Label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border-amber-200 focus:border-amber-400"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
              >
                <KeyRound className="w-4 h-4 mr-2" />
                {isLoading 
                  ? (language === 'zh' ? '重設中...' : 'Resetting...') 
                  : (language === 'zh' ? '重設密碼' : 'Reset Password')
                }
              </Button>
            </form>
             <div className="mt-6 text-center">
              <Link 
                to="/login" 
                className="inline-flex items-center text-amber-700 hover:text-amber-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'zh' ? '返回登入' : 'Back to Login'}
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </>
  );
};