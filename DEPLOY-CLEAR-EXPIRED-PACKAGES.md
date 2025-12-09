# Deploy Auto-Clear Expired Packages

This guide walks you through deploying the automated expired package clearing system.

---

## Prerequisites

- ✅ Supabase CLI installed
- ✅ Supabase project initialized
- ✅ SQL migration already run (`auto-clear-expired-packages.sql`)

---

## Step 1: Install Supabase CLI (if not already installed)

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows (PowerShell)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or via npm
npm install -g supabase
```

Verify installation:
```bash
supabase --version
```

---

## Step 2: Login to Supabase

```bash
supabase login
```

This will open your browser to authenticate.

---

## Step 3: Link Your Project

```bash
# Find your project reference ID from Supabase Dashboard > Settings > General
supabase link --project-ref your-project-ref-id
```

Or use the interactive prompt:
```bash
supabase link
```

---

## Step 4: Deploy the Edge Function

```bash
# Deploy the clear-expired-packages function
supabase functions deploy clear-expired-packages
```

**Expected output:**
```
Deploying function clear-expired-packages...
Function clear-expired-packages deployed successfully!
URL: https://your-project-ref.supabase.co/functions/v1/clear-expired-packages
```

---

## Step 5: Set Environment Variables (Optional)

If you need to verify environment variables are set:

```bash
# Check existing secrets
supabase secrets list

# Set secrets if needed (usually auto-configured)
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Note:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available in Edge Functions.

---

## Step 6: Test the Edge Function Manually

### Option A: Using curl

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  https://your-project-ref.supabase.co/functions/v1/clear-expired-packages
```

### Option B: Using Supabase Dashboard

1. Go to **Edge Functions** in your Supabase Dashboard
2. Click on `clear-expired-packages`
3. Click **"Invoke Function"**
4. Select **POST** method
5. Click **"Send"**

### Expected Response:

```json
{
  "success": true,
  "message": "Cleared expired packages for 3 users",
  "summary": {
    "totalUsers": 3,
    "details": [
      {
        "user_id": "uuid-here",
        "email": "user@example.com",
        "packages_cleared": ["BR15", "DP20"],
        "br15_cleared": 10,
        "br30_cleared": 0,
        "dp20_cleared": 5
      }
    ],
    "totals": {
      "br15": 10,
      "br30": 0,
      "dp20": 5
    },
    "timestamp": "2025-12-09T00:00:00.000Z"
  }
}
```

---

## Step 7: Set Up GitHub Actions for Daily Execution

### A. Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **"New repository secret"**
4. Add these secrets:

| Secret Name | Value | Where to Find |
|-------------|-------|---------------|
| `SUPABASE_URL` | `https://your-project.supabase.co` | Supabase Dashboard > Settings > API |
| `SUPABASE_ANON_KEY` | `eyJhbGc...` | Supabase Dashboard > Settings > API |

### B. Push the Workflow File

The workflow file is already created at `.github/workflows/clear-expired-packages.yml`.

```bash
git add .github/workflows/clear-expired-packages.yml
git commit -m "feat: Add daily expired packages cleanup workflow"
git push
```

### C. Verify the Workflow

1. Go to your GitHub repository
2. Click **Actions** tab
3. You should see the **"Clear Expired Packages"** workflow
4. Click **"Run workflow"** to test it manually

**Schedule:**
- Runs automatically **daily at 00:00 UTC** (8:00 AM Hong Kong Time)
- Can be triggered manually from GitHub Actions UI

---

## Step 8: Monitor and Verify

### Check Edge Function Logs

```bash
# View recent function invocations
supabase functions logs clear-expired-packages

# Follow logs in real-time
supabase functions logs clear-expired-packages --follow
```

### Check Database Logs

```sql
-- View recent auto-cleared packages
SELECT
  u.email,
  ph.package_type,
  ph.br_amount,
  ph.reason,
  ph.created_at
FROM public.package_history ph
JOIN public.users u ON ph.user_id = u.id
WHERE ph.notes = 'Auto-cleared: Package expired'
ORDER BY ph.created_at DESC
LIMIT 10;
```

### Check GitHub Actions Logs

1. Go to **Actions** tab in your GitHub repository
2. Click on the latest **"Clear Expired Packages"** run
3. View the logs to see the response

---

## Alternative: Manual Execution (No GitHub Actions)

If you prefer not to use GitHub Actions, you can:

### Option 1: Use Supabase Cron (Coming Soon)

Supabase is working on built-in cron job support for Edge Functions.

### Option 2: Use External Cron Service

Services like:
- **Cron-job.org** (Free)
- **EasyCron** (Free tier available)
- **Vercel Cron** (If using Vercel)

Configure them to POST to:
```
https://your-project-ref.supabase.co/functions/v1/clear-expired-packages
```

Headers:
```
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
Content-Type: application/json
```

### Option 3: Manual SQL Query (Quick Test)

Run directly in Supabase SQL Editor:

```sql
SELECT * FROM clear_all_expired_packages();
```

---

## Troubleshooting

### Error: "Function not found"

**Solution:**
```bash
# Re-deploy the function
supabase functions deploy clear-expired-packages
```

### Error: "Missing environment variables"

**Solution:**
```bash
# Set the required secrets
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Error: "Permission denied"

**Solution:**
Make sure the SQL function has proper permissions:
```sql
GRANT EXECUTE ON FUNCTION clear_all_expired_packages TO authenticated;
```

### GitHub Actions Not Running

**Solutions:**
1. Verify secrets are set correctly (Settings > Secrets)
2. Check if the workflow file is in `.github/workflows/` directory
3. Ensure the cron schedule syntax is correct
4. Try triggering manually first (Actions > Run workflow)

---

## Summary

✅ **Edge Function deployed**: Handles the clearing logic
✅ **GitHub Actions workflow**: Triggers the function daily at midnight UTC
✅ **Full logging**: Both function logs and database audit trail
✅ **Manual testing**: Can invoke anytime from Dashboard or curl

**What happens daily:**
1. 🕛 00:00 UTC - GitHub Actions triggers
2. 📡 Calls Edge Function
3. 🔍 Edge Function scans for expired packages
4. ⚡ Clears all expired balances
5. 📝 Logs to `package_history`
6. ✅ Returns summary

---

## Commands Quick Reference

```bash
# Deploy function
supabase functions deploy clear-expired-packages

# View logs
supabase functions logs clear-expired-packages

# Test manually
curl -X POST \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  https://your-project.supabase.co/functions/v1/clear-expired-packages

# Check database
SELECT * FROM clear_all_expired_packages();
```

---

## Next Steps

1. ✅ Deploy the Edge Function (Step 4)
2. ✅ Test it manually (Step 6)
3. ✅ Set up GitHub Actions (Step 7)
4. ✅ Monitor logs to verify it works (Step 8)

🎉 Done! Your expired packages will now be automatically cleared daily.
