# Quick Fix: Update Supabase Credentials on Vercel

## Your Setup

✅ **Hosting:** Vercel (detected `vercel.json`)
✅ **Local `.env`:** Already correct (`rlfrwsyqletwegvflqip`)
❌ **Production:** Using old credentials (`tiomlxbxjbwwxuyuvwcu`)

## Fix in 3 Steps (5 minutes)

### Step 1: Update Vercel Environment Variables

1. Go to: **https://vercel.com/dashboard**
2. Click on your project: **ofcozfamily_react-**
3. Click **Settings** → **Environment Variables**
4. Find or Add these variables:

#### Variable 1:
- **Name:** `VITE_SUPABASE_URL`
- **Value:** `https://rlfrwsyqletwegvflqip.supabase.co`
- **Environment:** Production, Preview, Development (check all)

#### Variable 2:
- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnJ3c3lxbGV0d2VndmZscWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0ODQ3NzAsImV4cCI6MjA3NTA2MDc3MH0.inDvJO8WSfvIE8dkNyefTUtOG4k0r0pN1sG5G6gQMBk`
- **Environment:** Production, Preview, Development (check all)

5. Click **Save** after each

### Step 2: Redeploy

**Option A: Via Vercel Dashboard**
1. Go to **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Confirm the redeploy

**Option B: Push to GitHub** (Triggers auto-deploy)
```bash
git add .
git commit -m "Fix: Update Supabase credentials" --allow-empty
git push origin main
```

### Step 3: Verify

1. Wait 1-2 minutes for deployment to complete
2. Open your production website
3. Press **Ctrl+Shift+R** (or **Cmd+Shift+R** on Mac) to hard refresh
4. Open browser DevTools Console (F12)
5. Look for:
   ```
   🔧 Supabase Config Check:
   URL: https://rlfrwsyqletwegvflqip...
   ```

✅ **The 400 errors should be gone!**

---

## Important Notes

⚠️ **If Variables Already Exist:**
- **Delete** the old ones first
- Or **Edit** them to update the values
- Make sure to check **all 3 environments** (Production, Preview, Development)

⚠️ **Must Redeploy:**
- Changing env vars alone doesn't update live site
- You MUST trigger a new deployment

⚠️ **Clear Browser Cache:**
- Your browser may have cached old JS files
- Always hard refresh after deployment: **Ctrl+Shift+R**

---

## Troubleshooting

### Still seeing 400 errors?

**Check 1:** Verify environment variables were saved
- Go to Vercel Settings → Environment Variables
- Confirm both variables show correct values

**Check 2:** Wait for deployment
- Check Deployments tab
- Make sure latest deployment shows "Ready" status
- URL should change after new deployment

**Check 3:** Clear ALL browser cache
- Press **Ctrl+Shift+Delete** (or **Cmd+Shift+Delete**)
- Select "All time"
- Check "Cached images and files"
- Click "Clear data"

**Check 4:** Try incognito mode
- Open new incognito/private window
- Go to your production URL
- This guarantees no cached files

### How to verify env vars are embedded?

After deployment:
1. Open your production site
2. Open DevTools → Sources tab
3. Find any `.js` file in the `assets/` folder
4. Press Ctrl+F and search for: `rlfrwsyqletwegvflqip`
5. You should find it in the JavaScript code

If you find `tiomlxbxjbwwxuyuvwcu` instead, the old env vars are still deployed.

---

## Screenshot Guide

If you need help finding things in Vercel:

**Environment Variables:**
```
Vercel Dashboard → Your Project → Settings (tab at top) →
Environment Variables (sidebar) → Add New or Edit
```

**Redeploy:**
```
Vercel Dashboard → Your Project → Deployments (tab at top) →
Click "..." on latest deployment → Redeploy
```

---

## Summary

1. ✅ Update 2 env vars in Vercel Settings
2. ✅ Redeploy (dashboard or git push)
3. ✅ Hard refresh your browser
4. ✅ Check console for correct Supabase URL

**Time needed:** 5 minutes
**Downtime:** None (rolling deployment)

---

## Need More Help?

See the full detailed guide: `FIX_PRODUCTION_SUPABASE.md`
