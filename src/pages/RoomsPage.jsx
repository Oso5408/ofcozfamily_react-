import React from 'react';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RoomsSection } from '@/components/RoomsSection';

export const RoomsPage = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <>
      <Helmet>
        <title>{`${t.roomsPage.title} - Ofcoz Family`}</title>
        <meta name="description" content={t.roomsPage.description} />
      </Helmet>
      <div className="flex flex-col min-h-screen bg-ivory-bg cat-pattern-bg">
        <Header />
        <main className="flex-grow">
          <RoomsSection />
        </main>
        <Footer />
      </div>
    </>
  );
};