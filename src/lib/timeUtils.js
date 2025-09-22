export const generateTimeOptions = (date, roomId, bookingIdToExclude = null) => {
  if (!date) return [];
  const allBookings = JSON.parse(localStorage.getItem('ofcoz_bookings') || '[]');
  
  let relevantBookings = allBookings.filter(booking => {
    const isSameDate = booking.date === date;
    const isConfirmed = booking.status === 'confirmed';
    const isNotExcluded = booking.id !== bookingIdToExclude;

    if (!isSameDate || !isConfirmed || !isNotExcluded) return false;

    // Room B and C are linked and cannot be booked at the same time
    if (roomId === 1 || roomId === 2) {
      return booking.room.id === 1 || booking.room.id === 2;
    }
    
    // For other rooms, only check bookings for that specific room
    return booking.room.id === roomId;
  });

  const bookedSlots = relevantBookings.map(b => ({
      start: new Date(`${b.date}T${b.startTime}:00`),
      end: new Date(`${b.date}T${b.endTime}:00`),
  }));

  const options = [];
  for (let hour = 10; hour <= 22; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      const checkTime = new Date(`${date}T${time}:00`);

      let isBooked = false;
      for (const slot of bookedSlots) {
          if (checkTime >= slot.start && checkTime < slot.end) {
              isBooked = true;
              break;
          }
      }
      
      if (!isBooked) {
          options.push(time);
      }
  }
  return options;
};

export const checkDailySlotConflict = (roomId, date, slot) => {
    if (!date || !slot) return false;
    const allBookings = JSON.parse(localStorage.getItem('ofcoz_bookings') || '[]');
    const [slotStartStr, slotEndStr] = slot.split('-');
    const slotStartTime = new Date(`${date}T${slotStartStr}:00`);
    const slotEndTime = new Date(`${date}T${slotEndStr}:00`);

    const roomBookings = allBookings.filter(b => 
        b.date === date && 
        b.status === 'confirmed' &&
        (b.room.id === roomId || ((roomId === 1 || roomId === 2) && (b.room.id === 1 || b.room.id === 2)))
    );

    for (const booking of roomBookings) {
        const bookingStartTime = new Date(`${date}T${booking.startTime}:00`);
        const bookingEndTime = new Date(`${date}T${booking.endTime}:00`);
        // Check for any overlap
        if (slotStartTime < bookingEndTime && slotEndTime > bookingStartTime) {
            return true; 
        }
    }
    return false;
};