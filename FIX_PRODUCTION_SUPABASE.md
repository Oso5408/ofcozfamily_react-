# Fix Production Website - Supabase 400 Error

## Problem

Your **production website** is using **old/wrong Supabase credentials**.

**Error in production:**
```
Failed to load resource: the server responded with a status of 400
{"message":"No API key found in request","hint":"No apikey request header or url param was found."}
```

**URL in error:** `tiomlxbxjbwwxuyuvwcu.supabase.co` ❌ (OLD/WRONG)

**Correct credentials:** `rlfrwsyqletwegvflqip.supabase.co` ✅

## Root Cause

When you build your React app for production (`npm run build`), Vite **bakes the environment variables into the JavaScript bundle**. Your production website was built with old credentials and needs to be rebuilt with the correct ones.

## Solution: Rebuild and Redeploy

### Step 1: Verify Local `.env` is Correct

Your local `.env` should have (already correct):

```env
VITE_SUPABASE_URL=https://rlfrwsyqletwegvflqip.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnJ3c3lxbGV0d2VndmZscWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0ODQ3NzAsImV4cCI6MjA3NTA2MDc3MH0.inDvJO8WSfvIE8dkNyefTUtOG4k0r0pN1sG5G6gQMBk
```

### Step 2: Clean and Rebuild

```bash
# Clean old build
rm -rf dist

# Rebuild with correct environment variables
npm run build
```

This creates a fresh `dist/` folder with the correct Supabase credentials embedded.

### Step 3: Deploy to Your Hosting Platform

The deployment steps depend on where your website is hosted:

---

## Option A: Hostinger (Most Likely)

If you're using **Hostinger** (based on your project folder name):

### Method 1: Upload via FTP/File Manager

1. **Access Hostinger File Manager:**
   - Log into Hostinger hPanel
   - Go to **Files → File Manager**
   - Navigate to `public_html/` or your website root

2. **Backup Current Site (Optional):**
   - Download/rename the current folder first

3. **Upload New Build:**
   - Delete old files in `public_html/`
   - Upload everything from your `dist/` folder
   - Make sure `index.html` is in the root

4. **Check `.htaccess`:**
   Create/update `.htaccess` for React Router:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

### Method 2: Hostinger Git Deployment

If you have Git deployment set up:

1. **Commit and push your changes:**
   ```bash
   git add .
   git commit -m "Fix: Update Supabase credentials to correct project"
   git push origin main
   ```

2. **Update Hostinger Environment Variables:**
   - Log into Hostinger hPanel
   - Go to **Website → Manage**
   - Look for **Environment Variables** or **Build Settings**
   - Add/update:
     ```
     VITE_SUPABASE_URL=https://rlfrwsyqletwegvflqip.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnJ3c3lxbGV0d2VndmZscWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0ODQ3NzAsImV4cCI6MjA3NTA2MDc3MH0.inDvJO8WSfvIE8dkNyefTUtOG4k0r0pN1sG5G6gQMBk
     ```

3. **Trigger rebuild/redeploy** in Hostinger dashboard

---

## Option B: Vercel

If deployed on **Vercel**:

1. **Go to:** https://vercel.com/dashboard
2. **Select your project**
3. **Go to Settings → Environment Variables**
4. **Add/Update:**
   - `VITE_SUPABASE_URL` = `https://rlfrwsyqletwegvflqip.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGci...` (full key)
5. **Go to Deployments tab**
6. **Click "..." menu → Redeploy**

---

## Option C: Netlify

If deployed on **Netlify**:

1. **Go to:** https://app.netlify.com
2. **Select your site**
3. **Go to Site settings → Environment variables**
4. **Add/Update:**
   - Key: `VITE_SUPABASE_URL`
   - Value: `https://rlfrwsyqletwegvflqip.supabase.co`
   - Key: `VITE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGci...` (full key)
5. **Go to Deploys tab**
6. **Click "Trigger deploy" → Deploy site**

---

## Option D: GitHub Pages

If using **GitHub Pages**:

1. **Update GitHub Secrets:**
   - Go to your repo: https://github.com/Oso5408/ofcozfamily_react-
   - Go to **Settings → Secrets and variables → Actions**
   - Add/Update:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

2. **Trigger GitHub Action:**
   - Make a commit and push
   - OR manually trigger workflow

---

## Step 4: Verify the Fix

After redeploying:

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Open your production website**
3. **Open DevTools Console (F12)**
4. **Check for Supabase config:**
   ```
   🔧 Supabase Config Check:
   URL: https://rlfrwsyqletwegvflqip...
   Key: eyJhbGci...
   ```

5. **Try logging in:**
   - The 400 error should be gone
   - You should see proper error messages like "Invalid email or password"

---

## Important: Environment Variables in Production

⚠️ **Vite Environment Variables:**

- Vite **embeds** env vars into the build at **build time**
- Changing `.env` locally does NOT update production automatically
- You must **rebuild and redeploy** after changing env vars
- Variables starting with `VITE_` are exposed to the browser

**This means:**
1. ❌ Updating `.env` alone → Does nothing to production
2. ❌ Pushing code without rebuild → Old env vars still in `dist/`
3. ✅ Rebuild + Redeploy → New env vars embedded

---

## Quick Checklist

- [ ] Local `.env` has correct credentials (`rlfrwsyqletwegvflqip`)
- [ ] Run `npm run build` to create fresh build
- [ ] Upload `dist/` folder to hosting (or update env vars + redeploy)
- [ ] Clear browser cache
- [ ] Test production website
- [ ] Check browser console for correct Supabase URL

---

## Need Help Identifying Your Hosting?

Check these:

1. **Look at your website URL:**
   - `*.vercel.app` → Vercel
   - `*.netlify.app` → Netlify
   - `*.github.io` → GitHub Pages
   - Custom domain → Check DNS/hosting control panel

2. **Check package.json:**
   ```bash
   cat package.json | grep -i "deploy\|homepage"
   ```

3. **Check for config files:**
   - `vercel.json` → Vercel
   - `netlify.toml` → Netlify
   - `.github/workflows/` → GitHub Actions

---

## If You Need Manual Upload

Your built files are in the `dist/` folder:

```
dist/
├── index.html          ← Main entry point
├── assets/
│   ├── index-*.js     ← Your app code (with env vars)
│   └── index-*.css    ← Styles
└── ...
```

Upload **everything** in `dist/` to your web server root.

---

## Still Not Working?

If the error persists after rebuild + redeploy:

1. **Hard refresh:** Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. **Check if CDN cached old files:** Wait 5-10 minutes for cache invalidation
3. **Verify build worked:** Open `dist/assets/index-*.js` and search for `rlfrwsyqletwegvflqip` - it should be there
4. **Check hosting env vars:** Make sure hosting platform has correct variables
5. **Try incognito mode:** Eliminates browser cache as a factor

---

## Summary

**Problem:** Production site has old Supabase credentials baked into build
**Solution:** Rebuild with correct credentials + redeploy
**Key Point:** Environment variables are embedded at **build time**, not runtime
