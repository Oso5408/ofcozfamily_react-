import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';

export const Footer = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <footer className="py-8 px-4 bg-amber-800 text-white">
      <div className="container mx-auto text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img 
              src="https://storage.googleapis.com/hostinger-horizons-assets-prod/39c194f1-5fbb-4e09-860b-f8ae67cf7c2e/bb0bf6301ee831106ab15fefad558edf.jpg"
              alt="Ofcoz Family Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xl font-bold">Ofcoz Family</span>
        </div>
        <p className="text-amber-200">{t.footer.copyright}</p>
      </div>
    </footer>
  );
};