import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { translations } from '@/data/translations';
import { Menu, X, User } from 'lucide-react';

export const Header = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const t = translations[language];
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = () => {
    if (window.scrollY > 20) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navLinks = [
    { name: t.header.rooms, href: '#rooms' },
    { name: t.header.cats, href: '#cats' },
    { name: t.header.pricing, href: '/pricing' },
    { name: t.header.contact, href: '#contact' },
  ];

  const handleNavClick = (href) => {
    setIsMenuOpen(false);
    if (href.startsWith('/')) {
      navigate(href);
    } else {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-sm shadow-md' : 'bg-transparent'}`}>
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <img 
              src="https://storage.googleapis.com/hostinger-horizons-assets-prod/39c194f1-5fbb-4e09-860b-f8ae67cf7c2e/bb0bf6301ee831106ab15fefad558edf.jpg"
              alt="Ofcoz Family Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xl font-bold text-amber-800">Ofcoz Family</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleNavClick(link.href)}
              className="text-amber-700 hover:text-orange-600 transition-colors"
            >
              {link.name}
            </button>
          ))}
        </nav>

        <div className="flex items-center space-x-2">
          <LanguageToggle />
          {user ? (
            <Button onClick={() => navigate('/dashboard')} variant="ghost" className="text-amber-700 hover:bg-amber-100">
              <User className="w-5 h-5 mr-2" />
              {language === 'zh' ? '我的帳戶' : 'My Account'}
            </Button>
          ) : (
            <Button onClick={() => navigate('/login')} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
              {language === 'zh' ? '登入' : 'Login'}
            </Button>
          )}
          <button
            className="md:hidden text-amber-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white/90 backdrop-blur-sm p-4"
        >
          <nav className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavClick(link.href)}
                className="text-amber-700 hover:text-orange-600 transition-colors text-left"
              >
                {link.name}
              </button>
            ))}
          </nav>
        </motion.div>
      )}
    </header>
  );
};