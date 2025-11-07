// Supabase Edge Function to send package assignment notifications via SMTP
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { sendEmail } from "../send-booking-confirmation/smtp-client.ts"

interface PackageNotificationRequest {
  to: string
  language: 'en' | 'zh'
  package: {
    name: string
    packageType: string
    amount: number
    newBalance: number
    reason: string
    expiryDate?: string | null
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
}

const getPackageSubject = (language: string) => {
  return language === 'zh'
    ? '套票已分配 - 您的帳戶已更新'
    : 'Package Assigned - Your Account Updated'
}

const getPackageHtml = (language: string, pkg: any) => {
  const expiryText = pkg.expiryDate
    ? new Date(pkg.expiryDate).toLocaleDateString(language === 'zh' ? 'zh-HK' : 'en-US')
    : (language === 'zh' ? '無限期' : 'No expiry')

  if (language === 'zh') {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .package-badge { background: #ede9fe; color: #5b21b6; padding: 10px 20px; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 18px; margin: 10px 0; }
    .details { background: #f5f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { margin: 12px 0; padding: 8px; border-left: 3px solid #8b5cf6; background: white; }
    .detail-label { font-weight: bold; color: #5b21b6; }
    .steps { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎁 套票已分配！</h1>
    </div>
    <div class="content">
      <h2>您好 ${pkg.name}，</h2>
      <p>好消息！套票已添加到您的帳戶。</p>

      <div style="text-align: center; margin: 20px 0;">
        <span class="package-badge">${pkg.packageType}</span>
      </div>

      <div class="details">
        <h3>📦 套票詳情</h3>
        <div class="detail-row">
          <span class="detail-label">套票類型：</span>
          <span>${pkg.packageType}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">增加數量：</span>
          <span style="color: #10b981; font-weight: bold;">+${pkg.amount} ${pkg.packageType.startsWith('DP') ? '次' : '小時'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">新餘額：</span>
          <span style="font-size: 18px; font-weight: bold; color: #8b5cf6;">${pkg.newBalance} ${pkg.packageType.startsWith('DP') ? '次' : '小時'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">有效期至：</span>
          <span>${expiryText}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">原因：</span>
          <span>${pkg.reason}</span>
        </div>
      </div>

      <div class="steps">
        <h3>💡 如何使用您的套票：</h3>
        <ol>
          <li>登入您的帳戶</li>
          <li>選擇房間和時段</li>
          <li>選擇使用套票餘額付款</li>
          <li>完成預約</li>
        </ol>
      </div>

      <p><strong>注意：</strong></p>
      <ul>
        <li>${pkg.packageType.startsWith('DP') ? 'DP20 套票自購買日起90天內有效。' : 'BR 套票沒有到期日。'}</li>
        <li>您可以隨時在儀表板中查看您的餘額。</li>
      </ul>

      <p>感謝您選擇 Ofcoz Family，</p>
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
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .package-badge { background: #ede9fe; color: #5b21b6; padding: 10px 20px; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 18px; margin: 10px 0; }
    .details { background: #f5f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { margin: 12px 0; padding: 8px; border-left: 3px solid #8b5cf6; background: white; }
    .detail-label { font-weight: bold; color: #5b21b6; }
    .steps { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎁 Package Assigned!</h1>
    </div>
    <div class="content">
      <h2>Hello ${pkg.name},</h2>
      <p>Good news! A package has been added to your account.</p>

      <div style="text-align: center; margin: 20px 0;">
        <span class="package-badge">${pkg.packageType}</span>
      </div>

      <div class="details">
        <h3>📦 Package Details</h3>
        <div class="detail-row">
          <span class="detail-label">Package Type:</span>
          <span>${pkg.packageType}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Amount Added:</span>
          <span style="color: #10b981; font-weight: bold;">+${pkg.amount} ${pkg.packageType.startsWith('DP') ? 'visits' : 'hours'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">New Balance:</span>
          <span style="font-size: 18px; font-weight: bold; color: #8b5cf6;">${pkg.newBalance} ${pkg.packageType.startsWith('DP') ? 'visits' : 'hours'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Valid Until:</span>
          <span>${expiryText}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Reason:</span>
          <span>${pkg.reason}</span>
        </div>
      </div>

      <div class="steps">
        <h3>💡 How to use your package:</h3>
        <ol>
          <li>Log in to your account</li>
          <li>Select a room and time slot</li>
          <li>Choose to pay with your package balance</li>
          <li>Complete your booking</li>
        </ol>
      </div>

      <p><strong>Note:</strong></p>
      <ul>
        <li>${pkg.packageType.startsWith('DP') ? 'DP20 packages are valid for 90 days from the date of purchase.' : 'BR packages do not expire.'}</li>
        <li>You can check your balance anytime in your dashboard.</li>
      </ul>

      <p>Thank you for choosing Ofcoz Family,</p>
      <p><strong>Ofcoz Family Team</strong></p>
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, language, package: pkg }: PackageNotificationRequest = await req.json()

    if (!to || !language || !pkg) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const subject = getPackageSubject(language)
    const html = getPackageHtml(language, pkg)
    const result = await sendEmail({ to, subject, html })

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in send-package-notification:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
