// Supabase Edge Function to send cancellation confirmation to user via Resend
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { sendEmail } from "./resend-client.ts"

interface CancellationEmailRequest {
  to: string  // User email
  bcc?: string  // Admin email (optional BCC)
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
    cancelledAt: string
    cancellationReason: string
    paymentMethod: string
    totalCost: number
  }
  roomNameTranslated: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
}

// Email templates
const getEmailSubject = (language: string) => {
  return language === 'zh'
    ? `預約已取消確認 - Ofcoz Family`
    : `Booking Cancellation Confirmation - Ofcoz Family`
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
    .details { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #d97706; }
    .info-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 預約取消確認</h1>
    </div>
    <div class="content">
      <h2>親愛的 ${booking.name}，</h2>
      <p>您的預約已成功取消。感謝您的通知！</p>

      <div class="details">
        <h3>📋 已取消預約詳情</h3>
        <div class="detail-row">
          <span class="detail-label">訂單編號：</span>
          <span>#${booking.receiptNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">房間：</span>
          <span>${roomNameTranslated}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">原預約日期：</span>
          <span>${booking.date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">原預約時間：</span>
          <span>${booking.startTime} - ${booking.endTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">取消時間：</span>
          <span>${booking.cancelledAt}</span>
        </div>
        ${booking.cancellationReason ? `
        <div class="detail-row">
          <span class="detail-label">取消原因：</span>
          <span>${booking.cancellationReason}</span>
        </div>
        ` : ''}
      </div>

      <p>我們很遺憾此次無法為您服務。如果您希望重新預約，歡迎隨時訪問我們的網站。</p>
      <p>感謝您選擇 Ofcoz Family！</p>
      <p><strong>Ofcoz Family 團隊</strong></p>
    </div>
    <div class="footer">
      <p>📧 電郵: ofcozfamily@gmail.com</p>
      <p>📱 電話: +852 66238788 (WhatsApp)</p>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
        此郵件由系統自動發送，請勿直接回覆。
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
    .details { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #d97706; }
    .info-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Booking Cancellation Confirmation</h1>
    </div>
    <div class="content">
      <h2>Dear ${booking.name},</h2>
      <p>Your booking has been successfully cancelled. Thank you for notifying us!</p>

      <div class="details">
        <h3>📋 Cancelled Booking Details</h3>
        <div class="detail-row">
          <span class="detail-label">Order Number:</span>
          <span>#${booking.receiptNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Room:</span>
          <span>${roomNameTranslated}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Original Booking Date:</span>
          <span>${booking.date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Original Booking Time:</span>
          <span>${booking.startTime} - ${booking.endTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Cancelled At:</span>
          <span>${booking.cancelledAt}</span>
        </div>
        ${booking.cancellationReason ? `
        <div class="detail-row">
          <span class="detail-label">Cancellation Reason:</span>
          <span>${booking.cancellationReason}</span>
        </div>
        ` : ''}
      </div>

      <p>We're sorry we couldn't serve you this time. If you'd like to book again, please visit our website anytime.</p>
      <p>Thank you for choosing Ofcoz Family!</p>
      <p><strong>The Ofcoz Family Team</strong></p>
    </div>
    <div class="footer">
      <p>📧 Email: ofcozfamily@gmail.com</p>
      <p>📱 Phone: +852 66238788 (WhatsApp)</p>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
        This email was sent automatically. Please do not reply directly.
      </p>
    </div>
  </div>
</body>
</html>
    `
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📧 Cancellation email edge function called')

    // Parse request body
    const requestData: CancellationEmailRequest = await req.json()
    console.log('📧 Request data:', {
      to: requestData.to,
      bcc: requestData.bcc,
      language: requestData.language,
      receiptNumber: requestData.booking.receiptNumber,
    })

    // Validate required fields
    if (!requestData.to || !requestData.booking) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: to, booking' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Generate email content
    const emailSubject = getEmailSubject(requestData.language)
    const emailHtml = getEmailHtml(requestData.language, requestData.booking, requestData.roomNameTranslated)

    console.log('📧 Sending cancellation confirmation to user:', requestData.to)

    // Send email via Resend (with optional BCC to admin)
    const result = await sendEmail({
      to: requestData.to,
      bcc: requestData.bcc,
      subject: emailSubject,
      html: emailHtml,
    })

    if (!result.success) {
      console.error('❌ Failed to send email:', result.error)
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('✅ Cancellation email sent successfully to user')
    return new Response(
      JSON.stringify({ success: true, message: 'Cancellation confirmation sent to user' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('❌ Error in edge function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
