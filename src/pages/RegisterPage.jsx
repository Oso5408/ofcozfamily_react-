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
import { ArrowLeft, UserPlus } from 'lucide-react';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: language === 'zh' ? '密碼不匹配' : 'Passwords do not match',
        description: language === 'zh' ? '請確認您輸入的密碼相同' : 'Please ensure your passwords match.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);

    const result = register({ name, email, password });

    if (result.success) {
      toast({
        title: language === 'zh' ? '註冊成功！' : 'Registration Successful!',
        description: language === 'zh' ? '歡迎加入Ofcoz Family！' : 'Welcome to the Ofcoz Family!',
      });
      navigate('/dashboard');
    } else {
      toast({
        title: language === 'zh' ? '註冊失敗' : 'Registration Failed',
        description: result.error,
        variant: 'destructive',
      });
    }

    setIsLoading(false);
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
                  className="border-amber-200 focus:border-amber-400"
                  required
                />
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
                  className="border-amber-200 focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-amber-800">
                  {language === 'zh' ? '密碼' : 'Password'}
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
                  {language === 'zh' ? '確認密碼' : 'Confirm Password'}
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