import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { roomsData } from '@/data/roomsData';
import { generateTimeOptions } from '@/lib/timeUtils';

export const EditBookingModal = ({ isOpen, onClose, booking, onSave }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const [editedBooking, setEditedBooking] = useState(booking);
  const [timeOptions, setTimeOptions] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

  useEffect(() => {
    setEditedBooking(booking);
  }, [booking]);

  // Fetch time options when date or room changes
  useEffect(() => {
    const fetchTimeOptions = async () => {
      if (!editedBooking?.date || !editedBooking?.room?.id) {
        setTimeOptions([]);
        return;
      }

      setLoadingTimes(true);
      try {
        const options = await generateTimeOptions(
          editedBooking.date,
          editedBooking.room.id,
          editedBooking.id
        );
        setTimeOptions(options || []);
      } catch (error) {
        console.error('Error fetching time options:', error);
        setTimeOptions([]);
      } finally {
        setLoadingTimes(false);
      }
    };

    fetchTimeOptions();
  }, [editedBooking?.date, editedBooking?.room?.id, editedBooking?.id]);

  const handleSave = () => {
    onSave(editedBooking);
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };

  if (!editedBooking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-amber-800">
            {t.admin.editBooking}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-amber-800">{language === 'zh' ? '房間' : 'Room'}</Label>
            <select
              value={editedBooking.room.id}
              onChange={(e) => {
                const newRoom = roomsData.find(r => r.id === parseInt(e.target.value));
                setEditedBooking(prev => ({ ...prev, room: newRoom }));
              }}
              className="w-full p-2 border border-amber-200 rounded-md focus:border-amber-400 focus:outline-none bg-white"
            >
              {roomsData.map(room => (
                <option key={room.id} value={room.id}>
                  {t.rooms.roomNames[room.name]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-amber-800">{t.booking.date}</Label>
            <Input
              type="date"
              value={editedBooking.date || ''}
              onChange={(e) => setEditedBooking(prev => ({ ...prev, date: e.target.value, startTime: '', endTime: '' }))}
              className="border-amber-200 focus:border-amber-400"
              min={new Date().toISOString().split('T')[0]}
              max={getMaxDate()}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-amber-800">{t.booking.startTime}</Label>
              <select
                value={editedBooking.startTime || ''}
                onChange={(e) => setEditedBooking(prev => ({ ...prev, startTime: e.target.value, endTime: '' }))}
                className="w-full p-2 border border-amber-200 rounded-md focus:border-amber-400 focus:outline-none bg-white"
                disabled={loadingTimes || !editedBooking.date}
              >
                {loadingTimes ? (
                  <option>{language === 'zh' ? '載入中...' : 'Loading...'}</option>
                ) : !editedBooking.date ? (
                  <option>{language === 'zh' ? '請先選擇日期' : 'Please select date first'}</option>
                ) : timeOptions.length === 0 ? (
                  <option>{language === 'zh' ? '無可用時段' : 'No available slots'}</option>
                ) : (
                  <>
                    <option value="">{language === 'zh' ? '選擇開始時間' : 'Select start time'}</option>
                    {timeOptions.filter(time => parseInt(time.split(':')[0]) < 22).map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </>
                )}
              </select>
            </div>
            <div>
              <Label className="text-amber-800">{t.booking.endTime}</Label>
              <select
                value={editedBooking.endTime || ''}
                onChange={(e) => setEditedBooking(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full p-2 border border-amber-200 rounded-md focus:border-amber-400 focus:outline-none bg-white"
                disabled={loadingTimes || !editedBooking.startTime}
              >
                {loadingTimes ? (
                  <option>{language === 'zh' ? '載入中...' : 'Loading...'}</option>
                ) : !editedBooking.startTime ? (
                  <option>{language === 'zh' ? '請先選擇開始時間' : 'Please select start time first'}</option>
                ) : timeOptions.length === 0 ? (
                  <option>{language === 'zh' ? '無可用時段' : 'No available slots'}</option>
                ) : (
                  <>
                    <option value="">{language === 'zh' ? '選擇結束時間' : 'Select end time'}</option>
                    {timeOptions.filter(time => time > (editedBooking.startTime || "00:00")).map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
          >
            {language === 'zh' ? '保存更改' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};