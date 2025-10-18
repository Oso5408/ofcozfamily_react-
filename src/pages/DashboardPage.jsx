import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { useToast } from '@/components/ui/use-toast';
import { ProfileSection } from '@/components/dashboard/ProfileSection';
import { BookingsTab } from '@/components/dashboard/BookingsTab';
import { ReviewsTab } from '@/components/dashboard/ReviewsTab';
import { FavoritesTab } from '@/components/dashboard/FavoritesTab';
import { TokenHistoryTab } from '@/components/dashboard/TokenHistoryTab';
import { bookingService } from '@/services';
import {
  ArrowLeft,
  Calendar,
  Star,
  Heart,
  Package
} from 'lucide-react';
import { ToastAction } from "@/components/ui/toast"

export const DashboardPage = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const reviewToastShown = useRef(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Load bookings from Supabase
    const loadBookings = async () => {
      const result = await bookingService.getUserBookings(user.id);
      if (result.success) {
        // Transform Supabase bookings to component format
        const transformedBookings = result.bookings.map(booking => {
          // Parse notes JSON if it exists
          let notes = {};
          try {
            notes = booking.notes ? JSON.parse(booking.notes) : {};
          } catch (e) {
            console.error('Failed to parse booking notes:', e);
          }

          return {
            ...booking,
            // Keep Supabase fields
            userId: booking.user_id,
            roomId: booking.room_id,
            // Extract date and time from ISO timestamps
            date: new Date(booking.start_time).toISOString().split('T')[0],
            startTime: new Date(booking.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
            endTime: new Date(booking.end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
            createdAt: booking.created_at,
            // Map receipt number
            receiptNumber: booking.receipt_number,
            // Extract data from notes
            name: notes.name || '',
            email: notes.email || '',
            phone: notes.phone || '',
            guests: notes.guests || 1,
            purpose: notes.purpose || '',
            specialRequests: notes.specialRequests || '',
            bookingType: booking.payment_method, // 'token' or 'cash'
            tokensUsed: booking.payment_method === 'token' ? booking.total_cost : 0,
            // Map room data
            room: booking.rooms || booking.room,
          };
        });

        setBookings(transformedBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

        // Check for completed bookings needing reviews
        const completedBookings = transformedBookings.filter(b =>
          b.status === 'confirmed' && new Date(b.end_time) < new Date()
        );

        const allReviews = JSON.parse(localStorage.getItem('ofcoz_reviews') || '[]');
        const userReviews = allReviews.filter(review => review.userId === user.id);
        setReviews(userReviews);

        const unreviewed = completedBookings.filter(b => !userReviews.some(r => r.bookingId === b.id));
        if (unreviewed.length > 0 && !reviewToastShown.current) {
          toast({
            title: t.dashboard.reviewReminderTitle,
            description: t.dashboard.reviewReminderDesc.replace('{count}', unreviewed.length),
            action: <ToastAction altText={t.dashboard.reviewNow} onClick={() => setActiveTab('reviews')}>{t.dashboard.reviewNow}</ToastAction>,
          });
          reviewToastShown.current = true;
        }
      } else {
        console.error('Failed to load bookings:', result.error);
        toast({
          title: language === 'zh' ? '載入失敗' : 'Loading Failed',
          description: language === 'zh' ? '無法載入預約記錄' : 'Failed to load bookings',
          variant: 'destructive'
        });
      }
    };

    loadBookings();

    // Load reviews from localStorage (still legacy)
    const allReviews = JSON.parse(localStorage.getItem('ofcoz_reviews') || '[]');
    const userReviews = allReviews.filter(review => review.userId === user.id);
    setReviews(userReviews);

    // Load favorites from localStorage (still legacy)
    const userFavorites = JSON.parse(localStorage.getItem(`ofcoz_favorites_${user.id}`) || '[]');
    setFavorites(userFavorites);

  }, [user, navigate, toast, t, language]);

  const handleAddReview = (newReview) => {
    const booking = bookings.find(b => b.id === newReview.bookingId);
    if (!booking) return;

    const review = {
      id: Date.now().toString(),
      userId: user.id,
      bookingId: newReview.bookingId,
      roomId: booking.room.id,
      rating: newReview.rating,
      comment: newReview.comment,
      createdAt: new Date().toISOString()
    };

    const allReviews = JSON.parse(localStorage.getItem('ofcoz_reviews') || '[]');
    allReviews.push(review);
    localStorage.setItem('ofcoz_reviews', JSON.stringify(allReviews));
    
    setReviews(prev => [...prev, review]);

    toast({
      title: language === 'zh' ? '評價已添加' : 'Review Added',
      description: language === 'zh' ? '感謝您的評價！' : 'Thank you for your review!'
    });
  };

  const handleToggleFavorite = (room) => {
    const isFavorite = favorites.some(fav => fav.id === room.id);
    let updatedFavorites;
    
    if (isFavorite) {
      updatedFavorites = favorites.filter(fav => fav.id !== room.id);
    } else {
      updatedFavorites = [...favorites, room];
    }
    
    setFavorites(updatedFavorites);
    localStorage.setItem(`ofcoz_favorites_${user.id}`, JSON.stringify(updatedFavorites));

    toast({
      title: isFavorite ? t.dashboard.removeFromFavorites : t.dashboard.addToFavorites,
      description: isFavorite 
        ? (language === 'zh' ? '已從收藏中移除' : 'Removed from favorites')
        : (language === 'zh' ? '已加入收藏' : 'Added to favorites')
    });
  };
  
  const handleUpdateBooking = (updatedBooking) => {
    const allBookings = JSON.parse(localStorage.getItem('ofcoz_bookings') || '[]');
    const updatedList = allBookings.map(b => b.id === updatedBooking.id ? {...updatedBooking, status: 'modified'} : b);
    localStorage.setItem('ofcoz_bookings', JSON.stringify(updatedList));
    setBookings(updatedList.filter(b => b.userId === user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    toast({
        title: t.booking.modified,
        description: t.booking.modifiedDesc,
    });
  };

  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>{`${t.dashboardPage.title} - Ofcoz Family`}</title>
        <meta name="description" content={t.dashboardPage.description} />
      </Helmet>

      <div className="min-h-screen p-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between mb-8">
              <Link 
                to="/" 
                className="inline-flex items-center text-amber-700 hover:text-amber-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                {language === 'zh' ? '返回首頁' : 'Back to Home'}
              </Link>
            </div>

            <ProfileSection />

            <div className="flex space-x-4 mb-6 flex-wrap gap-y-2">
              <Button
                onClick={() => setActiveTab('bookings')}
                variant={activeTab === 'bookings' ? 'default' : 'outline'}
                className={activeTab === 'bookings' 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' 
                  : 'border-amber-300 text-amber-700'
                }
              >
                <Calendar className="w-4 h-4 mr-2" />
                {t.dashboard.myBookings}
              </Button>
               <Button
                onClick={() => setActiveTab('tokenHistory')}
                variant={activeTab === 'tokenHistory' ? 'default' : 'outline'}
                className={activeTab === 'tokenHistory' 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' 
                  : 'border-amber-300 text-amber-700'
                }
              >
                <Package className="w-4 h-4 mr-2" />
                {t.dashboard.tokenHistory}
              </Button>
              <Button
                onClick={() => setActiveTab('reviews')}
                variant={activeTab === 'reviews' ? 'default' : 'outline'}
                className={activeTab === 'reviews' 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' 
                  : 'border-amber-300 text-amber-700'
                }
              >
                <Star className="w-4 h-4 mr-2" />
                {t.dashboard.myReviews}
              </Button>
              <Button
                onClick={() => setActiveTab('favorites')}
                variant={activeTab === 'favorites' ? 'default' : 'outline'}
                className={activeTab === 'favorites' 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' 
                  : 'border-amber-300 text-amber-700'
                }
              >
                <Heart className="w-4 h-4 mr-2" />
                {t.dashboard.myFavorites}
              </Button>
            </div>

            <Card className="p-8 glass-effect cat-shadow border-amber-200">
              {activeTab === 'bookings' && <BookingsTab bookings={bookings} setBookings={setBookings} onUpdateBooking={handleUpdateBooking} />}
              {activeTab === 'tokenHistory' && <TokenHistoryTab tokenHistory={user.tokenHistory || []} />}
              {activeTab === 'reviews' && <ReviewsTab bookings={bookings} reviews={reviews} onAddReview={handleAddReview} />}
              {activeTab === 'favorites' && <FavoritesTab favorites={favorites} onToggleFavorite={handleToggleFavorite} />}
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};