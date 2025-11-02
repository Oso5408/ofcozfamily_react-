# Quick Setup Checklist ✅

Fill in your SMTP credentials and follow the steps!

---

## Your SMTP Credentials

Fill this out with the information provided to you:

```
┌─────────────────────────────────────────────────┐
│  SMTP Server Details                            │
├─────────────────────────────────────────────────┤
│  Host:     _________________________________    │
│  Port:     _________________________________    │
│  Username: _________________________________    │
│  Password: _________________________________    │
│  From:     _________________________________    │
│  Use SSL:  ☐ Yes (port 465)  ☐ No (port 587)  │
└─────────────────────────────────────────────────┘
```

---

## Setup Steps (5 minutes)

### ☐ Step 1: Install Supabase CLI

**macOS:**
```bash
brew install supabase/tap/supabase
```

**Windows/Linux:**
```bash
npm install -g supabase
```

---

### ☐ Step 2: Login & Link Project

```bash
# Login
supabase login

# Go to project folder
cd /Users/linenjuan/Downloads/horizons-export-39c194f1-5fbb-4e09-860b-f8ae67cf7c2e

# Link project (replace YOUR_PROJECT_REF)
supabase link --project-ref YOUR_PROJECT_REF
```

📝 **Your Project Ref:** _________________________

---

### ☐ Step 3: Set SMTP Credentials

Copy-paste these commands **one by one**, replacing with YOUR credentials:

```bash
# 1. SMTP Host
supabase secrets set SMTP_HOST=YOUR_SMTP_HOST

# 2. SMTP Port (587 or 465)
supabase secrets set SMTP_PORT=587

# 3. SMTP Username
supabase secrets set SMTP_USER=YOUR_USERNAME

# 4. SMTP Password
supabase secrets set SMTP_PASS=YOUR_PASSWORD

# 5. Sender Email
supabase secrets set SMTP_FROM_EMAIL=YOUR_FROM_EMAIL

# 6. Sender Name
supabase secrets set SMTP_FROM_NAME="Ofcoz Family"

# 7. SSL Setting (false for port 587, true for port 465)
supabase secrets set SMTP_SECURE=false
```

---

### ☐ Step 4: Verify Secrets

```bash
supabase secrets list
```

✅ Check you see all 7 secrets:
- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASS
- SMTP_FROM_EMAIL
- SMTP_FROM_NAME
- SMTP_SECURE

---

### ☐ Step 5: Deploy Function

```bash
supabase functions deploy send-booking-confirmation
```

✅ Wait for: `✓ Deployed successfully`

---

### ☐ Step 6: Test Email

**Option A - Via Dashboard:**
1. Go to Supabase Dashboard → Edge Functions
2. Click `send-booking-confirmation`
3. Click **Invoke**
4. Paste this (replace `YOUR_EMAIL`):

```json
{
  "to": "YOUR_EMAIL@example.com",
  "language": "zh",
  "booking": {
    "name": "測試",
    "receiptNumber": "TEST-001",
    "room": { "name": "roomA" },
    "date": "01/01/2025",
    "startTime": "10:00",
    "endTime": "12:00"
  },
  "roomNameTranslated": "測試房間"
}
```

5. Check your email!

**Option B - Via App Console:**
```javascript
const { emailService } = await import('/src/services/emailService.js');
await emailService.sendTestEmail('YOUR_EMAIL@example.com', 'zh');
```

---

## ✅ Done!

If you received the test email, setup is complete! 🎉

### Test the Full Flow:

1. ☐ Log in as admin
2. ☐ Go to Bookings
3. ☐ Find booking with status "待確認"
4. ☐ Click "View Receipt" → "Confirm Payment"
5. ☐ Customer receives email!

---

## Troubleshooting

### ❌ "Authentication failed"

- Check username and password are correct
- For Gmail: Use App Password, not regular password
- For Office365: Check password is correct

### ❌ "Connection refused"

- Check SMTP_HOST is correct
- Check SMTP_PORT (587 or 465)
- Check firewall isn't blocking SMTP

### ❌ "Email not received"

- Check spam folder
- Check sender email is valid
- View logs: `supabase functions logs send-booking-confirmation`

### View Logs

```bash
# See recent logs
supabase functions logs send-booking-confirmation

# Real-time logs
supabase functions logs send-booking-confirmation --tail
```

---

## Quick Reference Commands

```bash
# View all secrets
supabase secrets list

# Update a secret
supabase secrets set SMTP_PASS=new-password

# Redeploy function
supabase functions deploy send-booking-confirmation

# View logs
supabase functions logs send-booking-confirmation
```

---

## Support

- Full guide: See `CUSTOM-SMTP-SETUP.md`
- Implementation: See `EMAIL-IMPLEMENTATION-SUMMARY.md`

---

**Setup Date:** _______________

**Tested By:** _______________

**Status:** ☐ Complete ☐ In Progress ☐ Issues
