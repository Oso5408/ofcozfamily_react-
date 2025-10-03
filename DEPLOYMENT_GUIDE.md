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

4. **Deploy**
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

## Part 3: Configure Custom Domain in Vercel

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

## Part 4: Testing and Verification

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
- [ ] Room booking system
- [ ] Shopping cart and products
- [ ] Admin dashboard access
- [ ] Language switching (EN/中文)
- [ ] Mobile responsiveness
- [ ] Email functionality

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
- Check browser console for errors
- Verify routing configuration (HashRouter should work)
- Test the production build locally with `npm run preview`

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

**Congratulations! Your cat cafe booking app is now live with professional hosting and your custom domain!**