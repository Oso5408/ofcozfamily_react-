# Hostinger Domain + Vercel Hosting Setup Guide

This guide will help you set up your cat cafe booking application using Hostinger for domain management and Vercel for hosting.

## Overview

- **Domain Management**: Hostinger (DNS configuration)
- **Hosting**: Vercel (React app deployment)
- **Benefits**: Professional hosting with automatic deployments

## Prerequisites

- GitHub account with your code repository
- Hostinger account with your domain
- Vercel account (free tier available)

---

## Part 1: Deploy to Vercel

### Step 1: Connect GitHub to Vercel

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign up/login with your GitHub account

2. **Import Project**
   - Click "New Project" on your dashboard
   - Select "Import Git Repository"
   - Choose your cat cafe repository
   - Click "Import"

3. **Configure Build Settings**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build` (should auto-detect)
   - **Output Directory**: `dist` (should auto-detect)
   - **Install Command**: `npm install` (should auto-detect)

4. **Add Environment Variables** ⚠️ **CRITICAL STEP**

   Click "Environment Variables" and add these:

   ```
   Name: VITE_SUPABASE_URL
   Value: https://rlfrwsyqletwegvflqip.supabase.co

   Name: VITE_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnJ3c3lxbGV0d2VndmZscWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0ODQ3NzAsImV4cCI6MjA3NTA2MDc3MH0.inDvJO8WSfvIE8dkNyefTUtOG4k0r0pN1sG5G6gQMBk
   ```

   ⚠️ **Important Notes:**
   - These must be set BEFORE deploying
   - Variable names are case-sensitive
   - Don't add quotes around values
   - The anon key is safe to expose (it's public)

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (2-3 minutes)
   - Your app will be available at `https://your-project-name.vercel.app`

### Step 2: Test Your Deployment

1. **Verify Functionality**
   - Test all main features (booking, authentication, cart)
   - Check both English and Chinese translations
   - Ensure responsive design works

2. **Note Your Vercel URL**
   - Copy your deployment URL (e.g., `your-project-name.vercel.app`)
   - You'll need this for DNS configuration

---

## Part 2: Configure Hostinger DNS

### Step 1: Access DNS Management

1. **Login to Hostinger**
   - Go to [hostinger.com](https://hostinger.com)
   - Access your hosting control panel

2. **Find DNS Zone Editor**
   - Go to "Domains" section
   - Select your domain
   - Click "DNS Zone Editor" or "Manage DNS"

### Step 2: Configure DNS Records

**Remove existing records** (if any):
- Delete any existing A records for `@` and `www`
- Delete any existing CNAME records for `www`

**Add new records**:

1. **For root domain (example.com)**
   - **Type**: A
   - **Name**: `@`
   - **Value**: `76.76.19.61`
   - **TTL**: 3600

2. **For www subdomain (www.example.com)**
   - **Type**: CNAME
   - **Name**: `www`
   - **Value**: `cname.vercel-dns.com`
   - **TTL**: 3600

3. **Save changes**

### Step 3: Wait for Propagation

- DNS changes take 24-48 hours to fully propagate
- Use tools like [whatsmydns.net](https://whatsmydns.net) to check propagation status

---

## Part 3: Configure Supabase for Production

### Step 1: Add Production URL to Supabase

1. **Go to Supabase Dashboard**
   - Visit [supabase.com](https://supabase.com)
   - Open your project: `rlfrwsyqletwegvflqip`

2. **Update Site URL**
   - Go to **Authentication** → **URL Configuration**
   - Set **Site URL** to your Vercel URL: `https://your-project-name.vercel.app`
   - (Update again later when custom domain is active)

3. **Add Redirect URLs**

   Add these URLs to **Redirect URLs**:
   ```
   https://your-project-name.vercel.app/#/auth/confirm
   https://your-project-name.vercel.app/#/reset-password
   https://your-project-name.vercel.app/#/dashboard
   http://localhost:5173/#/auth/confirm (keep for local dev)
   ```

4. **Save Changes**

### Step 2: Configure Email Settings

1. **Email Confirmation** (Optional but Recommended)
   - Go to **Authentication** → **Providers** → **Email**
   - Enable "Confirm email" for production security
   - Configure SMTP (see SMTP_SETUP_GUIDE.md)

2. **Test Email Delivery**
   - Register a test user on production
   - Verify confirmation email arrives

---

## Part 4: Configure Custom Domain in Vercel

### Step 1: Add Domain to Vercel

1. **Go to Project Settings**
   - Open your project in Vercel dashboard
   - Go to "Settings" tab
   - Click "Domains" in sidebar

2. **Add Custom Domain**
   - Click "Add"
   - Enter your domain: `yourdomain.com`
   - Click "Add"

3. **Add WWW Subdomain**
   - Click "Add" again
   - Enter: `www.yourdomain.com`
   - Click "Add"

### Step 2: Verify Domain Configuration

1. **Check Domain Status**
   - Both domains should show "Valid Configuration" after DNS propagation
   - If you see errors, double-check your DNS records

2. **Set Primary Domain**
   - Choose which domain should be primary (usually `www.yourdomain.com`)
   - Vercel will redirect the other to the primary

### Step 3: SSL Certificate

- Vercel automatically provisions SSL certificates
- Your site will be available at `https://yourdomain.com`
- Certificate renewal is automatic

---

### Step 4: Update Supabase URLs for Custom Domain

After your custom domain is active:

1. **Update Site URL**
   - Go to Supabase → **Authentication** → **URL Configuration**
   - Change **Site URL** to: `https://yourdomain.com`

2. **Update Redirect URLs**
   - Replace Vercel URLs with your custom domain:
   ```
   https://yourdomain.com/#/auth/confirm
   https://yourdomain.com/#/reset-password
   https://yourdomain.com/#/dashboard
   ```

3. **Save and Test**

---

## Part 5: Testing and Verification

### Step 1: Test Domain Access

1. **Try accessing your site**:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com`
   - Both should load your cat cafe app

2. **Test redirects**:
   - HTTP should redirect to HTTPS
   - Non-www should redirect to www (or vice versa)

### Step 2: Test All Functionality

- [ ] User registration and login
- [ ] Email confirmation (check inbox)
- [ ] Password reset flow
- [ ] Room booking system
- [ ] Shopping cart and products
- [ ] Admin dashboard access
- [ ] Language switching (EN/中文)
- [ ] Mobile responsiveness
- [ ] All images load correctly
- [ ] Database operations (Supabase connection)

---

## Troubleshooting

### Common DNS Issues

**"Domain not configured correctly"**
- Double-check A and CNAME records
- Wait for full DNS propagation (up to 48 hours)
- Use `dig yourdomain.com` to check DNS resolution

**"Invalid configuration"**
- Ensure no conflicting DNS records
- Check that TTL values are correct
- Contact Hostinger support if needed

### Build Issues

**Build fails on Vercel**
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify environment variables if needed

**App doesn't load properly**
- Check browser console for errors (F12)
- Verify routing configuration (HashRouter should work)
- Test the production build locally with `npm run preview`
- Check if environment variables are set in Vercel

**Blank page after deployment**
- Verify environment variables are set correctly
- Check Vercel deployment logs for errors
- Ensure Supabase is not paused (free tier auto-pauses after 7 days)

**Database/Auth not working**
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Check Supabase project is active
- Verify production URL is added to Supabase allowed URLs
- Check browser console for Supabase connection errors

### Performance Optimization

**After successful deployment**:
- Monitor Core Web Vitals in Vercel Analytics
- Consider implementing environment variables for API keys
- Set up monitoring alerts for downtime

---

## Maintenance

### Automatic Deployments

- Any push to your main branch will automatically deploy to Vercel
- Preview deployments are created for pull requests
- You can rollback to previous deployments in Vercel dashboard

### Domain Renewal

- Remember to renew your domain through Hostinger
- DNS configuration will persist through renewals
- Update payment methods to avoid service interruption

---

## Support

### Vercel Support
- [Vercel Documentation](https://vercel.com/docs)
- [Community Forum](https://github.com/vercel/vercel/discussions)

### Hostinger Support
- Hostinger Help Center
- Live chat support
- Email support

---

---

## Quick Deployment Checklist

Use this checklist to deploy step-by-step:

### Pre-Deployment
- [ ] Code committed and pushed to GitHub
- [ ] `.env` file NOT committed (in .gitignore)
- [ ] Test local build: `npm run build && npm run preview`

### Vercel Setup
- [ ] Sign up/login to Vercel with GitHub
- [ ] Import repository
- [ ] Set environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [ ] Deploy and get Vercel URL

### Supabase Configuration
- [ ] Add Vercel URL to Supabase Site URL
- [ ] Add redirect URLs to Supabase
- [ ] Enable email confirmation (optional)
- [ ] Configure SMTP (optional but recommended)

### Custom Domain (Optional)
- [ ] Configure DNS in Hostinger (A and CNAME records)
- [ ] Add domain to Vercel
- [ ] Wait for DNS propagation (24-48 hours)
- [ ] Update Supabase with custom domain URLs
- [ ] Verify SSL certificate is active

### Testing
- [ ] Test registration and login
- [ ] Test email confirmation
- [ ] Test all main features
- [ ] Test on mobile devices
- [ ] Test both languages (EN/ZH)

---

**Congratulations! Your cat cafe booking app is now live with professional hosting and your custom domain!**

## Need Help?

- **Vercel Issues**: Check [Vercel Documentation](https://vercel.com/docs)
- **Supabase Issues**: Check [Supabase Documentation](https://supabase.com/docs)
- **DNS Issues**: Contact Hostinger support
- **General Issues**: Check browser console (F12) for error messages