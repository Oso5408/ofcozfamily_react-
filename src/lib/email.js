import { translations } from '@/data/translations';

const generateReviewLink = (bookingId) => {
  // This should be the direct URL to the dashboard's review section
  // For now, it just goes to the dashboard
  return `${window.location.origin}/#/dashboard?tab=reviews&bookingId=${bookingId}`;
};

const generateBookingConfirmationHtml = (booking, t) => {
  const roomName = t.rooms.roomNames[booking.room.name];
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>${t.email.bookingConfirmed.title.replace('{name}', booking.name)}</h2>
      <p>${t.email.bookingConfirmed.intro.replace('{roomName}', roomName)}</p>
      <h3>${t.email.bookingConfirmed.details}</h3>
      <ul>
        <li><strong>${t.email.bookingConfirmed.bookingId}:</strong> #${booking.receiptNumber}</li>
        <li><strong>${t.email.bookingConfirmed.service}:</strong> ${roomName}</li>
        <li><strong>${t.email.bookingConfirmed.startDate}:</strong> ${booking.date} ${booking.startTime}</li>
        <li><strong>${t.email.bookingConfirmed.endDate}:</strong> ${booking.date} ${booking.endTime}</li>
        ${booking.specialRequests ? `<li><strong>${t.email.bookingConfirmed.notes}:</strong> ${booking.specialRequests}</li>` : ''}
      </ul>
      <h3>${t.email.bookingConfirmed.billingInfo}</h3>
      <p>${t.email.bookingConfirmed.billingText}</p>
      <h3>${t.email.bookingConfirmed.terms}</h3>
      <p>${t.email.bookingConfirmed.termsText}</p>
      <p>${t.email.bookingConfirmed.thanks}</p>
      <p>
        ${t.email.footer.email}: ofcozfamily@gmail.com<br>
        ${t.email.footer.phone}: +852 66238788 (WhatsApp)
      </p>
    </div>
  `;
};

const generateReviewRequestHtml = (booking, t) => {
  const reviewLink = generateReviewLink(booking.id);
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>${t.email.reviewRequest.title.replace('{name}', booking.name)}</h2>
      <p>${t.email.reviewRequest.intro.replace('{roomName}', t.rooms.roomNames[booking.room.name])}</p>
      <p>${t.email.reviewRequest.prompt}</p>
      <a href="${reviewLink}" style="display: inline-block; padding: 10px 20px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 5px;">${t.email.reviewRequest.cta}</a>
      <p>${t.email.reviewRequest.thanks}</p>
    </div>
  `;
};

const generateActivationHtml = (user, t) => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>${t.email.activation.title.replace('{name}', user.name)}</h2>
      <p>${t.email.activation.intro}</p>
      <p>${t.email.activation.details}</p>
      <p>${t.email.activation.thanks}</p>
      <p>
        ${t.email.footer.email}: ofcozfamily@gmail.com<br>
        ${t.email.footer.phone}: +852 66238788 (WhatsApp)
      </p>
    </div>
  `;
};

export const sendBookingConfirmationEmail = (booking, language) => {
  const t = translations[language];
  const htmlContent = generateBookingConfirmationHtml(booking, t);
  
  console.log("--- SIMULATING BOOKING CONFIRMATION EMAIL ---");
  console.log(`To: ${booking.email}`);
  console.log(`Subject: ${t.email.bookingConfirmed.subject.replace('{roomName}', t.rooms.roomNames[booking.room.name])}`);
  console.log("Body (HTML):", htmlContent);
  console.log("--- END OF SIMULATION ---");
};

export const sendReviewRequestEmail = (booking, language) => {
  const t = translations[language];
  const htmlContent = generateReviewRequestHtml(booking, t);
  
  console.log("--- SIMULATING REVIEW REQUEST EMAIL ---");
  console.log(`To: ${booking.email}`);
  console.log(`Subject: ${t.email.reviewRequest.subject}`);
  console.log("Body (HTML):", htmlContent);
  console.log("--- END OF SIMULATION ---");
};

export const sendActivationEmail = (user) => {
  // Activation email should ideally be in the user's selected language during registration
  // but for now, we'll default to Chinese as per site default.
  const t = translations['zh']; 
  const htmlContent = generateActivationHtml(user, t);

  console.log("--- SIMULATING ACTIVATION EMAIL ---");
  console.log(`To: ${user.email}`);
  console.log(`Subject: ${t.email.activation.subject}`);
  console.log("Body (HTML):", htmlContent);
  console.log("--- END OF SIMULATION ---");
};