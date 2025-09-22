import React from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleLanguage}
        className="flex items-center space-x-2 text-amber-700 hover:text-amber-900 hover:bg-amber-100/50"
      >
        <Globe className="w-4 h-4" />
        <span className="font-medium">
          {language === 'en' ? '中文' : 'EN'}
        </span>
      </Button>
    </motion.div>
  );
};