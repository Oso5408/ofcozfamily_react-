import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { catsData } from '@/data/catsData';

export const CatsSection = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <section id="cats" className="py-16 px-4 bg-white/50">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-amber-800 mb-4">{t.cats.title}</h2>
          <p className="text-lg text-amber-700">{t.cats.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {catsData.map((cat, index) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <Card className="p-6 glass-effect cat-shadow border-amber-200">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden">
                    <img 
                      src={cat.image}
                      alt={`${cat.name} - ${language === 'zh' ? cat.nameZh : cat.name}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-amber-800 mb-2">
                    {language === 'zh' ? cat.nameZh : cat.name}
                  </h3>
                  <p className="text-amber-600 mb-2">{t.cats.colors[cat.color]}</p>
                  <p className="text-sm text-amber-700">{t.cats.personalities[cat.personality]}</p>
                  <div className="flex justify-center mt-3">
                    {[...Array(5)].map((_, i) => (
                      <Heart key={i} className="w-4 h-4 text-pink-400 fill-current" />
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};