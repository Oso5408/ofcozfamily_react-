import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { roomsData } from '@/data/roomsData';
import { Link } from 'react-router-dom';
import { Heart, Trash2 } from 'lucide-react';

export const FavoritesTab = ({ favorites, onToggleFavorite }) => {
    const { language } = useLanguage();
    const t = translations[language];

    return (
        <div>
            <h2 className="text-2xl font-bold text-amber-800 mb-6">
                {t.dashboard.myFavorites}
            </h2>

            {favorites.length === 0 ? (
                <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-amber-300 mx-auto mb-4" />
                    <p className="text-amber-600 text-lg mb-4">
                        {t.dashboard.noFavorites}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {roomsData.map(room => (
                            <div key={room.id} className="border border-amber-200 rounded-lg p-4 bg-white/50">
                                <h4 className="font-semibold text-amber-800 mb-2">
                                    {t.rooms.roomNames[room.name]}
                                </h4>
                                <p className="text-amber-600 text-sm mb-3">
                                    {t.booking.upTo} {room.capacity} {t.rooms.guests}
                                </p>
                                <Button
                                    onClick={() => onToggleFavorite(room)}
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                                >
                                    <Heart className="w-4 h-4 mr-2" />
                                    {t.dashboard.addToFavorites}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((room) => (
                        <motion.div
                            key={room.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border border-amber-200 rounded-lg p-6 bg-white/50"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-amber-800">
                                        {t.rooms.roomNames[room.name]}
                                    </h3>
                                    <p className="text-amber-600">
                                        {t.booking.upTo} {room.capacity} {t.rooms.guests}
                                    </p>
                                </div>
                                <Button
                                    onClick={() => onToggleFavorite(room)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-amber-700">
                                    <strong>{t.rooms.features}</strong>
                                </p>
                                <ul className="text-sm text-amber-600">
                                    {room.features.map((feature, index) => (
                                        <li key={index}>• {t.rooms.roomFeatures[feature]}</li>
                                    ))}
                                </ul>
                            </div>
                            <Link to="/" className="block mt-4">
                                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
                                    {t.rooms.bookButton}
                                </Button>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};