import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from "react-helmet-async";
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Hash, Users } from 'lucide-react';
import { roomsData } from '@/data/roomsData';

const RoomTimeline = ({ room, bookings, t }) => {
  const hours = Array.from({ length: 13 }, (_, i) => i + 10); // 10 AM to 10 PM
  const getBookingAtHour = (hour) => {
    const time = `${String(hour).padStart(2, '0')}:00`;
    return bookings.find(b => {
      const start = parseInt(b.startTime.split(':')[0]);
      const end = parseInt(b.endTime.split(':')[0]);
      return hour >= start && hour < end;
    });
  };

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-amber-800 mb-2">{t.rooms.roomNames[room.name]}</h3>
      <div className="grid grid-cols-13 gap-1 bg-amber-50 p-2 rounded-lg">
        {hours.map(hour => {
          const booking = getBookingAtHour(hour);
          return (
            <div key={hour} className="text-center">
              <div className="text-xs text-amber-600 mb-1">{`${hour}:00`}</div>
              <div className={`h-16 rounded ${booking ? 'bg-blue-300' : 'bg-green-100'}`} title={booking ? `${booking.name} (${booking.startTime}-${booking.endTime})` : t.admin.available}>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const DailyBookingsPage = () => {
  const { date } = useParams();
  const { language } = useLanguage();
  const t = translations[language];
  const [dailyBookings, setDailyBookings] = useState([]);

  useEffect(() => {
    const allBookings = JSON.parse(localStorage.getItem('ofcoz_bookings') || '[]');
    const bookingsForDate = allBookings
      .filter(b => b.date === date && b.status === 'confirmed')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    setDailyBookings(bookingsForDate);
  }, [date]);

  const visibleRooms = roomsData.filter(r => !r.hidden);
  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString(language === 'zh' ? 'zh-HK' : 'en-US');

  return (
    <>
      <Helmet>
        <title>{`${t.dailyBookingsPage.title} - ${formattedDate}`}</title>
        <meta name="description" content={`${t.dailyBookingsPage.description} ${formattedDate}`} />
      </Helmet>
      <div className="min-h-screen p-4 md:p-8">
        <div className="container mx-auto max-w-7xl">
          <Link to="/admin" className="inline-flex items-center text-amber-700 hover:text-amber-900 transition-colors mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t.admin.backToAdmin}
          </Link>
          <h1 className="text-3xl font-bold text-amber-800 mb-4">
            {t.admin.dailyTimetable} - {formattedDate}
          </h1>
          
          <Card className="p-6 md:p-8 glass-effect cat-shadow border-amber-200 mb-8">
            <CardHeader>
              <CardTitle>{t.admin.dailyTimetable}</CardTitle>
            </CardHeader>
            <CardContent>
              {visibleRooms.map(room => (
                <RoomTimeline key={room.id} room={room} bookings={dailyBookings.filter(b => b.room.id === room.id)} t={t} />
              ))}
            </CardContent>
          </Card>

          <Card className="p-6 md:p-8 glass-effect cat-shadow border-amber-200">
            <CardHeader>
              <CardTitle>{t.admin.dailyBookings}</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyBookings.length > 0 ? (
                <div className="space-y-4">
                  {dailyBookings.map(booking => (
                    <div key={booking.id} className="p-4 border border-amber-200 rounded-lg">
                      <p className="font-bold text-amber-700">{t.rooms.roomNames[booking.room.name]}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-amber-600 mt-2">
                        <p className="flex items-center"><Users className="w-4 h-4 mr-2" />{booking.name}</p>
                        <p className="flex items-center"><Clock className="w-4 h-4 mr-2" />{booking.startTime} - {booking.endTime}</p>
                        <p className="flex items-center"><Hash className="w-4 h-4 mr-2" />{booking.receiptNumber}</p>
                        <p>{booking.purpose}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-amber-600 py-8">{t.admin.noBookingsForDate}</p>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </>
  );
};