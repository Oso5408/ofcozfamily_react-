import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const LoginPromptModal = ({ isOpen, onClose, returnUrl }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const handleLogin = () => {
    onClose();
    navigate('/login', { state: { returnUrl } });
  };

  const handleRegister = () => {
    onClose();
    navigate('/register', { state: { returnUrl } });
  };

  const translations = {
    en: {
      title: 'Sign In Required',
      description: 'Please sign in or create an account to book a room.',
      message: 'You need to be logged in to make a booking. Please sign in to continue, or create a new account if you don\'t have one yet.',
      loginButton: 'Sign In',
      registerButton: 'Create Account',
      cancelButton: 'Cancel',
    },
    zh: {
      title: '需要登入',
      description: '請登入或註冊帳戶以預約房間。',
      message: '您需要登入才能進行預約。請登入以繼續，如果您還沒有帳戶，請先註冊一個新帳戶。',
      loginButton: '登入',
      registerButton: '註冊帳戶',
      cancelButton: '取消',
    },
  };

  const t = translations[language];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-amber-800 flex items-center gap-2">
            <LogIn className="w-6 h-6" />
            {t.title}
          </DialogTitle>
          <DialogDescription className="text-amber-700 text-base pt-2">
            {t.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-amber-600 leading-relaxed">
            {t.message}
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-50 w-full sm:w-auto"
          >
            {t.cancelButton}
          </Button>
          <Button
            onClick={handleRegister}
            variant="outline"
            className="border-amber-400 text-amber-800 hover:bg-amber-50 w-full sm:w-auto"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {t.registerButton}
          </Button>
          <Button
            onClick={handleLogin}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white w-full sm:w-auto"
          >
            <LogIn className="w-4 h-4 mr-2" />
            {t.loginButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
