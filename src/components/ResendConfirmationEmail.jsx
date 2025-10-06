import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Mail, Loader2 } from 'lucide-react';

export const ResendConfirmationEmail = ({ email }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();

  const handleResend = async () => {
    if (!email) {
      toast({
        title: language === 'zh' ? '錯誤' : 'Error',
        description: language === 'zh' ? '請提供電郵地址' : 'Please provide an email address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      toast({
        title: language === 'zh' ? '電郵已發送' : 'Email Sent',
        description: language === 'zh'
          ? '確認電郵已重新發送。請檢查您的收件箱。'
          : 'Confirmation email has been resent. Please check your inbox.',
      });
    } catch (error) {
      console.error('Resend error:', error);
      toast({
        title: language === 'zh' ? '發送失敗' : 'Failed to Send',
        description: error.message || (language === 'zh'
          ? '無法重新發送確認電郵。請稍後再試。'
          : 'Could not resend confirmation email. Please try again later.'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleResend}
      disabled={isLoading}
      variant="outline"
      className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {language === 'zh' ? '發送中...' : 'Sending...'}
        </>
      ) : (
        <>
          <Mail className="w-4 h-4 mr-2" />
          {language === 'zh' ? '重新發送確認電郵' : 'Resend Confirmation Email'}
        </>
      )}
    </Button>
  );
};
