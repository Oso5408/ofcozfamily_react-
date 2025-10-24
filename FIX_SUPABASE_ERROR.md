# Fix: Supabase 400 Error - No API Key Found

## Error Message
```
Failed to load resource: the server responded with a status of 400
{"message":"No API key found in request","hint":"No apikey request header or url param was found."}
```

## Root Cause

The dev server was running with old cached environment variables or your browser had cached the old Supabase configuration.

**Your correct Supabase project:**
- `rlfrwsyqletwegvflqip.supabase.co` ✅

**Old/cached credentials causing errors:**
- `tiomlxbxjbwwxuyuvwcu.supabase.co` ❌ (OUTDATED)

## How to Fix

### Step 1: Verify Your `.env` File

Your `.env` file should already be correct. Verify it contains:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://rlfrwsyqletwegvflqip.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnJ3c3lxbGV0d2VndmZscWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0ODQ3NzAsImV4cCI6MjA3NTA2MDc3MH0.inDvJO8WSfvIE8dkNyefTUtOG4k0r0pN1sG5G6gQMBk

# Email Configuration (existing)
VITE_RESEND_API_KEY=your-resend-api-key
```

If it matches, the issue is caching, not the credentials.

### Step 2: Clear Vite Cache

```bash
rm -rf node_modules/.vite
```

### Step 3: Restart the Development Server

**IMPORTANT:** Vite only loads environment variables on startup!

1. Stop the current dev server (press `Ctrl+C` or `Cmd+C`)
2. Restart it:
   ```bash
   npm run dev
   ```

### Step 4: Clear Browser Cache (if needed)

If the error persists:
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

OR

1. Open in Incognito/Private mode

## Verify the Fix

After restarting, check your browser console. You should see:
```
🔧 Supabase Config Check:
URL: https://tiomlxbxjbwwxuyuvwcu...
Key: eyJhbGci...
```

If you see:
```
URL: MISSING
Key: MISSING
```

Then Vite couldn't load your `.env` file. Make sure:
- ✅ File is named exactly `.env` (not `.env.txt`)
- ✅ File is in the project root (same folder as `package.json`)
- ✅ Variables start with `VITE_`
- ✅ You restarted the dev server

## Common Mistakes

❌ **Forgot to restart dev server**
   → Environment variables only load on startup

❌ **Wrong file location**
   → `.env` must be in project root, not in `src/`

❌ **Missing VITE_ prefix**
   → Variables must start with `VITE_` to be exposed to browser

❌ **Extra spaces or quotes**
   → Use: `VITE_SUPABASE_URL=https://...`
   → NOT: `VITE_SUPABASE_URL = "https://..."`

❌ **Trailing slash in URL**
   → Use: `https://tiomlxbxjbwwxuyuvwcu.supabase.co`
   → NOT: `https://tiomlxbxjbwwxuyuvwcu.supabase.co/`

## Security Note

⚠️ **NEVER commit your `.env` file to Git!**

The `.env` file is already in `.gitignore`, but double-check:
```bash
git status
```

If you see `.env` listed, do NOT commit it! It contains sensitive credentials.

## Still Having Issues?

Check if Supabase is configured properly:

```bash
# Check if .env exists
ls -la .env

# Verify variables are set (safely)
cat .env | grep VITE_SUPABASE_URL | head -c 50
```

If the problem persists, verify:
1. ✅ Supabase project is not paused
2. ✅ API keys are still valid (not regenerated)
3. ✅ Network connection is working
4. ✅ No firewall/VPN blocking Supabase

## Test Login

After fixing, try logging in with:
- An existing test account
- The correct credentials

You should see proper error messages like:
- "Invalid email or password" (instead of API key errors)
- "Email not confirmed"
- etc.

## Need Help?

If you're still stuck:
1. Check the browser console for the Supabase config check
2. Verify the URL matches between console and browser errors
3. Make sure you copied the FULL API key (it's very long ~200+ characters)
