import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

export const VideoSection = () => {
  const { language } = useLanguage();

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-ivory-bg to-white">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Title Above Video */}
          <h2 className="text-3xl md:text-4xl font-bold text-amber-800 mb-4">
            {language === 'zh' ? '歡迎來到 ' : 'Welcome to '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">
              Ofcoz Family
            </span>
          </h2>
          <p className="text-lg text-amber-700 max-w-3xl mx-auto mb-8">
            {language === 'zh'
              ? '與我們六隻可愛的常駐貓咪一起體驗完美的工作時光，預約你的貓咪友好工作間，創造難忘的回憶！🐾'
              : 'Experience the perfect working time with our six adorable resident cats. Book your cat-friendly workspace and create unforgettable memories! 🐾'}
          </p>

          {/* Video Container */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl">
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src="https://www.youtube.com/embed/S2p_b_YbeBA"
              title="Ofcoz Family Introduction Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
