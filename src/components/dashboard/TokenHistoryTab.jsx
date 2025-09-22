import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { Package, Clock } from 'lucide-react';

export const TokenHistoryTab = ({ tokenHistory }) => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div>
      <h2 className="text-2xl font-bold text-amber-800 mb-6">
        {t.dashboard.tokenHistory}
      </h2>

      {tokenHistory.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-amber-300 mx-auto mb-4" />
          <p className="text-amber-600 text-lg mb-4">
            {t.dashboard.noTokenHistory}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tokenHistory.map((entry, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-amber-200 rounded-lg p-4 bg-white/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-amber-800">{entry.description}</p>
                  <p className="text-sm text-amber-600 flex items-center mt-1">
                    <Clock className="w-4 h-4 mr-1"/>
                    {new Date(entry.date).toLocaleString()}
                  </p>
                </div>
                <p className={`text-lg font-bold ${entry.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {entry.amount > 0 ? `+${entry.amount}` : entry.amount}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};