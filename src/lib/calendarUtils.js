/**
 * Calendar Utilities
 * Generate Google Calendar URLs for booking events
 * Opens Google Calendar directly in browser with pre-filled event details
 */

/**
 * Generate Google Calendar URL for a booking
 * @param {Object} booking - Booking object with all details
 * @param {string} language - Language code ('zh' or 'en')
 * @param {Object} translations - Translation object
 * @returns {string} Google Calendar add event URL
 */
export const generateGoogleCalendarUrl = (booking, language, translations) => {
  const t = translations;

  // Parse date and time
  const bookingDate = booking.date; // YYYY-MM-DD
  const startTime = booking.startTime; // HH:MM
  const endTime = booking.endTime; // HH:MM

  // Parse date - handle both YYYY-MM-DD and MM/DD/YYYY formats
  let year, month, day;

  if (bookingDate.includes('-')) {
    // Format: YYYY-MM-DD
    [year, month, day] = bookingDate.split('-');
  } else if (bookingDate.includes('/')) {
    // Format: MM/DD/YYYY
    const parts = bookingDate.split('/');
    month = parts[0];
    day = parts[1];
    year = parts[2];
  } else {
    console.error('Unknown date format:', bookingDate);
    return '';
  }

  // Ensure 2-digit padding for month and day
  month = String(month).padStart(2, '0');
  day = String(day).padStart(2, '0');

  // Parse time
  const [startHour, startMinute] = startTime.split(':');
  const [endHour, endMinute] = endTime.split(':');

  // Format date/time for Google Calendar (YYYYMMDDTHHmmss)
  const startDateFormatted = `${year}${month}${day}T${startHour}${startMinute}00`;
  const endDateFormatted = `${year}${month}${day}T${endHour}${endMinute}00`;

  // Room name (translated)
  const roomName = booking.room?.name
    ? t.rooms.roomNames[booking.room.name]
    : (language === 'zh' ? '房間' : 'Room');

  // Event title (include user email for searchability)
  const userEmail = booking.userEmail || booking.email || '';
  const title = language === 'zh'
    ? `${roomName} 預約 - ${booking.purpose || '工作空間'} (${userEmail})`
    : `${roomName} Booking - ${booking.purpose || 'Workspace'} (${userEmail})`;

  // Event description with all booking details
  const descriptionLines = [];

  if (language === 'zh') {
    descriptionLines.push(`預約詳情`);
    descriptionLines.push(`━━━━━━━━━━━━━━━━━━`);
    descriptionLines.push(`📋 訂單編號：${booking.receiptNumber || 'N/A'}`);
    descriptionLines.push(`🏠 房間：${roomName}`);
    descriptionLines.push(`📅 日期：${booking.date}`);
    descriptionLines.push(`⏰ 時間：${startTime} - ${endTime}`);
    descriptionLines.push(`👥 人數：${booking.guests || 1} 位客人`);
    descriptionLines.push(`💼 業務性質：${booking.purpose || 'N/A'}`);

    if (booking.specialRequests) {
      descriptionLines.push(`📝 特殊要求：${booking.specialRequests}`);
    }

    descriptionLines.push(``);
    descriptionLines.push(`━━━━━━━━━━━━━━━━━━`);
    descriptionLines.push(`📧 電郵：ofcozfamily@gmail.com`);
    descriptionLines.push(`💬 WhatsApp：https://wa.me/85266283938`);
    descriptionLines.push(``);
    descriptionLines.push(`由 Ofcoz Family 提供 - https://ofcoz.family`);
  } else {
    descriptionLines.push(`Booking Details`);
    descriptionLines.push(`━━━━━━━━━━━━━━━━━━`);
    descriptionLines.push(`📋 Order Number: ${booking.receiptNumber || 'N/A'}`);
    descriptionLines.push(`🏠 Room: ${roomName}`);
    descriptionLines.push(`📅 Date: ${booking.date}`);
    descriptionLines.push(`⏰ Time: ${startTime} - ${endTime}`);
    descriptionLines.push(`👥 Guests: ${booking.guests || 1}`);
    descriptionLines.push(`💼 Purpose: ${booking.purpose || 'N/A'}`);

    if (booking.specialRequests) {
      descriptionLines.push(`📝 Special Requests: ${booking.specialRequests}`);
    }

    descriptionLines.push(``);
    descriptionLines.push(`━━━━━━━━━━━━━━━━━━`);
    descriptionLines.push(`📧 Email: ofcozfamily@gmail.com`);
    descriptionLines.push(`💬 WhatsApp: https://wa.me/85266283938`);
    descriptionLines.push(``);
    descriptionLines.push(`Powered by Ofcoz Family - https://ofcoz.family`);
  }

  const description = descriptionLines.join('\n');

  // Location
  const location = language === 'zh'
    ? '九龍長沙灣 Ofcoz Family'
    : 'Cheung Sha Wan, Kowloon - Ofcoz Family';

  // Build Google Calendar URL using the newer /r/eventedit endpoint
  const baseUrl = 'https://calendar.google.com/calendar/r/eventedit';

  const params = new URLSearchParams({
    text: title,
    dates: `${startDateFormatted}/${endDateFormatted}`,
    details: description,
    location: location,
    ctz: 'Asia/Hong_Kong'
  });

  return `${baseUrl}?${params.toString()}`;
};

/**
 * Open Google Calendar with pre-filled booking event
 * @param {Object} booking - Booking object
 * @param {string} language - Language code
 * @param {Object} translations - Translation object
 */
export const openGoogleCalendar = (booking, language, translations) => {
  const calendarUrl = generateGoogleCalendarUrl(booking, language, translations);

  // Debug: Log the URL to console
  console.log('=== Google Calendar Debug ===');
  console.log('Booking date:', booking.date);
  console.log('Start time:', booking.startTime);
  console.log('End time:', booking.endTime);
  console.log('Generated URL:', calendarUrl);
  console.log('============================');

  // Open in new window/tab
  window.open(calendarUrl, '_blank', 'noopener,noreferrer');
};
