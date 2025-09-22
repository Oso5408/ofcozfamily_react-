import React from 'react';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { CatsSection } from '@/components/CatsSection';
import { RoomsSection } from '@/components/RoomsSection';
import { ContactSection } from '@/components/ContactSection';
import { Footer } from '@/components/Footer';

export const HomePage = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <>
      <Helmet>
        <title>{t.homePage.title}</title>
        <meta name="description" content={t.homePage.description} />
      </Helmet>

      <Header />
      <main>
        <HeroSection />
        <CatsSection />
        <RoomsSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
};