
import React from 'react';
import { Helmet } from "react-helmet-async";
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

export const PricingPage = () => {
  const { language } = useLanguage();
  const t = translations[language].pricingPage;
  const { toast } = useToast();

  const handleBuyNow = () => {
    toast({
      title: "🚧 Feature Not Implemented",
      description: "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  const pricingCards = [
    {
      title: t.oneDayPass,
      price: "100",
      per: t.perPerson,
      description: t.oneDayPassDesc,
      features: [t.oneDayPassTime],
      buttonText: t.buyNow,
    },
    {
      title: t.oneDayPassPackage,
      price: "1000",
      per: "/ 20 passes",
      description: t.oneDayPassPackageDesc,
      features: [],
      buttonText: t.buyNow,
    },
    {
      title: t.workspacePackage,
      price: "1680",
      per: `/ ${t.hours15}`,
      description: t.workspacePackageDesc,
      features: [t.roomSize1, t.packageValidity],
      buttonText: t.contactUs,
    },
    {
      title: t.workspacePackage,
      price: "2680",
      per: `/ ${t.hours30}`,
      description: t.workspacePackageDesc,
      features: [t.roomSize1, t.packageValidity],
      buttonText: t.contactUs,
    },
  ];

  const rentalCards = [
    {
      title: t.dailyRental,
      description: t.roomC,
      price: "800",
      per: `(${t.specialPrice})`,
      features: [t.timeSlots, "10:00-20:00", "11:00-21:00", "12:00-22:00", t.defaultTime],
    },
    {
      title: t.dailyRental,
      description: t.otherRooms,
      price: "600",
      per: `(${t.specialPrice})`,
      features: [t.timeSlots, "10:00-20:00", "11:00-21:00", "12:00-22:00", t.defaultTime],
    },
    {
      title: t.hourlyRental,
      description: `${t.roomC} (${t.hourlyRentalDesc})`,
      price: "150",
      per: t.perHour,
      features: [],
      isHourly: true,
    },
    {
      title: t.hourlyRental,
      description: `${t.otherRooms} (${t.hourlyRentalDesc})`,
      price: "120",
      per: t.perHour,
      features: [],
      isHourly: true,
    },
  ];

  return (
    <>
      <Helmet>
        <title>{`${t.title} - Ofcoz Family`}</title>
        <meta name="description" content={t.subtitle} />
      </Helmet>
      <Header />
      <main className="container mx-auto py-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-amber-800 mb-4">{t.title}</h1>
          <p className="text-lg text-amber-700">{t.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {pricingCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
            >
              <Card className="flex flex-col h-full glass-effect cat-shadow border-amber-200">
                <CardHeader>
                  <CardTitle className="text-amber-800">{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-amber-900">${card.price}</span>
                    <span className="text-amber-600 ml-1">{card.per}</span>
                  </div>
                  <ul className="space-y-2">
                    {card.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span className="text-amber-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleBuyNow} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
                    {card.buttonText}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {rentalCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: (pricingCards.length + index) * 0.1, duration: 0.8 }}
            >
              <Card className="flex flex-col h-full glass-effect cat-shadow border-amber-200">
                <CardHeader>
                  <CardTitle className="text-amber-800">{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  {card.isHourly ? (
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-amber-900">{t.hourlyPriceFormat.replace('{price}', card.price)}</span>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-amber-900">${card.price}</span>
                      <span className="text-amber-600 ml-1">{card.per}</span>
                    </div>
                  )}
                   <ul className="space-y-2">
                    {card.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span className="text-amber-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
};
