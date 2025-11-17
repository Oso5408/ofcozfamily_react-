import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from "react-helmet-async";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { useToast } from '@/components/ui/use-toast';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { authService } from '@/services/authService';

export const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    // Check for valid recovery session
    // NOTE: Token extraction is now handled by AuthCallbackPage (/auth/callback)
    // This page only needs to verify there's an active session
    const checkSession = async () => {
      try {
        console.log('🔍 Checking for active password reset session...');

        // Check if there's an active session (created by AuthCallbackPage)
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          throw error;
        }

        // Verify user is authenticated (session created by recovery flow)
        if (session && session.user) {
          console.log('✅ Valid password reset session found');
          console.log('User ID:', session.user.id);
          setIsValidToken(true);
        } else {
          console.log('❌ No active session - user needs to use password reset link from email');
          toast({
            title: language === 'zh' ? '請使用郵件中的連結' : 'Please use the link from your email',
            description: language === 'zh'
              ? '您必須點擊郵件中的密碼重設連結才能訪問此頁面。'
              : 'You must click the password reset link from your email to access this page.',
            variant: 'destructive'
          });
          navigate('/forgot-password');
        }
      } catch (error) {
        console.error('Error checking password reset session:', error);
        toast({
          title: language === 'zh' ? '發生錯誤' : 'An error occurred',
          description: error.message || (language === 'zh' ? '請稍後再試。' : 'Please try again later.'),
          variant: 'destructive'
        });
        navigate('/forgot-password');
      } finally {
        setIsCheckingToken(false);
      }
    };

    checkSession();
  }, [language, navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: language === 'zh' ? '密碼不匹配' : 'Passwords do not match',
        variant: 'destructive'
      });
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      toast({
        title: language === 'zh' ? '密碼太短' : 'Password too short',
        description: language === 'zh' ? '密碼必須至少6個字符。' : 'Password must be at least 6 characters.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      // Update password using authService
      const result = await authService.updatePassword(password);

      if (result.success) {
        toast({
          title: language === 'zh' ? '✅ 密碼已重設' : '✅ Password Reset',
          description: language === 'zh'
            ? '您的密碼已成功更新。請使用新密碼登入。'
            : 'Your password has been updated successfully. Please login with your new password.'
        });

        console.log('✅ Password reset successful');

        // Sign out the user so they can login with new password
        await supabase.auth.signOut();

        navigate('/login');
      } else {
        throw new Error(result.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: language === 'zh' ? '❌ 重設失敗' : '❌ Reset Failed',
        description: error.message || (language === 'zh' ? '無法更新密碼，請稍後再試。' : 'Could not update password. Please try again later.'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-amber-800">
            {language === 'zh' ? '驗證連結中...' : 'Verifying link...'}
          </p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 glass-effect cat-shadow border-amber-200 max-w-md">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-amber-800 mb-4">
              {language === 'zh' ? '連結無效' : 'Invalid Link'}
            </h2>
            <p className="text-amber-600 mb-6">
              {language === 'zh'
                ? '此密碼重設連結無效或已過期。'
                : 'This password reset link is invalid or has expired.'}
            </p>
            <Button
              onClick={() => navigate('/forgot-password')}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
            >
              {language === 'zh' ? '申請新連結' : 'Request New Link'}
            </Button>
          </div>
        </Card>
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