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
          <div className="relative w-full rounded-xl overflow-hidden shadow-2xl bg-black">
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
      </div>
    </section>
  );
};
