import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, MessageCircle, Instagram } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';

export const ContactSection = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const addressZh = '九龍長沙灣永康街77號環薈中心12樓07室';
  const addressEn = 'Rm 1207, CEO Tower, 77 Wing Hong Street, Cheung Sha Wan, Kowloon';
  const mapQuery = 'CEO Tower, 77 Wing Hong Street, Cheung Sha Wan';
  const phoneNumber = '6623 8788';

  return (
    <section id="contact" className="py-16 px-4 bg-white/50">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-amber-800 mb-4">{t.contact.title}</h2>
          <p className="text-lg text-amber-700">{t.contact.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <motion.a
            href={`https://maps.google.com/?q=${encodeURIComponent(mapQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-center group"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-amber-800 mb-2">{t.contact.location}</h3>
            <p className="text-amber-700 text-sm group-hover:text-amber-900 transition-colors">
              {language === 'zh' ? addressZh : addressEn}
            </p>
          </motion.a>

          <motion.a
            href={`https://wa.me/852${phoneNumber.replace(/\s/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-center group"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-amber-800 mb-2">{t.contact.phone}</h3>
            <p className="text-amber-700 group-hover:text-amber-900 transition-colors">{phoneNumber}</p>
          </motion.a>

          <motion.a
            href="https://www.instagram.com/ofcoz.family?igsh=MTJ4aWdnMWtwZnhvcg=="
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-center group"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Instagram className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-amber-800 mb-2">Instagram</h3>
            <p className="text-amber-700 group-hover:text-amber-900 transition-colors">ofcoz.family</p>
          </motion.a>
        </div>
      </div>
    </section>
  );
};