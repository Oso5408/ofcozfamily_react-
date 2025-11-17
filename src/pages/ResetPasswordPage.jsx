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
    // Check for Supabase recovery session
    // IMPORTANT: HashRouter causes URL issues with Supabase tokens
    // URL becomes: /#/reset-password#access_token=... (double hash)
    // Browser encodes second hash as %23, breaking automatic token parsing
    const checkSession = async () => {
      try {
        // Extract recovery token from URL (handles both # and %23 encoded hashes)
        // The URL format is: /#/reset-password#access_token=xxx (second # may be encoded as %23)
        const fullUrl = window.location.href;
        const hash = window.location.hash;

        console.log('🔍 Checking for recovery token in URL...');
        console.log('Full URL:', fullUrl);
        console.log('URL hash:', hash);

        // Try to extract token parameters from URL
        // Handle both cases: #access_token and %23access_token
        let tokenParams = '';

        // Method 1: Check if there's a %23 (URL-encoded #) in the URL
        if (fullUrl.includes('%23access_token')) {
          tokenParams = fullUrl.split('%23')[1];
          console.log('Found %23 encoded token params:', tokenParams);
        }
        // Method 2: Check if hash contains multiple # symbols
        else if (hash.includes('access_token')) {
          // Split by # and get the part with access_token
          const parts = hash.split('#');
          tokenParams = parts.find(part => part.includes('access_token')) || '';
          console.log('Found # token params:', tokenParams);
        }

        // Parse the token parameters
        const params = new URLSearchParams(tokenParams);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');

        console.log('Extracted access_token:', accessToken ? 'Found ✅' : 'Not found ❌');
        console.log('Token type:', type);

        // If we have recovery tokens, manually set the session
        if (accessToken && type === 'recovery') {
          console.log('🔑 Recovery token found, creating session...');

          // Set the session using the tokens from URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });

          if (error) {
            console.error('❌ Session creation failed:', error);
            throw error;
          }

          if (data.session) {
            console.log('✅ Recovery session created successfully');
            setIsValidToken(true);
            return;
          }
        }

        // Fallback: Check if there's already a valid session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          throw error;
        }

        // Check if this is a recovery/password reset session
        if (session && session.user) {
          console.log('✅ Valid password reset session detected');
          setIsValidToken(true);
        } else {
          console.log('❌ No valid session found');
          toast({
            title: language === 'zh' ? '連結無效或已過期' : 'Invalid or expired link',
            description: language === 'zh'
              ? '請重新申請重設密碼。連結可能已過期或已使用。'
              : 'Please request a new password reset. The link may have expired or already been used.',
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