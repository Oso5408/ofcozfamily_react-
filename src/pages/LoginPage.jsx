import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { ArrowLeft, LogIn } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const result = login(email, password, rememberMe);
    
    if (result.success) {
      toast({
        title: language === 'zh' ? '登入成功！' : 'Login Successful!',
        description: language === 'zh' ? '歡迎回來！' : 'Welcome back!'
      });
      navigate('/dashboard');
    } else {
      toast({
        title: language === 'zh' ? '登入失敗' : 'Login Failed',
        description: language === 'zh' ? '電郵或密碼錯誤' : 'Invalid email or password',
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
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
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-amber-200 focus:border-amber-400"
                  required
                />
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