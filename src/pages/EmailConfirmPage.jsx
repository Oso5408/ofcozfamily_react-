import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from "react-helmet-async";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';

export const EmailConfirmPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const { language } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Get the token from URL hash (Supabase uses hash fragments)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const token = hashParams.get('access_token');
        const type = hashParams.get('type');

        console.log('Email confirmation - Type:', type);
        console.log('Email confirmation - Has token:', !!token);

        if (type === 'signup' || type === 'email_change' || type === 'recovery') {
          if (token) {
            // Exchange the token for a session
            const { data, error } = await supabase.auth.setSession({
              access_token: token,
              refresh_token: hashParams.get('refresh_token') || '',
            });

            if (error) {
              console.error('Confirmation error:', error);
              setStatus('error');
              setErrorMessage(error.message);
            } else {
              console.log('Email confirmed successfully:', data);
              setStatus('success');

              // Redirect to dashboard after 2 seconds
              setTimeout(() => {
                navigate('/dashboard');
              }, 2000);
            }
          } else {
            setStatus('error');
            setErrorMessage('No confirmation token found in URL');
          }
        } else {
          // Fallback: Try to get session (already confirmed)
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setStatus('success');
            setTimeout(() => navigate('/dashboard'), 2000);
          } else {
            setStatus('error');
            setErrorMessage('Invalid or expired confirmation link');
          }
        }
      } catch (error) {
        console.error('Email confirmation failed:', error);
        setStatus('error');
        setErrorMessage(error.message || 'An unexpected error occurred');
      }
    };

    confirmEmail();
  }, [navigate]);

  const getContent = () => {
    if (status === 'loading') {
      return {
        icon: <Loader2 className="w-16 h-16 text-amber-500 animate-spin" />,
        title: language === 'zh' ? '驗證中...' : 'Verifying...',
        description: language === 'zh'
          ? '請稍候，我們正在確認您的電郵地址。'
          : 'Please wait while we confirm your email address.',
        showButton: false,
      };
    }

    if (status === 'success') {
      return {
        icon: <CheckCircle className="w-16 h-16 text-green-500" />,
        title: language === 'zh' ? '電郵已確認！' : 'Email Confirmed!',
        description: language === 'zh'
          ? '您的電郵地址已成功驗證。正在跳轉到儀表板...'
          : 'Your email address has been successfully verified. Redirecting to dashboard...',
        showButton: false,
      };
    }

    if (status === 'error') {
      return {
        icon: <XCircle className="w-16 h-16 text-red-500" />,
        title: language === 'zh' ? '驗證失敗' : 'Verification Failed',
        description: errorMessage || (language === 'zh'
          ? '無法驗證您的電郵地址。連結可能已過期或無效。'
          : 'Unable to verify your email address. The link may have expired or is invalid.'),
        showButton: true,
      };
    }
  };

  const content = getContent();

  return (
    <>
      <Helmet>
        <title>{language === 'zh' ? '電郵確認 - Ofcoz Family' : 'Email Confirmation - Ofcoz Family'}</title>
      </Helmet>

      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 to-orange-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 glass-effect cat-shadow border-amber-200">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                {content.icon}
              </div>

              <h1 className="text-2xl font-bold text-amber-800 mb-3">
                {content.title}
              </h1>

              <p className="text-amber-700 mb-6">
                {content.description}
              </p>

              {content.showButton && (
                <div className="space-y-3">
                  <Button
                    onClick={() => navigate('/login')}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {language === 'zh' ? '前往登入' : 'Go to Login'}
                  </Button>

                  <Button
                    onClick={() => navigate('/')}
                    variant="outline"
                    className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    {language === 'zh' ? '返回首頁' : 'Back to Home'}
                  </Button>
                </div>
              )}

              {status === 'success' && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-amber-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{language === 'zh' ? '正在跳轉...' : 'Redirecting...'}</span>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </>
  );
};
