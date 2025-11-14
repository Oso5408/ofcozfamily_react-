# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React-based cat cafe booking and e-commerce web application with bilingual support (English/Chinese). Features: user authentication, room booking system with package options, admin dashboard, e-commerce integration, and comprehensive email notifications.

## Development Commands

### Core Commands
- `npm run dev` - Start Vite development server (http://localhost:5173)
- `npm run build` - Build for production (outputs to `dist/`)
- `npm run preview` - Preview production build locally

### Testing Commands
- `npm test` - Run Vitest in watch mode
- `npm run test:ui` - Run tests with visual UI interface
- `npm run test:run` - Run tests once (CI mode)
- `npm run test:coverage` - Generate coverage report

## Architecture Overview

### Tech Stack
- **Framework**: React 18 with Vite
- **Routing**: React Router DOM (HashRouter)
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with custom components in `src/components/ui/`
- **State Management**: React Context (AuthContext, LanguageContext, CartContext)
- **Email**: Resend integration
- **Data Storage**: LocalStorage for user data and preferences

### Key Contexts
- **AuthContext** (`src/contexts/AuthContext.jsx`): Handles user authentication, registration, token management, and includes hardcoded admin users
- **LanguageContext** (`src/contexts/LanguageContext.jsx`): Manages bilingual support (English/Chinese)
- **CartProvider** (`src/hooks/useCart.jsx`): E-commerce shopping cart functionality

### Project Structure
- **Pages**: `src/pages/` - Main application pages (HomePage, BookingPage, DashboardPage, AdminPage, etc.)
- **Components**: `src/components/` - Reusable components organized by feature
  - `admin/` - Admin-specific components
  - `dashboard/` - User dashboard components  
  - `ui/` - Base UI components (shadcn/ui style)
- **Data**: `src/data/` - Static data and translations
  - `translations/` - Bilingual content organized by feature
- **API**: `src/api/EcommerceApi.js` - E-commerce API integration
- **Utilities**: `src/lib/` - Utility functions for email, time, and general helpers

### Authentication System
The app uses **Supabase Authentication** with PostgreSQL backend:

**Key Components:**
- `src/contexts/AuthContext.jsx` - Main authentication state management
- `src/services/authService.js` - Authentication operations (signup, login, logout)
- Database trigger `handle_new_user()` auto-creates profile in `public.users` when auth user is created

**Authentication Flow:**
1. **Registration**: User signs up → Supabase auth creates user → Trigger creates profile → 1-second delay → Auto-login
2. **Login**: Credentials validated → Session created → Profile fetched from database → Real-time subscription activated
3. **Session**: Managed by Supabase client, persisted automatically
4. **State Management**: `AuthContext` listens to `onAuthStateChange` and syncs profile via real-time subscription

**IMPORTANT - Auth State Listener Bug:**
The `onAuthStateChange` callback in `AuthContext.jsx` (lines 49-85) **CANNOT use async/await** for Supabase calls due to a deadlock bug. See: https://github.com/supabase/auth-js/issues/936
- ❌ Bad: `await supabase.from('users').select()`
- ✅ Good: `supabase.from('users').select().then()`

**Token System:**
- Users have internal "tokens" (not auth tokens) for booking credits
- 180-day validity tracked in `users.tokens` and `users.token_valid_until`
- Token transactions logged in `token_history` table

**Admin Access:**
- Controlled by `users.is_admin` boolean (default: false)
- Must be manually granted via SQL: `UPDATE users SET is_admin = true WHERE email = 'admin@example.com'`

### Routing
All routes use HashRouter for client-side routing:
- `/` - Home page
- `/rooms` - Room listings
- `/booking/:roomId` - Room booking
- `/dashboard` - User dashboard
- `/admin` - Admin panel
- `/pricing` - Pricing information
- Authentication routes (login, register, password reset)

### Visual Editor Integration
The project includes custom Vite plugins for visual editing capabilities (development only):
- `plugins/visual-editor/vite-plugin-react-inline-editor.js`
- `plugins/visual-editor/vite-plugin-edit-mode.js`
- Gracefully skipped in production builds

**Error Handling:**
The `vite.config.js` includes custom error handlers that post messages to parent window:
- Vite error overlay handler (`horizons-vite-error`)
- Runtime error handler (`horizons-runtime-error`)
- Console error handler (`horizons-console-error`)
- Fetch error handler with response logging

### Styling System
- **Tailwind CSS** with custom design system
- **Path Alias**: `@/` maps to `src/` (configured in `vite.config.js`)
- **UI Components**: shadcn/ui style components in `src/components/ui/`
- Custom CSS properties for theming
- Responsive design with mobile-first approach

### Data Management
- User data stored in Supabase PostgreSQL database
- Authentication state managed by Supabase (persisted to localStorage automatically)
- Shopping cart persisted to localStorage
- Bilingual content managed through structured translation files

### Services Layer
All backend interactions **MUST** go through service modules in `src/services/`:

| Service | Responsibility | Key Functions |
|---------|----------------|---------------|
| `authService` | Authentication | `signup()`, `login()`, `logout()`, `resetPassword()` |
| `userService` | User CRUD | `getUser()`, `updateUser()`, `deleteUser()` |
| `bookingService` | Booking operations | `createBooking()`, `getAllBookings()`, `updateBooking()`, `cancelBooking()` |
| `roomService` | Room data | `getRooms()`, `updateRoom()` |
| `productService` | E-commerce | Product CRUD operations |
| `storageService` | File uploads | `uploadImage()`, `uploadVideo()`, `uploadReceipt()` |
| `emailService` | Email notifications | `sendBookingConfirmation()`, `sendCancellationEmail()` |
| `cancellationPolicyService` | Cancellation logic | `calculateRefund()`, `getCancellationPolicy()` |

**Critical Rules:**
1. **NEVER** use `supabase.from()` directly in components - always use services
2. Services handle error transformation, data normalization, and RLS compliance
3. All services return consistent `{ data, error }` or `{ success, data, error }` shapes
4. Import services via `@/services` or `@/services/index.js`

## Database Schema

### Core Tables
- **users** - User profiles linked to Supabase auth.users (id, email, full_name, phone, tokens, token_valid_until, is_admin)
- **rooms** - Bookable spaces (id, name, capacity, prices, features, booking_options, images)
- **bookings** - Room reservations (id, user_id, room_id, start_time, end_time, booking_type, payment_method, status)
- **token_history** - Token transaction ledger (id, user_id, change, new_balance, transaction_type, booking_id)
- **products** - E-commerce items (id, name, price, category, stock_quantity)
- **orders** - Purchase orders (id, user_id, total_amount, status)
- **order_items** - Order line items (id, order_id, product_id, quantity, price)

### Important Database Concepts
1. **Row Level Security (RLS)**: All tables have RLS policies. Users can only see/modify their own data; admins have broader access.
2. **Foreign Key Cascades**: Deleting a user cascades to their bookings and token history.
3. **Booking Constraints**: `no_overlapping_bookings` constraint prevents double-booking rooms.
4. **Database Trigger**: `handle_new_user()` trigger auto-creates user profile in `public.users` when auth user is created.

### Booking System Architecture

The app supports multiple booking types and package systems:

**Booking Types:**
- `hourly` - Standard hourly room rental
- `daily` - Full day rental
- `monthly` - Long-term rental
- `BR` - Boardroom package (special pricing with equipment)
- `DP20` - Day Pass with 20% discount package

**Package Systems:**
1. **BR (Boardroom) Package** - `add-br-package-system.sql`
   - Database columns: `br_package_active`, `br_package_expiry`, `br_package_hours_remaining`
   - Allows booking with equipment selection (projector, whiteboard, etc.)
   - Tracks remaining hours per user

2. **DP20 (Day Pass 20%) Package** - `add-dp20-package-system.sql`
   - Database columns: `dp20_package_active`, `dp20_package_expiry`, `dp20_package_days_remaining`
   - 20% discount on day pass bookings
   - Tracks remaining days per user

**Payment Methods:**
- `token` - Internal token system (deducted from `users.tokens`)
- `cash` - Manual payment (requires receipt upload)
- `br_package` - Deducts from BR package hours
- `dp20_package` - Deducts from DP20 package days

### Setup Instructions
- **Initial Setup**: Run `supabase/complete-setup.sql` for clean installation
- **Schema Reference**: See `DATABASE_ARCHITECTURE.md` for detailed ERD and relationships
- **Package Features**: Run package SQL files after initial setup if needed

## Known Issues & Solutions

### Admin User Management

**Status:** PARTIALLY FIXED - Requires SQL migrations for full functionality

Three admin features need database policy updates:

1. **Edit User Profile** - `FIX-USER-PROFILE-EDIT.md`
   - **Issue**: Admins cannot update user profiles (name, email, phone)
   - **Fix**: Run `supabase/check-and-fix-users-update-policy.sql`
   - **What it adds**: UPDATE policies for both admins and users

2. **Delete User** - `FIX-DELETE-AND-PASSWORD-RESET.md`
   - **Issue**: Delete button fails silently
   - **Fix**: Run `supabase/add-users-delete-policy.sql`
   - **What it adds**: DELETE policy for admins
   - **Limitation**: Only deletes `public.users` profile, NOT `auth.users` (requires service_role key via backend API)

3. **Password Reset** - `FIX-DELETE-AND-PASSWORD-RESET.md`
   - **Status**: ✅ FIXED in code
   - **Method**: Sends password reset email via Supabase (secure)

### Registration Stuck at "Registering..."

**Symptoms:**
- Registration button shows "Registering..." (註冊中...) indefinitely
- User successfully created in Supabase (`auth.users` and `public.users`)
- UI never redirects to dashboard

**Root Cause - Race Condition:**
The auto-login step happens before the database trigger finishes creating the user profile:
1. Supabase creates auth user ✅
2. Trigger starts creating profile in `public.users` (async)
3. Code tries to login immediately ❌
4. Login fails because profile doesn't exist yet

**Current Workaround (in AuthContext.jsx):**
```javascript
// Wait 1 second for trigger to complete
await new Promise(resolve => setTimeout(resolve, 1000));
const loginResult = await login(userData.email, userData.password);
```

**If Issue Persists:**
1. **Increase delay**: Change `1000` to `2000` (2 seconds)
2. **Add retry logic**: Retry login with exponential backoff
3. **Skip auto-login**: Redirect to login page with success message
4. **Check RLS policies**: Ensure user can read their own profile immediately

**User Workaround:**
Navigate to login page and sign in with new credentials (profile will exist by then).

**Recommended Long-term Fix:**
Listen to `onAuthStateChange` event for `SIGNED_IN` after signup instead of manual login attempt.

### Password Validation Requirements

**Important:** Password validation has TWO levels:

1. **Minimum Requirements (for submission):**
   - 8+ characters
   - Uppercase letter
   - Lowercase letter
   - Number
   - Special characters are OPTIONAL

2. **Strength Indicator (visual only):**
   - Shows 5 levels: Very Weak → Very Strong
   - Encourages strong passwords but doesn't block submission
   - "Fair" or "Strong" passwords are acceptable for registration

**Bug History:**
- ❌ Previous version: Required "Very Strong" (all 5 criteria) - too strict
- ✅ Current version: Only requires minimum 4 criteria - special chars optional

### Dashboard Access

**Protected Routes:**
- `/dashboard` - Requires authenticated user
- `/admin` - Requires authenticated user with `is_admin: true`

**If user not logged in:**
- Should redirect to `/login` with `returnUrl` parameter
- After login, redirect back to intended page

## Incomplete Features

### Daily View (查看日視圖) - NEEDS COMPLETION

**Status:** ⚠️ Page exists but not wired up - Results in 404

**Current State:**
- ✅ UI implemented: `src/pages/DailyBookingsPage.jsx`
- ✅ Button exists: `src/components/admin/BookingCalendar.jsx:243-244`
- ❌ Route missing: `/admin/daily-bookings/:date` not defined in `src/App.jsx`
- ❌ Uses localStorage: Still reads from `ofcoz_bookings` instead of Supabase

**Purpose:**
Timeline view showing all rooms side-by-side with hourly slots (10 AM - 10 PM):
- Visual capacity planning (green = available, blue = booked)
- Identify peak hours across all rooms
- Quick overview of daily occupancy

**To Complete:**
1. **Add route in `src/App.jsx`:**
   ```javascript
   import { DailyBookingsPage } from '@/pages/DailyBookingsPage';
   // ...
   <Route path="/admin/daily-bookings/:date" element={<DailyBookingsPage />} />
   ```

2. **Migrate to Supabase in `DailyBookingsPage.jsx`:**
   ```javascript
   // Replace lines 48-52
   const { data: bookings } = await bookingService.getAllBookings();
   // Filter by selected date
   // Normalize field names (receipt_number → receiptNumber)
   ```

3. **Test timeline visualization** with real Supabase data

**Current Behavior:**
Clicking "查看日視圖" navigates to `/admin/daily-bookings/2025-10-10` → **404 error**

## Working with the Codebase

### Adding New Features

**When adding authentication-protected features:**
1. Check user authentication state via `useAuth()` hook from `AuthContext`
2. For admin-only features, check `user.is_admin` boolean
3. Protected routes should redirect to `/login?returnUrl=[current-path]`

**When adding database operations:**
1. Always add new operations to the appropriate service in `src/services/`
2. Ensure RLS policies allow the operation (test with non-admin user)
3. Use `try-catch` blocks and return `{ error }` objects for failures
4. Handle both success and error cases in the UI with toast notifications

**When adding bilingual content:**
1. Add translation keys to both `src/data/translations/en/` and `src/data/translations/zh/`
2. Use `useLanguage()` hook to access `t()` translation function
3. Structure: `t('section.key')` where section matches file name in translations folder
4. Keep translation files organized by feature (auth, booking, admin, common, etc.)

### Common Patterns

**Field Name Inconsistencies:**
The codebase has an ongoing migration from camelCase to snake_case for database fields. Be aware of these mappings:
- `receiptNumber` ↔ `receipt_number`
- `startTime` ↔ `start_time`
- `endTime` ↔ `end_time`
- `userId` ↔ `user_id`
- `roomId` ↔ `room_id`

When reading from database, services typically transform snake_case to camelCase for frontend use.

**Toast Notifications:**
Use the toast system from `src/components/ui/toaster`:
```javascript
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();
toast({
  title: "Success",
  description: "Operation completed",
  variant: "default" // or "destructive" for errors
});
```

**Import Path Alias:**
Always use `@/` alias for imports (configured in `vite.config.js:213`):
```javascript
// ✅ Good
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

// ❌ Bad
import { Button } from '../../components/ui/button';
import { formatDate } from '../../../lib/utils';
```

## Environment Setup

### Required Environment Variables
Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RESEND_API_KEY=your_resend_api_key (for emails)
```

### Supabase Configuration
1. **Authentication Settings** (Supabase Dashboard → Authentication → Settings):
   - Enable Email provider
   - Configure site URL: Your production domain
   - Set redirect URLs: `https://yourdomain.com/auth/confirm`

2. **Storage Buckets** (required for file uploads):
   - `room-images` - Public bucket for room photos
   - `videos` - Public bucket for promotional videos
   - `receipts` - Private bucket for payment receipts
   - Run setup scripts: `setup-room-images-storage.sql`, `setup-video-storage.sql`

3. **Email Notifications** (Resend API):
   - Service: `src/services/emailService.js`
   - Required env var: `VITE_RESEND_API_KEY`
   - See `EMAIL-SETUP-GUIDE.md` for full setup instructions

### Email Notification System

The app sends bilingual (English/Chinese) emails for key events:

**Booking Lifecycle Emails:**
- `sendBookingConfirmation()` - Sent after successful booking creation
- `sendCancellationEmail()` - Sent when user cancels booking (includes refund details)

**Email Features:**
- Bilingual content based on user's language preference
- HTML formatted with booking details
- Includes room name, time, payment method, cost
- Cancellation emails show refund amount and policy

**Setup Requirements:**
1. Sign up for Resend API (free tier available)
2. Verify sender domain
3. Add `VITE_RESEND_API_KEY` to `.env`
4. Configure sender email in `emailService.js`

**Testing:**
Check email logs via Resend Dashboard or see `CHECK-EMAIL-LOGS.md`

## Troubleshooting

### Build Issues

**Babel Package Errors:**
The build excludes Babel packages via `rollupOptions.external` in `vite.config.js:218-224`:
```javascript
external: ['@babel/parser', '@babel/traverse', '@babel/generator', '@babel/types']
```
If you get import errors for these packages, verify they're in the external list.

### Development Issues

**Visual Editor Not Loading:**
Visual editor plugins (`vite-plugin-react-inline-editor`, `vite-plugin-edit-mode`) only load when `NODE_ENV !== 'production'`. Check `vite.config.js:5-14` for conditional loading logic.

**CORS Errors with Supabase:**
Add `http://localhost:5173` to Supabase's allowed origins:
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add site URL and redirect URLs
3. Ensure CORS is enabled

### Booking Issues

**Booking Overlap Error:**
The database has a GIST exclusion constraint `no_overlapping_bookings`:
```sql
EXCLUDE USING GIST (
  room_id WITH =,
  tstzrange(start_time, end_time) WITH &&
) WHERE (status NOT IN ('cancelled'))
```
This **prevents double-booking at the database level**. If you get this error:
1. Check if there's an existing non-cancelled booking for that room and time
2. Cancelled bookings are ignored by the constraint
3. Admin bookings can be forced (check override logic in BookingPage)

## Database Migrations & Documentation

### Key SQL Files
The `supabase/` directory contains incremental migration files:

**Essential Setup:**
- `complete-setup.sql` - **Start here** for fresh database installation (creates all tables, policies, triggers)

**Feature Migrations:**
- `add-br-package-system.sql` - BR (Boardroom) booking package feature
- `add-dp20-package-system.sql` - DP20 (Day Pass 20%) package system
- `booking-payment-fields.sql` - Payment tracking and receipt upload
- `add-cancellation-feature.sql` - Booking cancellation and refund logic
- `setup-room-images-storage.sql` + `setup-video-storage.sql` - File storage buckets

**Policy Fixes:**
- `check-and-fix-users-update-policy.sql` - Enable user profile editing
- `add-users-delete-policy.sql` - Enable admin user deletion
- `add-admin-booking-update-policy.sql` - Enable admin booking edits

### Important Documentation Files
- `DATABASE_ARCHITECTURE.md` - Complete ERD, schema design, and service layer patterns
- `EMAIL-SETUP-GUIDE.md` - Email notification configuration (Resend API)
- `DEPLOYMENT_GUIDE.md` - Production deployment instructions
- `FIX-*.md` files - Specific bug fixes and workarounds