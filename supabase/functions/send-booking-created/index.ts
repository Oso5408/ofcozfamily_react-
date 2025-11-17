// Supabase Edge Function to send booking created notification via Resend
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { sendEmail } from "./resend-client.ts"

interface BookingCreatedRequest {
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
    paymentMethod: string
    totalCost: number
    specialRequests?: string
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
    ? `您的預約已建立 - 待付款確認`
    : `Your Booking Has Been Created - Pending Payment Confirmation`
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
    .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .details { background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #1e40af; }
    .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 預約已建立！</h1>
    </div>
    <div class="content">
      <h2>您好 ${booking.name}，</h2>
      <p>感謝您的預約！您的訂單已成功建立，現正等待付款確認。</p>

      <div class="details">
        <h3>📋 預約詳情</h3>
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
        <div class="detail-row">
          <span class="detail-label">付款方式：</span>
          <span>${booking.paymentMethod === 'cash' ? '現金' : booking.paymentMethod === 'token' ? '代幣' : booking.paymentMethod}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">總金額：</span>
          <span>$${booking.totalCost}</span>
        </div>
        ${booking.specialRequests ? `
        <div class="detail-row">
          <span class="detail-label">備註：</span>
          <span>${booking.specialRequests}</span>
        </div>
        ` : ''}
      </div>

      <div class="warning-box">
        <h3>⏰ 下一步</h3>
        <p><strong>如果您選擇現金付款：</strong></p>
        <ul>
          <li>請上傳付款收據至系統</li>
          <li>我們的工作人員將審核您的付款</li>
          <li>確認後您將收到確認郵件</li>
        </ul>
        <p><strong>如果您使用代幣付款：</strong></p>
        <ul>
          <li>代幣已自動扣除</li>
          <li>您的預約將很快被確認</li>
        </ul>
      </div>

      <h3>📜 條款及細則</h3>
      <p>有關完整的條款及細則，請參閱我們的網站。</p>

      <p>如有任何疑問，請隨時聯絡我們。</p>
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
    .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .details { background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #1e40af; }
    .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Booking Created!</h1>
    </div>
    <div class="content">
      <h2>Hello ${booking.name},</h2>
      <p>Thank you for your booking! Your order has been successfully created and is now pending payment confirmation.</p>

      <div class="details">
        <h3>📋 Booking Details</h3>
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
        <div class="detail-row">
          <span class="detail-label">Payment Method:</span>
          <span>${booking.paymentMethod === 'cash' ? 'Cash' : booking.paymentMethod === 'token' ? 'Token' : booking.paymentMethod}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Amount:</span>
          <span>$${booking.totalCost}</span>
        </div>
        ${booking.specialRequests ? `
        <div class="detail-row">
          <span class="detail-label">Notes:</span>
          <span>${booking.specialRequests}</span>
        </div>
        ` : ''}
      </div>

      <div class="warning-box">
        <h3>⏰ Next Steps</h3>
        <p><strong>If you chose cash payment:</strong></p>
        <ul>
          <li>Please upload your payment receipt to the system</li>
          <li>Our staff will review your payment</li>
          <li>You will receive a confirmation email after verification</li>
        </ul>
        <p><strong>If you used token payment:</strong></p>
        <ul>
          <li>Tokens have been automatically deducted</li>
          <li>Your booking will be confirmed shortly</li>
        </ul>
      </div>

      <h3>📜 Terms & Conditions</h3>
      <p>Please refer to our website for the full terms and conditions.</p>

      <p>If you have any questions, please feel free to contact us.</p>
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

async function sendEmailViaResend(to: string, subject: string, html: string, bcc?: string) {
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
    const { to, bcc, language, booking, roomNameTranslated }: BookingCreatedRequest = await req.json()

    // Validate required fields
    if (!to || !language || !booking) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate email content
    const subject = getEmailSubject(language)
    const html = getEmailHtml(language, booking, roomNameTranslated)

    // Send email (with BCC to admin if provided)
    const result = await sendEmailViaResend(to, subject, html, bcc)

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in send-booking-created:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
