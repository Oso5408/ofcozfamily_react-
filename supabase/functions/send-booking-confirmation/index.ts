// Supabase Edge Function to send booking confirmation emails via Resend
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { sendEmail } from "./resend-client.ts"

interface BookingConfirmationRequest {
  to: string
  bcc?: string  // Admin email for notifications
  language: 'en' | 'zh'
  booking: {
    name: string
    receiptNumber: string
    room: {
      name: string
    }
    date: string
    startTime: string
    endTime: string
    specialRequests?: string
  }
  roomNameTranslated: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
}

// Email templates
const getEmailSubject = (language: string, roomName: string) => {
  return language === 'zh'
    ? `您的 Ofcoz Family 預約已確認！ - ${roomName}`
    : `Your Ofcoz Family Booking is Confirmed! - ${roomName}`
}

const getEmailHtml = (language: string, booking: any, roomNameTranslated: string) => {
  if (language === 'zh') {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .details { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #92400e; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 預約已確認！</h1>
    </div>
    <div class="content">
      <h2>您好 ${booking.name}，</h2>
      <p>恭喜您，您已成功預訂工作室套票 - <strong>${roomNameTranslated}</strong>！請於服務當日出示此電郵登記即可。</p>

      <div class="details">
        <h3>📋 確認指引</h3>
        <div class="detail-row">
          <span class="detail-label">訂單編號：</span>
          <span>#${booking.receiptNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">房間：</span>
          <span>${roomNameTranslated}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">日期：</span>
          <span>${booking.date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">時間：</span>
          <span>${booking.startTime} - ${booking.endTime}</span>
        </div>
        ${booking.specialRequests ? `
        <div class="detail-row">
          <span class="detail-label">備註：</span>
          <span>${booking.specialRequests}</span>
        </div>
        ` : ''}
      </div>

      <h3>💰 賬單資料</h3>
      <p>有關付款信息，請參閱預訂詳情。</p>

      <h3>📜 條款及細則</h3>
      <p>有關完整的條款及細則，請參閱我們的網站。</p>

      <p>感謝閣下使用我們的服務，</p>
      <p><strong>Ofcoz Family 團隊</strong></p>
    </div>
    <div class="footer">
      <p>📧 電郵: ofcozfamily@gmail.com</p>
      <p>📱 電話: +852 66238788 (WhatsApp)</p>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
        此郵件由系統自動發送，請勿直接回覆。如有任何問題，請聯繫我們的客服。
      </p>
    </div>
  </div>
</body>
</html>
    `
  } else {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .details { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #92400e; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Booking Confirmed!</h1>
    </div>
    <div class="content">
      <h2>Hello ${booking.name},</h2>
      <p>Congratulations, you have successfully booked the workspace ticket - <strong>${roomNameTranslated}</strong>! Please present this email for registration on the day of service.</p>

      <div class="details">
        <h3>📋 Confirmation Guidelines</h3>
        <div class="detail-row">
          <span class="detail-label">Order Number:</span>
          <span>#${booking.receiptNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Room:</span>
          <span>${roomNameTranslated}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span>${booking.date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span>${booking.startTime} - ${booking.endTime}</span>
        </div>
        ${booking.specialRequests ? `
        <div class="detail-row">
          <span class="detail-label">Notes:</span>
          <span>${booking.specialRequests}</span>
        </div>
        ` : ''}
      </div>

      <h3>💰 Billing Information</h3>
      <p>Please refer to the booking details for payment information.</p>

      <h3>📜 Terms & Conditions</h3>
      <p>Please refer to our website for the full terms and conditions.</p>

      <p>Thank you for using our services,</p>
      <p><strong>Ofcoz Family Team</strong></p>
    </div>
    <div class="footer">
      <p>📧 Email: ofcozfamily@gmail.com</p>
      <p>📱 Phone: +852 66238788 (WhatsApp)</p>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
        This email was sent automatically. Please do not reply directly. If you have any questions, please contact our customer service.
      </p>
    </div>
  </div>
</body>
</html>
    `
  }
}

async function sendEmailViaSMTP(to: string, subject: string, html: string, bcc?: string) {
  return await sendEmail({
    to,
    subject,
    html,
    bcc,
  })
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, bcc, language, booking, roomNameTranslated }: BookingConfirmationRequest = await req.json()

    // Validate required fields
    if (!to || !language || !booking) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate email content
    const subject = getEmailSubject(language, roomNameTranslated)
    const html = getEmailHtml(language, booking, roomNameTranslated)

    // Send email (with BCC to admin if provided)
    const result = await sendEmailViaSMTP(to, subject, html, bcc)

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in send-booking-confirmation:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
