import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { translations } from '@/data/translations';
import { roomsData } from '@/data/roomsData';
import { useNavigate } from 'react-router-dom';
import { roomService } from '@/services/roomService';

const RoomCard = ({ room, index, t }) => {
  const [reviews, setReviews] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const allReviews = JSON.parse(localStorage.getItem('ofcoz_reviews') || '[]');
    const roomReviews = allReviews.filter(review => review.roomId === room.id);
    setReviews(roomReviews);
  }, [room.id]);

  const getRoomRating = () => {
    if (reviews.length === 0 || room.id === 9) { // No ratings for One Day Pass
      return { average: 'N/A', count: 0 };
    }
    const averageRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1);
    return { average: averageRating, count: reviews.length };
  };

  const rating = getRoomRating();

  const handleBookingClick = () => {
    navigate(`/booking/${room.id}`);
  };

  return (
    <motion.div
      key={room.id}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.8 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className="overflow-hidden glass-effect cat-shadow border-amber-200 h-full flex flex-col">
        <div className="relative">
          <img
            className="w-full h-64 object-cover"
            alt={`${room.name} - cat-friendly accommodation`}
            src={room.image_url || `https://source.unsplash.com/800x600/?workspace,cozy,${index+10}`} />
        </div>
        
        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-2xl font-semibold text-amber-800 mb-2">
            {t.rooms.roomNames[room.name]}
          </h3>
          
          <div className="flex items-center justify-start flex-wrap gap-x-4 gap-y-1 mb-4 text-amber-600 text-sm">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              <span>{t.rooms.upTo} {room.capacity} {t.rooms.guests}</span>
            </div>
            { room.id !== 9 && 
            <div className="flex items-center">
              <Star className="w-4 h-4 mr-1 fill-current text-yellow-500" />
              <span>{rating.average} ({rating.count} {t.rooms.reviews})</span>
            </div>
            }
          </div>

          <div className="mb-6 flex-grow">
            <h4 className="font-medium text-amber-800 mb-2">{t.rooms.descriptionTitle}</h4>
            <p className="text-amber-700 text-sm whitespace-pre-wrap">
              {t.rooms.roomDescriptions[room.name]}
            </p>
          </div>

          <Button 
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white mt-auto"
            onClick={handleBookingClick}
          >
            {t.rooms.bookButton}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

const TermsBox = ({ t }) => (
  <motion.div
    initial={{ opacity: 0, x: 50, scale: 0.98 }}
    whileInView={{ opacity: 1, x: 0, scale: 1 }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    className="lg:sticky lg:top-24"
  >
    <Card className="p-6 glass-effect cat-shadow border-amber-200 h-full">
      <h3 className="text-2xl font-bold text-amber-800 mb-4">{t.rooms.terms.title}</h3>
      <div className="max-h-[600px] overflow-y-auto pr-4 text-amber-700 space-y-2 text-sm whitespace-pre-wrap">
        {t.rooms.terms.content}
      </div>
    </Card>
  </motion.div>
);

export const RoomsSection = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const t = translations[language];
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch rooms from Supabase
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        // Fetch rooms based on whether user is admin
        const result = await roomService.getRooms(user?.isAdmin || user?.is_admin);

        if (result.success) {
          setRooms(result.rooms);
        } else {
          console.warn('⚠️ Failed to load rooms from Supabase, using local data');
          setRooms(roomsData);
        }
      } catch (error) {
        console.error('❌ Error loading rooms:', error);
        setRooms(roomsData);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [user]);

  const visibleRooms = rooms
    .filter(room => !room.hidden || (user && (user.isAdmin || user.is_admin)))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (loading) {
    return (
      <section id="rooms" className="py-16 px-4">
        <div className="container mx-auto text-center">
          <p className="text-amber-700">{language === 'zh' ? '載入中...' : 'Loading...'}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="rooms" className="py-16 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-amber-800 mb-4">{t.rooms.title}</h2>
          <p className="text-lg text-amber-700">{t.rooms.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {visibleRooms.map((room, index) => (
                <RoomCard room={room} index={index} key={room.id} t={t} />
              ))}
            </div>
          </div>
          <div className="lg:col-span-1">
            <TermsBox t={t} />
          </div>
        </div>
      </div>
    </section>
  );
};