
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';

export const HeroSection = () => {
  const { language } = useLanguage();
  const t = translations[language];

  const handleCTA = () => {
    const roomsSection = document.getElementById('rooms');
    if (roomsSection) {
      roomsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative h-screen flex items-center justify-center text-center overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <div className="video-background">
          <iframe
            src="https://www.youtube.com/embed/S2p_b_YbeBA?autoplay=1&mute=1&loop=1&playlist=S2p_b_YbeBA&controls=0&showinfo=0&autohide=1&modestbranding=1"
            frameBorder="0"
            allow="autoplay; encrypted-media;"
            allowFullScreen
            title="Background Video"
          ></iframe>
        </div>
        <div className="absolute inset-0 bg-black/50"></div>
      </div>
      <div className="relative z-10 p-8">
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-5xl md:text-7xl font-bold text-white mb-4"
        >
          {t.hero.title} <span className="text-amber-400">Ofcoz Family</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className="text-lg md:text-xl text-amber-100 max-w-2xl mx-auto mb-8"
        >
          {t.hero.subtitle}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6, type: 'spring', stiffness: 120 }}
        >
          <Button
            onClick={handleCTA}
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg transform hover:scale-105 transition-transform"
          >
            {t.hero.cta}
          </Button>
        </motion.div>
      </div>
      <div className="absolute bottom-4 right-4 z-10 text-white text-xs opacity-50">
        {t.hero.videoCopyright}
      </div>
    </section>
  );
};
