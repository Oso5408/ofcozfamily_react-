# Supabase Setup Guide

This guide will help you set up Supabase as your online database for the Cat Cafe Booking System.

## Prerequisites

- A Supabase account (free tier available at [supabase.com](https://supabase.com))
- Node.js installed
- Git repository cloned

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Fill in project details:
   - **Name**: Cat Cafe Booking
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select closest to your users
4. Click "Create new project" (takes ~2 minutes to provision)

## Step 2: Set Up Database Schema

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `/supabase/schema.sql`
4. Paste into the SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Verify all tables were created:
   - Go to **Table Editor** in the sidebar
   - You should see: users, rooms, bookings, token_history, products, orders, order_items

## Step 3: Configure Environment Variables

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy your **Project URL** and **anon public** key
3. Create a `.env` file in your project root:

```bash
cp .env.example .env
```

4. Update `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

⚠️ **Important**: Never commit `.env` to version control!

## Step 4: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email settings:
   - **Enable email confirmations**: Recommended for production
   - **Secure email change**: Enable
4. Optional: Enable social login providers (Google, GitHub, etc.)

## Step 5: Migrate Existing Data

If you have existing data in localStorage, follow these steps:

### A. Backup Existing Data

```javascript
// Open browser console on your app
window.supabaseMigration.backup()
```

This downloads a JSON backup of your localStorage data.

### B. Migrate Rooms

```javascript
// In browser console
await window.supabaseMigration.migrateRooms()
```

### C. Export Users

```javascript
// In browser console
window.supabaseMigration.exportUsers()
```

**Note**: Users need to re-register with Supabase Auth. The export creates a reference file.

### D. Create Admin User

1. Register a new account through the app
2. Copy your user ID from Supabase dashboard (**Authentication** → **Users**)
3. In browser console:

```javascript
await window.supabaseMigration.promoteToAdmin('your-user-id-here')
```

### E. Full Migration (All Steps)

```javascript
// Runs backup, room migration, and user export
await window.supabaseMigration.runFull()
```

## Step 6: Enable Row Level Security Policies

Row Level Security (RLS) is automatically enabled by the schema. Verify:

1. Go to **Authentication** → **Policies**
2. Check each table has policies:
   - ✅ Users: 3 policies
   - ✅ Rooms: 2 policies
   - ✅ Bookings: 5 policies
   - ✅ Products: 2 policies
   - ✅ Orders: 3 policies

## Step 7: Test Database Connection

1. Start your development server:

```bash
npm run dev
```

2. Open browser console
3. Test connection:

```javascript
import { supabase } from '@/lib/supabase'

// Test query
const { data, error } = await supabase.from('rooms').select('*')
console.log(data, error)
```

If you see room data, connection is successful! ✅

## Step 8: Deploy to Production

### Environment Variables

When deploying to Vercel/Netlify/etc:

1. Add environment variables in your hosting platform:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Database Backups

1. In Supabase dashboard, go to **Database** → **Backups**
2. Daily backups are automatic on paid plans
3. For free tier: Manually backup important data regularly

## Troubleshooting

### "Missing Supabase environment variables" Error

- Ensure `.env` file exists in project root
- Verify environment variables start with `VITE_`
- Restart dev server after changing `.env`

### "Permission Denied" Errors

- Check Row Level Security policies are enabled
- Verify user is authenticated
- Check user has correct role (admin vs regular user)

### Migration Issues

- **Rooms already exist**: RLS policies prevent duplicate migration
- **Auth errors**: Ensure Supabase project is active
- **Foreign key violations**: Run schema.sql in correct order

### Connection Issues

```javascript
// Check Supabase connection
const { data, error } = await supabase.auth.getSession()
console.log('Session:', data, error)
```

## Database Schema Overview

### Core Tables

- **users**: User profiles (extends Supabase Auth)
- **rooms**: Available rooms for booking
- **bookings**: Room reservations
- **token_history**: Token transaction log
- **products**: E-commerce products
- **orders**: Customer orders
- **order_items**: Individual order line items

### Key Features

- ✅ Automatic conflict prevention for overlapping bookings
- ✅ Real-time updates for room availability
- ✅ Token deduction on booking completion
- ✅ Comprehensive audit trail
- ✅ Row-level security for data protection

## Advanced Configuration

### Custom Email Templates

1. Go to **Authentication** → **Email Templates**
2. Customize: Confirmation, Password Reset, Magic Link

### Database Functions

The schema includes helpful functions:

- `check_room_availability()`: Check if room is available
- `deduct_tokens_for_booking()`: Auto-deduct tokens on booking

### Real-time Subscriptions

Enable real-time for live updates:

```javascript
import { bookingService } from '@/services'

// Subscribe to room bookings
const subscription = bookingService.subscribeToRoomBookings(
  roomId,
  (payload) => {
    console.log('Booking updated:', payload)
  }
)

// Cleanup
subscription.unsubscribe()
```

## Security Best Practices

1. ✅ Never expose service_role key in frontend
2. ✅ Always use anon/public key in client
3. ✅ Keep `.env` in `.gitignore`
4. ✅ Enable RLS on all tables
5. ✅ Use parameterized queries (Supabase does this automatically)
6. ✅ Implement rate limiting for auth endpoints
7. ✅ Regular security updates

## Support

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [Project Issues](https://github.com/your-repo/issues)

## Next Steps

After setup:

1. ✅ Test user registration and login
2. ✅ Create test booking
3. ✅ Verify real-time updates
4. ✅ Test admin dashboard functionality
5. ✅ Load test with multiple concurrent bookings
