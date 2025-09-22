import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { useToast } from '@/components/ui/use-toast';
import { Star, MessageSquare, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const ReviewsTab = ({ bookings = [], reviews = [], onAddReview, onUpdateReview, setReviews, isAdmin }) => {
    const { language } = useLanguage();
    const t = translations[language];
    const { toast } = useToast();
    const { user } = useAuth();

    const [newReview, setNewReview] = useState({
        bookingId: '',
        rating: 5,
        comment: ''
    });
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [showReviewForm, setShowReviewForm] = useState(false);

    const completedBookings = bookings.filter(b => b.status === 'confirmed' && new Date(`${b.date}T${b.endTime}:00`) < new Date());
    const unreviewedBookings = completedBookings.filter(b => !reviews.some(r => r.bookingId === b.id));

    const handleAddReviewClick = () => {
        if (!newReview.bookingId || !newReview.comment) {
             toast({
                title: t.booking.missingInfo,
                description: language === 'zh' ? '請選擇預約並填寫評價內容。' : 'Please select a booking and write a review.',
                variant: 'destructive',
             });
            return;
        }
        onAddReview(newReview);
        setNewReview({ bookingId: '', rating: 5, comment: '' });
        setShowReviewForm(false);
    };
    
    const handleReplySubmit = (reviewId) => {
        const allReviews = JSON.parse(localStorage.getItem('ofcoz_reviews') || '[]');
        const updatedReviews = allReviews.map(r => r.id === reviewId ? { ...r, adminReply: replyText } : r);
        localStorage.setItem('ofcoz_reviews', JSON.stringify(updatedReviews));
        setReviews(updatedReviews);
        setReplyingTo(null);
        setReplyText("");
    };

    const handleToggleVisibility = (reviewId, isHidden) => {
        const allReviews = JSON.parse(localStorage.getItem('ofcoz_reviews') || '[]');
        const updatedReviews = allReviews.map(r => r.id === reviewId ? { ...r, hidden: !isHidden } : r);
        localStorage.setItem('ofcoz_reviews', JSON.stringify(updatedReviews));
        setReviews(updatedReviews);
    };

    const allReviews = reviews
        .map(review => ({...review, booking: bookings.find(b => b.id === review.bookingId)}))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-amber-800">
                    {isAdmin ? t.admin.manageReviews : t.dashboard.myReviews}
                </h2>
                {!isAdmin && unreviewedBookings.length > 0 && (
                    <Button
                        onClick={() => setShowReviewForm(true)}
                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                    >
                        <Star className="w-4 h-4 mr-2" />
                        {t.dashboard.addReview}
                    </Button>
                )}
            </div>

            {showReviewForm && (
                <Card className="p-6 mb-6 border-amber-200">
                    <h3 className="text-lg font-semibold text-amber-800 mb-4">
                        {t.dashboard.addReview}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <Label className="text-amber-800">{language === 'zh' ? '選擇預約' : 'Select Booking'}</Label>
                            <select
                                value={newReview.bookingId}
                                onChange={(e) => setNewReview(prev => ({ ...prev, bookingId: e.target.value }))}
                                className="w-full p-2 border border-amber-200 rounded-md focus:border-amber-400 focus:outline-none bg-white"
                            >
                                <option value="">{language === 'zh' ? '選擇一個已完成的預約' : 'Select a completed booking'}</option>
                                {unreviewedBookings.map(booking => (
                                    <option key={booking.id} value={booking.id}>
                                        {booking.room ? t.rooms.roomNames[booking.room.name] : 'Unknown Room'} - {booking.date}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label className="text-amber-800">{t.dashboard.rating}</Label>
                            <div className="flex space-x-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <Star
                                        key={star}
                                        className={`w-6 h-6 cursor-pointer ${star <= newReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                        onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                                    />
                                ))}
                            </div>
                        </div>
                        <div>
                            <Label className="text-amber-800">{t.dashboard.review}</Label>
                            <Textarea
                                value={newReview.comment}
                                onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                                placeholder={language === 'zh' ? '分享您的體驗...' : 'Share your experience...'}
                                className="border-amber-200 focus:border-amber-400"
                            />
                        </div>
                        <div className="flex space-x-4">
                            <Button
                                onClick={handleAddReviewClick}
                                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                            >
                                {language === 'zh' ? '提交評價' : 'Submit Review'}
                            </Button>
                            <Button
                                onClick={() => setShowReviewForm(false)}
                                variant="outline"
                                className="border-amber-300 text-amber-700"
                            >
                                {language === 'zh' ? '取消' : 'Cancel'}
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {allReviews.length === 0 ? (
                <div className="text-center py-12">
                    <Star className="w-16 h-16 text-amber-300 mx-auto mb-4" />
                    <p className="text-amber-600 text-lg">
                        {t.dashboard.noReviews}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {allReviews.map((review) => (
                        <div key={review.id} className={`border border-amber-200 rounded-lg p-4 bg-white/50 ${review.hidden ? 'opacity-50' : ''}`}>
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h4 className="font-semibold text-amber-800">
                                        {review.booking ? t.rooms.roomNames[review.booking.room.name] : 'Unknown Room'}
                                    </h4>
                                    <div className="flex items-center space-x-1">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star
                                                key={star}
                                                className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                            />
                                        ))}
                                    </div>
                                    {isAdmin && <p className="text-xs text-gray-500">{review.userName || 'User'}</p>}
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-amber-600">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </span>
                                    {isAdmin && (
                                      <>
                                        <Button size="icon" variant="ghost" onClick={() => setReplyingTo(review.id)}>
                                            <MessageSquare className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleToggleVisibility(review.id, review.hidden)}>
                                            {review.hidden ? <EyeOff className="w-4 h-4 text-red-500" /> : <Eye className="w-4 h-4 text-green-500" />}
                                        </Button>
                                      </>
                                    )}
                                </div>
                            </div>
                            <p className="text-amber-700">{review.comment}</p>

                            {review.adminReply && (
                                <div className="mt-3 ml-4 p-3 bg-amber-50 border-l-4 border-amber-300 rounded-r-lg">
                                    <p className="font-semibold text-amber-800">{language === 'zh' ? '店家回覆' : 'Owner Reply'}</p>
                                    <p className="text-amber-700">{review.adminReply}</p>
                                </div>
                            )}

                            {replyingTo === review.id && (
                                <div className="mt-4">
                                    <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder={language === 'zh' ? '回覆...' : 'Reply...'} />
                                    <div className="flex space-x-2 mt-2">
                                        <Button size="sm" onClick={() => handleReplySubmit(review.id)}>{language === 'zh' ? '送出' : 'Submit'}</Button>
                                        <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>{language === 'zh' ? '取消' : 'Cancel'}</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};