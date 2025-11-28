// Supabase Edge Function to send booking status change notifications via Resend
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { sendEmail } from "./resend-client.ts"

interface StatusNotificationRequest {
  to: string
  bcc?: string  // Admin email for notifications
  language: 'en' | 'zh'
  type: 'receiptReceived' | 'paymentConfirmed'
  booking: {
    name: string
    receiptNumber: string
    room: {
      name: string
    }
    date: string
    startTime: string
    endTime: string
    confirmedAt?: string
  }
  roomNameTranslated: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
}

// Email templates for receipt received
const getReceiptReceivedSubject = (language: string) => {
  return language === 'zh'
    ? '收據已收到 - 待確認'
    : 'Payment Receipt Received - Pending Confirmation'
}

const getReceiptReceivedHtml = (language: string, booking: any, roomName: string) => {
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
    .status-badge { background: #fef3c7; color: #92400e; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 10px 0; }
    .details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #374151; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 收據已收到</h1>
    </div>
    <div class="content">
      <h2>您好 ${booking.name}，</h2>
      <p>我們已收到您的付款收據，預約編號 <strong>#${booking.receiptNumber}</strong>。</p>

      <h3>📊 狀態更新</h3>
      <p><strong>當前狀態：</strong> <span class="status-badge">⏳ 待確認</span></p>

      <h3>❓ 接下來會怎樣？</h3>
      <ul>
        <li>✅ 我們的團隊將在24小時內審核您的付款收據</li>
        <li>📧 一旦您的付款被批准，您將收到確認電郵</li>
        <li>💬 如有任何疑問，請聯繫我們</li>
      </ul>

      <div class="details">
        <h3>📋 預約詳情</h3>
        <div class="detail-row">
          <span class="detail-label">訂單編號：</span>
          <span>#${booking.receiptNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">房間：</span>
          <span>${roomName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">日期：</span>
          <span>${booking.date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">時間：</span>
          <span>${booking.startTime} - ${booking.endTime}</span>
        </div>
      </div>

      <p>感謝您的耐心等候，</p>
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
    .status-badge { background: #fef3c7; color: #92400e; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 10px 0; }
    .details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #374151; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Receipt Received</h1>
    </div>
    <div class="content">
      <h2>Hello ${booking.name},</h2>
      <p>We have received your payment receipt for booking <strong>#${booking.receiptNumber}</strong>.</p>

      <h3>📊 Status Update</h3>
      <p><strong>Current Status:</strong> <span class="status-badge">⏳ Pending Confirmation</span></p>

      <h3>❓ What happens next?</h3>
      <ul>
        <li>✅ Our team will review your payment receipt within 24 hours</li>
        <li>📧 You will receive a confirmation email once your payment is approved</li>
        <li>💬 If you have any questions, please contact us</li>
      </ul>

      <div class="details">
        <h3>📋 Booking Details</h3>
        <div class="detail-row">
          <span class="detail-label">Receipt Number:</span>
          <span>#${booking.receiptNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Room:</span>
          <span>${roomName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span>${booking.date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span>${booking.startTime} - ${booking.endTime}</span>
        </div>
      </div>

      <p>Thank you for your patience,</p>
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

// Email templates for payment confirmed
const getPaymentConfirmedSubject = (language: string) => {
  return language === 'zh'
    ? '預約已確認 - 付款已批准！'
    : 'Booking Confirmed - Payment Approved!'
}

const getPaymentConfirmedHtml = (language: string, booking: any, roomName: string) => {
  const confirmedDate = booking.confirmedAt ? new Date(booking.confirmedAt).toLocaleDateString(language === 'zh' ? 'zh-HK' : 'en-US') : ''

  if (language === 'zh') {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .status-badge { background: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 10px 0; }
    .details { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #374151; }
    .steps { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 預約已確認！</h1>
    </div>
    <div class="content">
      <h2>好消息，${booking.name}！</h2>
      <p>您的付款已獲批准，您的預約現已<strong>確認</strong>！</p>

      <h3>📊 狀態更新</h3>
      <p><strong>之前狀態：</strong> 待確認 ⏳</p>
      <p><strong>當前狀態：</strong> <span class="status-badge">✅ 已確認</span></p>
      <p><strong>確認日期：</strong> ${confirmedDate}</p>

      <div class="details">
        <h3>📋 預約詳情</h3>
        <div class="detail-row">
          <span class="detail-label">收據編號：</span>
          <span>#${booking.receiptNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">房間：</span>
          <span>${roomName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">日期：</span>
          <span>${booking.date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">時間：</span>
          <span>${booking.startTime} - ${booking.endTime}</span>
        </div>
      </div>

      <div class="steps">
        <h3>📍 接下來做什麼？</h3>
        <ul>
          <li>⏰ 請於預約時間前10分鐘到達</li>
          <li>📱 在前台出示此電郵或您的預約編號</li>
          <li>😊 享受您在 Ofcoz Family 的時光！</li>
        </ul>
      </div>

      <p>期待見到您，</p>
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
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .status-badge { background: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 10px 0; }
    .details { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #374151; }
    .steps { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Booking Confirmed!</h1>
    </div>
    <div class="content">
      <h2>Great news, ${booking.name}!</h2>
      <p>Your payment has been approved. Your booking is now <strong>confirmed</strong>!</p>

      <h3>📊 Status Update</h3>
      <p><strong>Previous Status:</strong> Pending Confirmation ⏳</p>
      <p><strong>Current Status:</strong> <span class="status-badge">✅ Confirmed</span></p>
      <p><strong>Confirmed on:</strong> ${confirmedDate}</p>

      <div class="details">
        <h3>📋 Booking Details</h3>
        <div class="detail-row">
          <span class="detail-label">Receipt Number:</span>
          <span>#${booking.receiptNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Room:</span>
          <span>${roomName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span>${booking.date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span>${booking.startTime} - ${booking.endTime}</span>
        </div>
      </div>

      <div class="steps">
        <h3>📍 What's next?</h3>
        <ul>
          <li>⏰ Please arrive 10 minutes before your booking time</li>
          <li>📱 Present this email or your booking reference at the front desk</li>
          <li>😊 Enjoy your time at Ofcoz Family!</li>
        </ul>
      </div>

      <p>We look forward to seeing you,</p>
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, bcc, language, type, booking, roomNameTranslated }: StatusNotificationRequest = await req.json()

    // Validate required fields
    if (!to || !language || !type || !booking) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let subject: string
    let html: string

    // Generate email content based on type
    if (type === 'receiptReceived') {
      subject = getReceiptReceivedSubject(language)
      html = getReceiptReceivedHtml(language, booking, roomNameTranslated)
    } else if (type === 'paymentConfirmed') {
      subject = getPaymentConfirmedSubject(language)
      html = getPaymentConfirmedHtml(language, booking, roomNameTranslated)
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid notification type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send email
    const result = await sendEmail({ to, subject, html, bcc })

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in send-status-notification:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
