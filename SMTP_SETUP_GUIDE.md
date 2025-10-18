# SMTP Server Setup Guide for Supabase Email

Complete guide to configure custom SMTP for production-ready email delivery.

## Why Use Custom SMTP?

**Supabase Built-in Email Limitations:**
- ❌ Only 3 emails per hour (free tier)
- ❌ Uses Supabase sender address
- ❌ May land in spam
- ❌ No customization

**Custom SMTP Benefits:**
- ✅ Unlimited emails (based on your provider)
- ✅ Use your own domain
- ✅ Better deliverability
- ✅ Professional appearance
- ✅ Email tracking and analytics

---

## Option 1: Gmail SMTP (Easiest - Free)

### Best For:
- Small projects
- Development/Testing
- Personal projects
- Up to 500 emails/day

### Setup Steps:

#### 1. Enable 2-Step Verification
1. Go to https://myaccount.google.com/security
2. Click **2-Step Verification**
3. Follow setup process

#### 2. Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select **Mail** and **Other (Custom name)**
3. Name it: "Supabase Email"
4. Click **Generate**
5. **Copy the 16-character password** (save it!)

#### 3. Configure in Supabase
1. Go to Supabase Dashboard
2. Navigate to **Settings** → **Auth** → **SMTP Settings**
3. Enable **Enable Custom SMTP**
4. Enter settings:

```
Host: smtp.gmail.com
Port: 587
Username: your-email@gmail.com
Password: [paste the 16-character app password]
Sender email: your-email@gmail.com
Sender name: Ofcoz Family
```

5. Click **Save**

#### 4. Test
1. Go to **Authentication** → **Users**
2. Click **Invite user**
3. Enter test email
4. Check inbox (should arrive instantly)

**Limits:**
- 500 emails/day
- 100 recipients per email

---

## Option 2: SendGrid (Recommended - Free Tier Available)

### Best For:
- Production apps
- Better deliverability
- Email analytics
- Up to 100 emails/day (free), scalable to millions

### Setup Steps:

#### 1. Create SendGrid Account
1. Go to https://signup.sendgrid.com/
2. Sign up (free tier available)
3. Verify your email
4. Complete setup wizard

#### 2. Verify Sender Email/Domain
**Option A: Single Sender Verification (Quick)**
1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Enter your email (e.g., `noreply@yourdomain.com`)
4. Check email and click verification link

**Option B: Domain Authentication (Professional)**
1. Go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Copy DNS records
5. Add DNS records to your domain provider
6. Wait for verification (10-30 minutes)

#### 3. Create API Key
1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name: "Supabase SMTP"
4. Select **Restricted Access**
5. Enable only: **Mail Send** → **Mail Send**
6. Click **Create & View**
7. **Copy the API key** (you can't see it again!)

#### 4. Configure in Supabase
1. Go to Supabase Dashboard
2. Navigate to **Settings** → **Auth** → **SMTP Settings**
3. Enable **Enable Custom SMTP**
4. Enter settings:

```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: [paste your SendGrid API key]
Sender email: noreply@yourdomain.com (or verified email)
Sender name: Ofcoz Family
```

5. Click **Save**

#### 5. Test
1. Send test email from Supabase
2. Check SendGrid dashboard → **Activity** to see delivery

**Free Tier Limits:**
- 100 emails/day forever free
- Analytics included
- Email validation

**Paid Plans:**
- Essentials: $19.95/mo (50,000 emails)
- Pro: $89.95/mo (100,000 emails)

---

## Option 3: AWS SES (Most Scalable - Cheapest)

### Best For:
- Large-scale apps
- Lowest cost ($0.10 per 1,000 emails)
- AWS ecosystem integration

### Setup Steps:

#### 1. Create AWS Account
1. Go to https://aws.amazon.com/
2. Sign up (requires credit card)
3. Complete verification

#### 2. Set Up SES
1. Go to AWS Console → **Amazon SES**
2. Select region (e.g., `us-east-1`)
3. Click **Get Started**

#### 3. Verify Email/Domain
**Option A: Verify Email**
1. Go to **Verified identities** → **Create identity**
2. Select **Email address**
3. Enter email
4. Check inbox and click verification link

**Option B: Verify Domain**
1. Go to **Verified identities** → **Create identity**
2. Select **Domain**
3. Enter domain
4. Copy DNS records (DKIM, MAIL FROM)
5. Add to your domain provider
6. Wait for verification

#### 4. Request Production Access
**Important:** SES starts in sandbox mode (limited)

1. Go to **Account dashboard**
2. Click **Request production access**
3. Fill out form:
   - Mail type: Transactional
   - Website URL: Your app URL
   - Use case: User authentication emails
4. Submit (approval takes 1-2 days)

#### 5. Create SMTP Credentials
1. Go to **Account dashboard** → **SMTP settings**
2. Click **Create SMTP credentials**
3. Enter IAM user name: "supabase-smtp"
4. Click **Create**
5. **Download credentials** (username and password)

#### 6. Configure in Supabase
1. Go to Supabase Dashboard
2. Navigate to **Settings** → **Auth** → **SMTP Settings**
3. Enable **Enable Custom SMTP**
4. Enter settings:

```
Host: email-smtp.us-east-1.amazonaws.com (your region)
Port: 587
Username: [SMTP username from AWS]
Password: [SMTP password from AWS]
Sender email: noreply@yourdomain.com
Sender name: Ofcoz Family
```

5. Click **Save**

**Pricing:**
- $0.10 per 1,000 emails
- First 62,000 emails/month free (if sent from EC2)

---

## Option 4: Resend (Modern - Developer-Friendly)

### Best For:
- Modern apps
- Great DX (Developer Experience)
- React email templates
- 3,000 emails/month free

### Setup Steps:

#### 1. Create Resend Account
1. Go to https://resend.com/
2. Sign up (GitHub/Google login)
3. Verify email

#### 2. Add Domain
1. Go to **Domains** → **Add Domain**
2. Enter your domain
3. Add DNS records:
   - SPF record
   - DKIM records
4. Verify

#### 3. Create API Key
1. Go to **API Keys**
2. Click **Create API Key**
3. Name: "Supabase SMTP"
4. Copy key

#### 4. Get SMTP Credentials
1. Go to **SMTP** tab
2. View SMTP settings:
   - Host: `smtp.resend.com`
   - Port: `587`
   - Username: `resend`
   - Password: [your API key]

#### 5. Configure in Supabase
```
Host: smtp.resend.com
Port: 587
Username: resend
Password: [your API key]
Sender email: noreply@yourdomain.com
Sender name: Ofcoz Family
```

**Free Tier:**
- 3,000 emails/month
- 100 emails/day
- All features included

---

## Option 5: Mailgun (High Deliverability)

### Best For:
- High-volume apps
- Email validation
- Advanced analytics

### Setup Steps:

#### 1. Create Mailgun Account
1. Go to https://signup.mailgun.com/
2. Sign up
3. Verify email and phone

#### 2. Add Domain
1. Go to **Sending** → **Domains** → **Add New Domain**
2. Enter subdomain: `mg.yourdomain.com`
3. Add DNS records (SPF, DKIM, MX, CNAME)
4. Verify

#### 3. Get SMTP Credentials
1. Go to **Sending** → **Domain Settings**
2. Click **SMTP credentials**
3. Note:
   - Host: `smtp.mailgun.org`
   - Port: `587`
   - Username: `postmaster@mg.yourdomain.com`
   - Password: (your password)

#### 4. Configure in Supabase
```
Host: smtp.mailgun.org
Port: 587
Username: postmaster@mg.yourdomain.com
Password: [your password]
Sender email: noreply@mg.yourdomain.com
Sender name: Ofcoz Family
```

**Pricing:**
- Free: 5,000 emails for 3 months
- Foundation: $35/mo (50,000 emails)

---

## Recommended Setup by Use Case

### Personal/Small Project
**Use:** Gmail SMTP
- ✅ Free
- ✅ Easy setup
- ✅ Reliable
- ⚠️ 500 emails/day limit

### Startup/Growing App
**Use:** SendGrid or Resend
- ✅ Good free tier
- ✅ Easy scaling
- ✅ Analytics
- ✅ Good deliverability

### Large-Scale Production
**Use:** AWS SES
- ✅ Cheapest at scale
- ✅ Unlimited (with limits increase)
- ✅ AWS integration
- ⚠️ Complex setup

### Developer-Focused
**Use:** Resend
- ✅ Modern API
- ✅ React templates
- ✅ Great DX
- ✅ Generous free tier

---

## Testing Your SMTP Setup

### 1. Send Test Email via Supabase
```
Supabase Dashboard
→ Authentication
→ Users
→ Invite user
→ Enter test email
→ Check inbox
```

### 2. Register Test User
```
1. Go to your app registration page
2. Register with real email
3. Check inbox for confirmation email
4. Click link to verify
```

### 3. Check Logs
**Supabase:**
- Dashboard → Logs → Auth Logs
- Look for email events

**SendGrid:**
- Dashboard → Activity
- See delivery status

**AWS SES:**
- Console → Email sending → Configuration sets
- Create config set for tracking

---

## Troubleshooting

### Problem: Emails Going to Spam

**Solutions:**
1. **Verify domain with SPF/DKIM**
   - Add all DNS records from provider
   - Wait 24-48 hours for propagation

2. **Use professional sender address**
   - ❌ `youremail@gmail.com`
   - ✅ `noreply@yourdomain.com`

3. **Warm up domain**
   - Start with low volume
   - Gradually increase
   - Maintain good reputation

4. **Test spam score**
   - Use https://www.mail-tester.com/
   - Send email to test address
   - Get score and recommendations

### Problem: SMTP Connection Failed

**Solutions:**
1. **Check credentials**
   - Username/password correct
   - No extra spaces

2. **Verify port**
   - Try 587 (TLS)
   - Or 465 (SSL)
   - Don't use 25 (blocked by many hosts)

3. **Check firewall**
   - Supabase IP might be blocked
   - Whitelist in email provider

4. **Test with telnet**
   ```bash
   telnet smtp.gmail.com 587
   ```

### Problem: Rate Limits Hit

**Solutions:**
1. **Check provider limits**
   - Gmail: 500/day
   - SendGrid free: 100/day

2. **Upgrade plan**
   - SendGrid paid: 50,000+
   - AWS SES: virtually unlimited

3. **Implement queuing**
   - Don't send all at once
   - Space out emails

### Problem: Authentication Failed

**Gmail:**
- Use App Password, not regular password
- Enable 2FA first
- Allow less secure apps (not recommended)

**SendGrid:**
- Username must be `apikey` (literal)
- Password is the API key

**AWS SES:**
- Use SMTP credentials, not console password
- Check region matches

---

## Best Practices

### 1. Security
- ✅ Never commit SMTP credentials to git
- ✅ Use environment variables
- ✅ Rotate passwords regularly
- ✅ Use restricted API keys

### 2. Deliverability
- ✅ Verify domain with SPF/DKIM/DMARC
- ✅ Use consistent sender address
- ✅ Include unsubscribe link
- ✅ Monitor bounce rates

### 3. Content
- ✅ Clear subject lines
- ✅ Plain text + HTML versions
- ✅ Mobile-responsive templates
- ✅ Include company address

### 4. Monitoring
- ✅ Track delivery rates
- ✅ Monitor bounce rates
- ✅ Check spam complaints
- ✅ Set up alerts

---

## Supabase Email Template Customization

After SMTP setup, customize templates:

### 1. Go to Email Templates
```
Supabase Dashboard
→ Authentication
→ Email Templates
```

### 2. Customize "Confirm Signup"
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .button {
      background: #f59e0b;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
    }
  </style>
</head>
<body>
  <h2>Welcome to Ofcoz Family! 🐱</h2>

  <p>Thanks for signing up! Please confirm your email address to get started.</p>

  <p>
    <a href="{{ .ConfirmationURL }}" class="button">
      Confirm Email Address
    </a>
  </p>

  <p>Or copy this link: {{ .ConfirmationURL }}</p>

  <p style="color: #666; font-size: 12px;">
    If you didn't create this account, you can safely ignore this email.
  </p>

  <hr>
  <p style="color: #999; font-size: 11px;">
    Ofcoz Family - Cat Cafe Booking<br>
    This is an automated email, please do not reply.
  </p>
</body>
</html>
```

### 3. Available Variables
- `{{ .ConfirmationURL }}` - Email confirmation link
- `{{ .Token }}` - Confirmation token
- `{{ .TokenHash }}` - Hashed token
- `{{ .Email }}` - User's email
- `{{ .SiteURL }}` - Your site URL
- `{{ .RedirectTo }}` - Redirect URL after confirmation

---

## Production Checklist

Before going live:

- [ ] SMTP provider configured
- [ ] Domain verified with DNS records
- [ ] Email templates customized
- [ ] Test emails sent successfully
- [ ] Spam score checked (>7/10)
- [ ] Bounce handling configured
- [ ] Rate limits understood
- [ ] Monitoring/alerts set up
- [ ] Unsubscribe mechanism (if needed)
- [ ] Privacy policy updated
- [ ] GDPR compliance checked (EU users)

---

## Quick Comparison Table

| Provider | Free Tier | Best For | Setup Time | Deliverability |
|----------|-----------|----------|------------|----------------|
| Gmail | 500/day | Testing | 5 min | Good |
| SendGrid | 100/day | Startups | 15 min | Excellent |
| AWS SES | Pay-as-go | Scale | 30 min | Excellent |
| Resend | 3,000/mo | Developers | 10 min | Excellent |
| Mailgun | 5k/3mo | High-volume | 20 min | Excellent |

---

## My Recommendation for Ofcoz Family

**Phase 1: Development/Testing**
- Use **Gmail SMTP** (easiest, free, reliable)

**Phase 2: Launch/MVP**
- Use **SendGrid Free Tier** (100/day)
- Or **Resend** (3,000/month)

**Phase 3: Growth**
- Upgrade to **SendGrid Paid** ($19.95/mo for 50k)
- Or switch to **AWS SES** (cheapest at scale)

**Start with Gmail, migrate to SendGrid when you hit limits.**

---

**Need help with setup? Check the troubleshooting section or Supabase Auth logs for detailed error messages.**
