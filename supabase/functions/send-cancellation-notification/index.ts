// Supabase Edge Function to send cancellation notification to admin via Resend
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { sendEmail } from "./resend-client.ts"

interface CancellationNotificationRequest {
  to: string  // Admin email
  language: 'en' | 'zh'
  booking: {
    name: string
    email: string
    receiptNumber: string
    room: {
      name: string
    }
    date: string
    startTime: string
    endTime: string
    cancelledAt: string
    cancellationReason: string
    cancelledBy: string  // "用戶自行取消" or "管理員代取消"
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
    ? `⚠️ 預約已取消 - 通知`
    : `⚠️ Booking Cancelled - Notification`
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
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .details { background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #dc2626; }
    .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚫 預約已取消！</h1>
    </div>
    <div class="content">
      <h2>管理員您好，</h2>
      <p>以下預約已被取消，請注意處理。</p>

      <div class="details">
        <h3>📋 已取消預約詳情</h3>
        <div class="detail-row">
          <span class="detail-label">訂單編號：</span>
          <span>#${booking.receiptNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">客戶姓名：</span>
          <span>${booking.name}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">客戶電郵：</span>
          <span>${booking.email}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">房間：</span>
          <span>${roomNameTranslated}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">預約日期：</span>
          <span>${booking.date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">預約時間：</span>
          <span>${booking.startTime} - ${booking.endTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">取消時間：</span>
          <span>${booking.cancelledAt}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">取消者：</span>
          <span><strong>${booking.cancelledBy}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">取消原因：</span>
          <span>${booking.cancellationReason}</span>
        </div>
      </div>

      <div class="warning-box">
        <h3>⚠️ 處理提示</h3>
        <ul>
          <li>請檢查是否需要聯繫客戶</li>
          <li>如有需要退款，請及時處理</li>
          <li>如使用代幣預約，代幣已自動退還</li>
          <li>請更新房間可用性</li>
        </ul>
      </div>

      <p>如有任何疑問，請登入管理系統查看詳情。</p>
      <p><strong>Ofcoz Family 系統</strong></p>
    </div>
    <div class="footer">
      <p>📧 電郵: ofcozfamily@gmail.com</p>
      <p>📱 電話: +852 66238788 (WhatsApp)</p>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
        此郵件由系統自動發送。
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
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .details { background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #dc2626; }
    .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚫 Booking Cancelled!</h1>
    </div>
    <div class="content">
      <h2>Hello Admin,</h2>
      <p>The following booking has been cancelled. Please take note and process accordingly.</p>

      <div class="details">
        <h3>📋 Cancelled Booking Details</h3>
        <div class="detail-row">
          <span class="detail-label">Order Number:</span>
          <span>#${booking.receiptNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Customer Name:</span>
          <span>${booking.name}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Customer Email:</span>
          <span>${booking.email}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Room:</span>
          <span>${roomNameTranslated}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Booking Date:</span>
          <span>${booking.date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Booking Time:</span>
          <span>${booking.startTime} - ${booking.endTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Cancelled At:</span>
          <span>${booking.cancelledAt}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Cancelled By:</span>
          <span><strong>${booking.cancelledBy}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Cancellation Reason:</span>
          <span>${booking.cancellationReason}</span>
        </div>
      </div>

      <div class="warning-box">
        <h3>⚠️ Action Required</h3>
        <ul>
          <li>Check if customer needs to be contacted</li>
          <li>Process refund if necessary</li>
          <li>If tokens were used, they have been automatically refunded</li>
          <li>Update room availability</li>
        </ul>
      </div>

      <p>If you have any questions, please log in to the admin system for more details.</p>
      <p><strong>Ofcoz Family System</strong></p>
    </div>
    <div class="footer">
      <p>📧 Email: ofcozfamily@gmail.com</p>
      <p>📱 Phone: +852 66238788 (WhatsApp)</p>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
        This email was sent automatically by the system.
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
    console.log('📧 Cancellation notification edge function called')

    // Parse request body
    const requestData: CancellationNotificationRequest = await req.json()
    console.log('📧 Request data:', {
      to: requestData.to,
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

    console.log('📧 Sending cancellation notification to admin:', requestData.to)

    // Send email via Resend
    const result = await sendEmail({
      to: requestData.to,
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

    console.log('✅ Cancellation notification sent successfully')
    return new Response(
      JSON.stringify({ success: true, message: 'Cancellation notification sent to admin' }),
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
