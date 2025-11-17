# Password Reset Setup Guide (Using Resend)

## ✅ What's Done

The password reset flow now uses **Supabase's built-in password reset** with **Resend** as the email provider:

1. ✅ **ForgotPasswordPage** - Sends reset email via Supabase/Resend
2. ✅ **ResetPasswordPage** - Validates token and updates password
3. ✅ **No SMTP Edge Function needed** - Simpler and more reliable

## 🎨 Customize the Email Template (Optional)

You can customize the password reset email to match your branding:

### Step 1: Access Email Templates

1. Go to **Supabase Dashboard** (https://supabase.com/dashboard)
2. Select your project: `rlfrwsyqletwegvflqip`
3. Navigate to: **Authentication → Email Templates**
4. Find: **Reset Password** template

### Step 2: Customize the Template

Replace the default template with this bilingual HTML template:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .alert-box { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; border-radius: 0 0 10px 10px; font-size: 14px; }
    .warning { color: #dc2626; font-weight: bold; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 重設密碼 / Reset Password</h1>
    </div>
    <div class="content">
      <h2>您好 / Hello,</h2>
      <p>我們收到了重設您 Ofcoz Family 帳戶密碼的請求。</p>
      <p>We received a request to reset your Ofcoz Family account password.</p>

      <div class="alert-box">
        <p><strong>⚠️ 重要提示 / Important Notice:</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>此連結將在 <strong>1 小時</strong>後過期 / This link expires in <strong>1 hour</strong></li>
          <li>出於安全考慮，連結只能使用一次 / Link can only be used once for security</li>
          <li>如果您沒有請求重設密碼，請忽略此郵件 / If you didn't request this, ignore this email</li>
        </ul>
      </div>

      <p>點擊下方按鈕重設您的密碼 / Click the button below to reset your password:</p>

      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">重設密碼 / Reset Password</a>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        如果按鈕無法點擊，請複製以下連結到瀏覽器 / If the button doesn't work, copy this link:<br>
        <a href="{{ .ConfirmationURL }}" style="color: #f59e0b; word-break: break-all;">{{ .ConfirmationURL }}</a>
      </p>

      <div class="warning">
        <p>⚠️ 如果您沒有請求重設密碼，請立即聯繫我們 / If you didn't request this, contact us immediately</p>
      </div>

      <p style="margin-top: 30px;">
        此致 / Best regards,<br>
        <strong>Ofcoz Family 團隊 / Ofcoz Family Team</strong>
      </p>
    </div>
    <div class="footer">
      <p>📧 電郵 / Email: ofcozfamily@gmail.com</p>
      <p>📱 電話 / Phone: +852 66238788 (WhatsApp)</p>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
        此郵件由系統自動發送，請勿直接回覆。<br>
        This email was sent automatically. Please do not reply.
      </p>
    </div>
  </div>
</body>
</html>
```

### Step 3: Configure Template Variables

Supabase provides these variables you can use:
- `{{ .ConfirmationURL }}` - The password reset link (REQUIRED)
- `{{ .Token }}` - The reset token
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your site URL

### Step 4: Test the Email

1. Save the template
2. Go to your app: `http://localhost:5173/#/forgot-password`
3. Enter a test email address
4. Check the email inbox
5. Verify the email looks good and the link works

## 🔧 How It Works

### 1. User Requests Password Reset
```javascript
// ForgotPasswordPage.jsx
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/#/reset-password`
});
```

### 2. Supabase Sends Email via Resend
- Uses the custom template you configured
- Includes a secure, one-time-use token in the URL
- Token expires in 1 hour (configurable in Supabase settings)

### 3. User Clicks Link
- Link format: `https://yoursite.com/#/reset-password#access_token=...`
- Supabase automatically creates a temporary session
- ResetPasswordPage validates the session

### 4. User Sets New Password
```javascript
// ResetPasswordPage.jsx
await authService.updatePassword(newPassword);
```

### 5. User Logs In with New Password
- Old password no longer works
- User redirected to login page

## 🎯 Testing Checklist

- [ ] Request password reset for a test account
- [ ] Receive email within 1 minute
- [ ] Email has correct branding and bilingual content
- [ ] Click "Reset Password" button in email
- [ ] Redirects to reset password page
- [ ] Enter new password (min 8 characters)
- [ ] See success message
- [ ] Can login with new password
- [ ] Old password no longer works

## ⚙️ Configuration Options

### Change Token Expiry Time

1. Go to **Supabase Dashboard → Authentication → Settings**
2. Find: **Email Auth**
3. Set: **Password Recovery Expiry** (default: 3600 seconds = 1 hour)
4. Click **Save**

### Change Email Provider (Optional)

Currently using Resend (free tier). To use a different provider:

1. Go to **Supabase Dashboard → Project Settings → Auth**
2. Scroll to: **SMTP Settings**
3. Configure your SMTP server
4. Test and save

## 📊 Email Delivery Logs

Check if emails are being sent:

1. Go to **Supabase Dashboard → Logs → Auth Logs**
2. Filter by: `password_recovery`
3. Check for errors or successful sends

Or check Resend logs:
1. Login to Resend dashboard (https://resend.com)
2. Go to **Emails** tab
3. Search for recipient email

## 🔒 Security Best Practices

✅ **Already Implemented:**
- Tokens expire after 1 hour
- One-time use tokens (can't reuse)
- Vague success messages (don't reveal if email exists)
- Secure token generation by Supabase
- Auto-logout after password change

⚠️ **Additional Recommendations:**
- Enable rate limiting in Supabase (max 5 reset requests per hour per email)
- Log all password reset attempts for security monitoring
- Consider adding CAPTCHA for password reset requests

## 🐛 Troubleshooting

### Email Not Received

1. **Check Spam Folder**
2. **Check Resend Logs** (see above)
3. **Verify Email Address** - Must be valid and exist in database
4. **Check Rate Limiting** - Max 5 requests per hour
5. **Check SMTP Settings** - Go to Auth → Email Templates

### Reset Link Expired

- Links expire after 1 hour
- Request a new reset link
- Consider increasing expiry time in settings

### "Invalid Link" Error

- Link already used (one-time use)
- Link expired
- Request a new reset link

### Password Not Updating

- Check browser console for errors
- Ensure password meets requirements (min 8 characters)
- Check network tab for API errors
- Verify user has valid session from reset link

## 📝 Summary

**Current Setup:**
- ✅ Password reset via Supabase + Resend
- ✅ Secure token-based flow
- ✅ Bilingual support in UI
- ✅ Clean user experience
- ✅ No extra Edge Functions needed

**Next Steps (Optional):**
- Customize email template in Supabase Dashboard
- Test with real email addresses
- Monitor email delivery logs
- Adjust token expiry time if needed

🎉 **The password reset flow is now fully functional!**
