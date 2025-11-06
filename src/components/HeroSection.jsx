
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
    <section className="relative min-h-screen flex items-center justify-center text-center overflow-hidden py-16 px-4">
      <div className="container mx-auto max-w-6xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Title Above Video */}
          <motion.h1
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-4xl md:text-6xl font-bold text-amber-800 mb-4"
          >
            {t.hero.title}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">
              Ofcoz Family
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            className="text-lg md:text-xl text-amber-700 max-w-3xl mx-auto mb-8"
          >
            {t.hero.subtitle}
          </motion.p>

          {/* Video Container */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative w-full max-w-4xl mx-auto mb-8"
          >
            <div className="relative overflow-hidden rounded-xl shadow-2xl bg-black">
              <video
                className="w-full h-full object-cover"
                controls
                autoPlay
                muted
                loop
                controlsList="nodownload"
                playsInline
                preload="auto"
                onEnded={(e) => e.target.play()}
              >
                <source
                  src="https://rlfrwsyqletwegvflqip.supabase.co/storage/v1/object/public/videos/hero_video.mp4"
                  type="video/mp4"
                />
                <p className="text-white p-4">
                  {language === 'zh'
                    ? '您的瀏覽器不支援影片播放。'
                    : 'Your browser does not support the video tag.'}
                </p>
              </video>
            </div>
          </motion.div>

          {/* CTA Button */}
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
        </motion.div>
      </div>
    </section>
  );
};
