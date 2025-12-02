import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const BookingDetailsModal = ({ isOpen, onOpenChange, booking, t, language }) => {
    if (!booking) return null;
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{booking.room?.name ? t.rooms.roomNames[booking.room.name] : 'Unknown Room'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 text-amber-700">
                    <p className="flex items-center"><Hash className="w-4 h-4 mr-2" /><strong>{t.email.bookingConfirmed.bookingId}:</strong> {booking.receiptNumber}</p>
                    <p className="flex items-center"><Users className="w-4 h-4 mr-2" /><strong>{language === 'zh' ? '客戶:' : 'Client:'}</strong> {booking.name}</p>
                    <p className="flex items-center"><Clock className="w-4 h-4 mr-2" /><strong>{language === 'zh' ? '時間:' : 'Time:'}</strong> {booking.startTime} - {booking.endTime}</p>
                    <p><strong>{language === 'zh' ? '目的:' : 'Purpose:'}</strong> {booking.purpose}</p>
                    {booking.specialRequests && <p><strong>{language === 'zh' ? '備註:' : 'Remarks:'}</strong> {booking.specialRequests}</p>}
                </div>
            </DialogContent>
        </Dialog>
    );
};


// Helper function to normalize booking data
const normalizeBooking = (booking) => {
    // Extract date string directly from ISO timestamp to avoid timezone issues
    const extractDate = (isoString) => {
      if (!isoString) return '';
      // Extract YYYY-MM-DD directly from ISO string before any timezone conversion
      const dateStr = isoString.split('T')[0];
      return dateStr;
    };

    // Extract time from ISO timestamp (HH:MM format)
    const extractTime = (isoString) => {
      if (!isoString) return '';
      // If it's already in time format (HH:MM), return as is
      if (/^\d{2}:\d{2}$/.test(isoString)) return isoString;
      // Otherwise extract from ISO timestamp
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    // Parse notes JSON if available
    let notes = {};
    try {
      notes = booking.notes ? JSON.parse(booking.notes) : {};
    } catch (e) {
      console.error('Failed to parse booking notes:', e);
    }

    const normalized = {
      ...booking,
      room: booking.rooms || booking.room,
      date: extractDate(booking.start_time) || booking.date,
      startTime: extractTime(booking.start_time || booking.startTime),
      endTime: extractTime(booking.end_time || booking.endTime),
      createdAt: booking.created_at || booking.createdAt,
      // Map receipt number
      receiptNumber: booking.receipt_number || booking.receiptNumber,
      // Extract details from notes
      name: notes.name || '',
      purpose: notes.purpose || '',
      specialRequests: notes.specialRequests || '',
    };

    return normalized;
};

export const BookingCalendar = ({ bookings }) => {
    const { language } = useLanguage();
    const t = translations[language];
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Normalize bookings to handle both Supabase and localStorage formats
    const safeBookings = (bookings || []).map(normalizeBooking);

    const daysOfWeek = language === 'zh' 
        ? ['日', '一', '二', '三', '四', '五', '六']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const monthNames = language === 'zh'
        ? ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
        : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const handleDateClick = (day) => {
        setSelectedDate(day);
    };

    const handleBookingClick = (booking) => {
        setSelectedBooking(booking);
        setIsModalOpen(true);
    };
    
    const handleDailyViewClick = (date) => {
        navigate(`/admin/daily-bookings/${date.toISOString().split('T')[0]}`);
    }

    const renderHeader = () => {
        return (
            <div className="flex justify-between items-center py-4">
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-2xl font-bold text-amber-800">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </div>
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        );
    };

    const renderDays = () => {
        return (
            <div className="grid grid-cols-7 text-center font-semibold text-amber-700">
                {daysOfWeek.map(day => <div key={day} className="py-2">{day}</div>)}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const startDate = new Date(monthStart);
        startDate.setDate(startDate.getDate() - monthStart.getDay());
        const endDate = new Date(monthEnd);
        if (monthEnd.getDay() !== 6) {
            endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));
        }

        const rows = [];
        let days = [];
        let day = new Date(startDate);
        
        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const cloneDay = new Date(day);
                // Format date as YYYY-MM-DD without timezone conversion
                const year = cloneDay.getFullYear();
                const month = String(cloneDay.getMonth() + 1).padStart(2, '0');
                const dayNum = String(cloneDay.getDate()).padStart(2, '0');
                const dayString = `${year}-${month}-${dayNum}`;
                const dayBookings = safeBookings.filter(b => b.date === dayString);

                days.push(
                    <div
                        className={cn(
                            "relative flex flex-col p-2 h-40 border-r border-b border-amber-100 cursor-pointer transition-colors hover:bg-amber-100",
                            cloneDay.getMonth() !== currentDate.getMonth() && "bg-amber-50/50 text-amber-400",
                            new Date().toDateString() === cloneDay.toDateString() && "bg-amber-200",
                            selectedDate?.toDateString() === cloneDay.toDateString() && "ring-2 ring-amber-500"
                        )}
                        key={day.toString()}
                        onClick={() => handleDateClick(cloneDay)}
                    >
                        <span className="font-medium self-end">{cloneDay.getDate()}</span>
                        <div className="flex-grow overflow-y-auto text-xs space-y-1 mt-1">
                           {dayBookings.slice(0, 3).map(booking => (
                               <div key={booking.id}
                                    className={`p-1 rounded truncate ${
                                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                      booking.status === 'to_be_confirmed' ? 'bg-blue-100 text-blue-800' :
                                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      booking.status === 'rescheduled' ? 'bg-purple-100 text-purple-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}
                                    onClick={(e) => { e.stopPropagation(); handleBookingClick(booking); }}
                               >
                                   <p className="font-semibold">{booking.room?.name ? t.rooms.roomNames[booking.room.name] : 'Unknown'}</p>
                                   <p>{booking.startTime || ''}</p>
                               </div>
                           ))}
                           {dayBookings.length > 3 && (
                               <div className="text-center text-blue-600 font-bold" onClick={(e) => { e.stopPropagation(); handleDailyViewClick(cloneDay); }}>+{dayBookings.length - 3} more</div>
                           )}
                        </div>
                    </div>
                );
                day.setDate(day.getDate() + 1);
            }
            rows.push(<div className="grid grid-cols-7" key={day.toString()}>{days}</div>);
            days = [];
        }
        return <div className="border-t border-l border-amber-100">{rows}</div>;
    };

    const selectedDayBookings = selectedDate
        ? (() => {
            // Format selected date as YYYY-MM-DD without timezone conversion
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const selectedDateString = `${year}-${month}-${day}`;
            return safeBookings.filter(b => b.date === selectedDateString)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
        })()
        : [];

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white/70 p-4 rounded-lg">
                    {renderHeader()}
                    {renderDays()}
                    {renderCells()}
                </div>
                <div className="lg:col-span-1">
                    <AnimatePresence>
                    {selectedDate && (
                        <motion.div
                            key={selectedDate.toISOString()}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <Card className="sticky top-24">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between text-amber-800">
                                        <span className="flex items-center">
                                          <CalendarIcon className="w-5 h-5 mr-2" />
                                          {selectedDate.toLocaleDateString(language === 'zh' ? 'zh-HK' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </span>
                                        <Button size="sm" onClick={() => handleDailyViewClick(selectedDate)}>
                                          {language === 'zh' ? '查看日視圖' : 'Daily View'}
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="max-h-[70vh] overflow-y-auto">
                                    {selectedDayBookings.length > 0 ? (
                                        <div className="space-y-4">
                                            {selectedDayBookings.map(booking => (
                                                <div key={booking.id} className="p-4 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-50" onClick={() => handleBookingClick(booking)}>
                                                    <p className="font-bold text-amber-700">{booking.room?.name ? t.rooms.roomNames[booking.room.name] : 'Unknown Room'}</p>
                                                    <div className="text-sm text-amber-600 space-y-1 mt-1">
                                                        <p className={`font-semibold ${
                                                          booking.status === 'confirmed' ? 'text-green-600' :
                                                          booking.status === 'to_be_confirmed' ? 'text-blue-600' :
                                                          booking.status === 'pending' ? 'text-yellow-600' :
                                                          booking.status === 'cancelled' ? 'text-red-600' :
                                                          booking.status === 'rescheduled' ? 'text-purple-600' :
                                                          'text-gray-600'
                                                        }`}>
                                                            {t.booking.status[booking.status] || booking.status}
                                                        </p>
                                                        <p className="flex items-center"><Clock className="w-4 h-4 mr-2" />
                                                          {booking.startTime || ''} - {booking.endTime || ''}
                                                        </p>
                                                        <p className="flex items-center"><Users className="w-4 h-4 mr-2" />{booking.name || booking.users?.full_name || 'N/A'}</p>
                                                        {booking.receiptNumber && <p className="flex items-center"><Hash className="w-4 h-4 mr-2" />{booking.receiptNumber}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-amber-600 py-8">{language === 'zh' ? '該日無預約' : 'No bookings for this day.'}</p>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>
            </div>
            <BookingDetailsModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} booking={selectedBooking} t={t} language={language} />
        </>
    );
};