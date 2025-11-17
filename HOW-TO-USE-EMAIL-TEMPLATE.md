# How to Use the Production Email Template

## File Location

The production-ready email template is in:
```
PRODUCTION-EMAIL-TEMPLATE.html
```

## Step-by-Step: Add to Supabase

### Step 1: Open the Template File

1. Open `PRODUCTION-EMAIL-TEMPLATE.html` in your text editor
2. Select ALL content (Cmd+A / Ctrl+A)
3. Copy to clipboard (Cmd+C / Ctrl+C)

### Step 2: Access Supabase Email Templates

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Email Templates**
4. Click on **"Reset Password"** template

### Step 3: Paste the Template

1. **DELETE** all existing content in the template editor
2. **PASTE** the new template from clipboard
3. Click **Save** button

### Step 4: Configure Production URLs

Before the template will work, you MUST configure:

1. Go to **Authentication** → **URL Configuration**

2. Set **Site URL** to your production domain:
   ```
   https://ofcozfamily.com
   ```
   (Replace with your actual domain)

3. Add **Redirect URLs** (both development and production):
   ```
   http://localhost:5173/#/reset-password
   https://ofcozfamily.com/#/reset-password
   ```

4. Click **Save**

### Step 5: Test the Email

1. Go to your app: `https://ofcozfamily.com/#/forgot-password`
2. Enter a test email address
3. Click "Send Reset Link"
4. Check the inbox for the styled email
5. Verify the reset button links to production URL

## Template Features

✅ **Bilingual** (English / Chinese)
✅ **Branded** with Ofcoz Family colors (amber/orange gradient)
✅ **Mobile responsive** (works on all devices)
✅ **Security notices** (warns if not user's request)
✅ **Expiry warning** (24-hour validity period)
✅ **Fallback link** (for email clients that block buttons)
✅ **Professional styling** (gradient header, rounded corners, shadows)

## What the Email Looks Like

### Header Section:
- Gradient background (amber to orange)
- 🐱 Ofcoz Family logo/title
- "Cat Cafe & Community Space" tagline

### Body Section:
- Bilingual greeting
- Clear instructions in both languages
- Large "重設密碼 / Reset Password" button
- Yellow info box with expiry warning
- Red security notice box
- Fallback text link

### Footer Section:
- Brand name
- Copyright notice
- "Do not reply" message

## Customization Options

### Change Brand Colors

Find this section in the template:
```css
.email-header {
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
}
.reset-button {
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
}
```

Replace `#f59e0b` and `#f97316` with your brand colors.

### Change Logo/Emoji

Find this in the template:
```html
<h1>🐱 Ofcoz Family</h1>
```

Replace 🐱 with your logo image:
```html
<img src="https://yourdomain.com/logo.png" alt="Ofcoz Family" style="height: 40px;">
```

### Change Footer Text

Find this section:
```html
<div class="email-footer">
  <p><strong class="brand-name">Ofcoz Family</strong></p>
  <p>Cat Cafe & Community Space</p>
</div>
```

Update with your business name and tagline.

### Add Contact Information

Add after the security notice:
```html
<p class="text-muted">
  📧 Email: support@ofcozfamily.com<br>
  📱 WhatsApp: +852 1234 5678
</p>
```

## Important Template Variables

These variables are **automatically replaced** by Supabase:

| Variable | What it becomes |
|----------|----------------|
| `{{ .ConfirmationURL }}` | Full password reset URL with token |
| `{{ .Email }}` | User's email address (not used in this template) |
| `{{ .SiteURL }}` | Your configured site URL (not used in this template) |

**DO NOT** remove or modify `{{ .ConfirmationURL }}` - it's critical!

## Testing Checklist

After adding the template:

- [ ] Template saved successfully in Supabase
- [ ] Site URL configured to production domain
- [ ] Redirect URLs added (both dev and prod)
- [ ] Test email sent from forgot password page
- [ ] Email received in inbox (check spam too)
- [ ] Email renders correctly (no broken styling)
- [ ] Button links to production reset page
- [ ] Fallback link also works
- [ ] Reset password flow completes successfully

## Troubleshooting

### Email looks broken (no styling)

**Cause**: Some email clients block external CSS

**Fix**: The template uses inline styles which work in most clients. If still broken, the content is still readable.

### {{ .ConfirmationURL }} appears as text

**Cause**: Supabase not processing template

**Fix**: 
1. Check template is saved correctly
2. Try resetting to default and re-pasting
3. Ensure you're in the "Reset Password" template (not Invite or Confirmation)

### Button link goes to localhost

**Cause**: Site URL still set to localhost

**Fix**: Update Site URL in Supabase → Authentication → URL Configuration

### Email not delivered

**Cause**: Supabase email limits or configuration issue

**Fix**:
1. Check Supabase email logs: Dashboard → Logs
2. For production, consider custom SMTP (Gmail, SendGrid, etc.)
3. Verify email address is valid
4. Check spam folder

## Preview the Email

Want to see how it looks before deploying?

1. Open `PRODUCTION-EMAIL-TEMPLATE.html` in a web browser
2. You'll see the full styled email
3. The `{{ .ConfirmationURL }}` will show as plain text (Supabase replaces it)

## Production Deployment

When deploying to production:

1. ✅ Add template to Supabase (steps above)
2. ✅ Configure production Site URL
3. ✅ Add production Redirect URL
4. ✅ Test complete password reset flow
5. ✅ Verify email delivery
6. ✅ Check mobile rendering

---

**File Location:** `PRODUCTION-EMAIL-TEMPLATE.html`
**Last Updated:** 2025-01-17

For any issues, check the troubleshooting section or contact support.
