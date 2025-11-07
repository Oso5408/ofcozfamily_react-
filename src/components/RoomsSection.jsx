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
import { LoginPromptModal } from '@/components/LoginPromptModal';

const RoomCard = ({ room, index, t, language, onBookingClick }) => {
  const [reviews, setReviews] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();

  // Get visible images from room
  const visibleImages = room.images
    ? room.images
        .filter(img => img.visible !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(img => img.url)
    : room.image_url
    ? [room.image_url]
    : [`https://source.unsplash.com/800x600/?workspace,cozy,${index+10}`];

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
    onBookingClick(room.id);
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % visibleImages.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + visibleImages.length) % visibleImages.length);
  };

  const goToImage = (idx, e) => {
    e.stopPropagation();
    setCurrentImageIndex(idx);
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
        <div className="relative group">
          {/* Image Display */}
          <img
            className="w-full h-64 object-cover transition-opacity duration-300"
            alt={`${room.name} - cat-friendly accommodation`}
            src={visibleImages[currentImageIndex]}
          />

          {/* Navigation Arrows (only show if multiple images) */}
          {visibleImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Previous image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Next image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Dots Indicator */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {visibleImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => goToImage(idx, e)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentImageIndex
                        ? 'bg-white w-6'
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
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
              {language === 'zh'
                ? (room.description_zh || t.rooms.roomDescriptions[room.name])
                : (room.description_en || t.rooms.roomDescriptions[room.name])
              }
            </p>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white mt-auto"
            onClick={handleBookingClick}
          >
            {room.id === 9 ? t.rooms.bookButtonDayPass : t.rooms.bookButton}
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
  const navigate = useNavigate();
  const t = translations[language];
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingBookingUrl, setPendingBookingUrl] = useState('');

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

  // Handle booking click - check if user is logged in
  const handleBookingClick = (roomId) => {
    if (!user) {
      // User is not logged in, show login prompt
      const bookingUrl = `/booking/${roomId}`;
      setPendingBookingUrl(bookingUrl);
      setShowLoginPrompt(true);
    } else {
      // User is logged in, navigate to booking page
      navigate(`/booking/${roomId}`);
    }
  };

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
            {/* Lobby Seat Section */}
            {visibleRooms.some(room => room.id === 9) && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-amber-800 mb-6 text-center">
                  {language === 'zh' ? '預約' : 'Booking'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {visibleRooms
                    .filter(room => room.id === 9)
                    .map((room, index) => (
                      <RoomCard
                        room={room}
                        index={index}
                        key={room.id}
                        t={t}
                        language={language}
                        onBookingClick={handleBookingClick}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Other Rooms - No title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {visibleRooms
                .filter(room => room.id !== 9)
                .map((room, index) => (
                  <RoomCard
                    room={room}
                    index={index}
                    key={room.id}
                    t={t}
                    language={language}
                    onBookingClick={handleBookingClick}
                  />
                ))}
            </div>
          </div>
          <div className="lg:col-span-1">
            <TermsBox t={t} />
          </div>
        </div>

        {/* Login Prompt Modal */}
        <LoginPromptModal
          isOpen={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          returnUrl={pendingBookingUrl}
        />
      </div>
    </section>
  );
};