import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from "react-helmet-async";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Send password reset email via Supabase (using Resend)
      const redirectUrl = `${window.location.origin}/#/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error('Error sending reset email:', error);
        // Don't throw - show generic success message for security
      }

      // Show success message (intentionally vague for security)
      toast({
        title: language === 'zh' ? '✅ 重設郵件已發送' : '✅ Reset Email Sent',
        description: language === 'zh'
          ? '如果帳戶存在，我們已發送密碼重設連結到您的郵箱。請檢查您的電郵（包括垃圾郵件夾）。'
          : 'If an account exists, we have sent a password reset link to your email. Please check your inbox (and spam folder).',
      });

      console.log('✅ Password reset email sent via Resend');
      navigate('/login');
    } catch (error) {
      console.error('Error in password reset:', error);

      // Show generic success message even on error (security best practice)
      toast({
        title: language === 'zh' ? '✅ 重設郵件已發送' : '✅ Reset Email Sent',
        description: language === 'zh'
          ? '如果帳戶存在，我們已發送密碼重設連結到您的郵箱。'
          : 'If an account exists, we have sent a password reset link to your email.',
      });

      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{`${t.forgotPasswordPage.title} - Ofcoz Family`}</title>
        <meta name="description" content={t.forgotPasswordPage.description} />
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
                {language === 'zh' ? '忘記密碼' : 'Forgot Password'}
              </h1>
              <p className="text-amber-600">
                {language === 'zh' ? '輸入您的電郵地址以重設密碼' : 'Enter your email to reset your password'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-amber-800">
                  {language === 'zh' ? '電郵地址' : 'Email Address'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-amber-200 focus:border-amber-400"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
              >
                <Mail className="w-4 h-4 mr-2" />
                {isLoading 
                  ? (language === 'zh' ? '發送中...' : 'Sending...') 
                  : (language === 'zh' ? '發送重設郵件' : 'Send Reset Email')
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