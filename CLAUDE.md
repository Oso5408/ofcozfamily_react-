# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based cat cafe booking and e-commerce web application with bilingual support (English/Chinese). The app includes user authentication, room booking system, product management, admin dashboard, and shopping cart functionality.

## Development Commands

### Core Commands
- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Testing Commands
- `npm test` - Run tests in watch mode with Vitest
- `npm run test:ui` - Run tests with UI interface
- `npm run test:run` - Run tests once (CI mode)
- `npm run test:coverage` - Run tests with coverage report

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
The app uses **Supabase Authentication** with the following setup:

**Database Setup:**
- Supabase PostgreSQL database with Row Level Security (RLS)
- Auto-creation of user profiles via database trigger (`handle_new_user()`)
- Complete schema in `/supabase/complete-setup.sql`

**Authentication Flow:**
- Registration: User signs up → Supabase auth → Trigger creates profile in `public.users` → Auto-login
- Login: Email/password → Supabase auth → Fetch profile from database
- Session: Persistent via localStorage, managed by Supabase client

**Token System:**
- Users have token-based access with 180-day validity periods
- Tokens tracked in `users.tokens` field
- Token history stored in `token_history` table

**Admin Access:**
- Admin status controlled by `users.is_admin` boolean
- Must be manually granted via SQL update in Supabase dashboard

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
The project includes custom Vite plugins for visual editing capabilities in development mode:
- `plugins/visual-editor/vite-plugin-react-inline-editor.js`
- `plugins/visual-editor/vite-plugin-edit-mode.js`

### Styling System
Uses Tailwind CSS with a custom design system featuring:
- CSS custom properties for theming
- Dark mode support
- Custom animations and components
- Responsive design patterns

### Data Management
- User data stored in Supabase PostgreSQL database
- Authentication state managed by Supabase (persisted to localStorage automatically)
- Shopping cart persisted to localStorage
- Bilingual content managed through structured translation files

### Services Layer
All backend interactions are abstracted through service modules in `src/services/`:
- **authService** - Handles Supabase authentication (signup, login, logout, session management)
- **userService** - User CRUD operations (get, update, delete user profiles)
- **bookingService** - Booking management (create, read, update, cancel bookings)
- **roomService** - Room data and availability queries
- **productService** - E-commerce product management
- **storageService** - Supabase Storage for file uploads (images, videos, receipts)
- **emailService** - Email notifications via Resend API
- **cancellationPolicyService** - Booking cancellation logic and refunds

**Important:** Always use service layer functions instead of direct Supabase client calls. Services handle error handling, data transformation, and RLS properly.

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

### Setup Instructions
- **Initial Setup**: Run `supabase/complete-setup.sql` for clean installation
- **Schema Reference**: See `DATABASE_ARCHITECTURE.md` for detailed ERD and relationships
- **Common Migrations**: The `supabase/` folder contains many incremental migrations for specific features

## Known Issues & Solutions

### User Management Issues

**Status:** PARTIALLY FIXED - Requires SQL migrations

Several admin user management features require database policy updates:

1. **User Profile Edit** (`FIX-USER-PROFILE-EDIT.md`)
   - **Issue**: Admins cannot edit user profiles (name, email, phone)
   - **Fix**: Run `supabase/check-and-fix-users-update-policy.sql`
   - **Adds**: UPDATE policies for admins and users to edit profiles

2. **Delete User** (`FIX-DELETE-AND-PASSWORD-RESET.md`)
   - **Issue**: Delete button doesn't work
   - **Fix**: Run `supabase/add-users-delete-policy.sql`
   - **Adds**: DELETE policy for admins
   - **Limitation**: Only deletes profile, not auth user (requires backend API with service_role key)

3. **Password Reset** (`FIX-DELETE-AND-PASSWORD-RESET.md`)
   - **Status**: FIXED in code
   - **Behavior**: Sends password reset email via Supabase (secure method)

### Registration Page Issues

**Issue: Registration gets stuck at "Registering..." (註冊中...)**

**Root Cause:**
After successful Supabase auth signup, the auto-login step may fail if:
1. Database trigger hasn't created the user profile yet (timing issue)
2. Network delay between auth creation and profile query
3. RLS policies preventing immediate profile access

**Current Solution (`src/contexts/AuthContext.jsx`):**
```javascript
// Wait 1 second for trigger to create profile
await new Promise(resolve => setTimeout(resolve, 1000));
// Then attempt auto-login
const loginResult = await login(userData.email, userData.password);
```

**If Problem Persists:**
1. Increase timeout from 1000ms to 2000ms
2. Add retry logic with exponential backoff
3. Or skip auto-login and redirect to login page with success message

**Symptoms:**
- User created successfully in Supabase Authentication → Users
- User profile exists in `public.users` table
- But UI stuck on "Registering..." and never redirects

**Quick Fix:**
User can manually go to login page and sign in with their new credentials.

**Long-term Fix:**
Consider using Supabase's `onAuthStateChange` listener to detect successful signup instead of manual login.

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

## Incomplete Features (TODO)

### Daily View Function (查看日視圖)

**Status:** INCOMPLETE/ABANDONED - Needs to be finished

**Location:**
- Button: `src/components/admin/BookingCalendar.jsx` (line 243-244)
- Page: `src/pages/DailyBookingsPage.jsx` (exists but not wired up)
- Route: **MISSING** - needs to be added to `src/App.jsx`

**What It Should Do:**
The "Daily View" button in the admin calendar is supposed to show a detailed timeline view for a specific date:
- Display all rooms side-by-side with hourly time slots (10 AM - 10 PM)
- Visualize booking occupancy: green = available, blue = booked
- Allow quick identification of busy vs free time slots across all rooms
- Useful for capacity planning and identifying peak hours

**Current Issues:**
1. ❌ **Missing Route**: `/admin/daily-bookings/:date` is not defined in `App.jsx`
2. ❌ **Not Imported**: `DailyBookingsPage` is not imported in `App.jsx`
3. ⚠️ **Uses localStorage**: `DailyBookingsPage.jsx` line 48-52 still reads from localStorage, needs to be updated to use Supabase
4. ⚠️ **Missing receipt number mapping**: Needs to map `receipt_number` field like other pages

**When Clicked:**
Currently, clicking "查看日視圖" tries to navigate to `/admin/daily-bookings/2025-10-10` but results in a **404 error** because the route doesn't exist.

**To Complete This Feature:**
1. Import `DailyBookingsPage` in `src/App.jsx`
2. Add route: `<Route path="/admin/daily-bookings/:date" element={<DailyBookingsPage />} />`
3. Update `DailyBookingsPage.jsx` to fetch bookings from Supabase instead of localStorage:
   - Replace `localStorage.getItem('ofcoz_bookings')` with `bookingService.getAllBookings()`
   - Filter by date and normalize data similar to AdminBookingsTab
   - Map `receipt_number` to `receiptNumber`
4. Test the timeline visualization works correctly

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

**Path Aliases:**
The project uses `@/` alias for `src/` directory (configured in vite.config.js):
- `@/components/ui/button` instead of `../../components/ui/button`
- `@/lib/utils` instead of `../../../lib/utils`

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
   - Configure email templates (optional)
   - Set site URL and redirect URLs

2. **Storage Buckets** (required for file uploads):
   - `room-images` - Public bucket for room photos
   - `videos` - Public bucket for promotional videos
   - Run `supabase/setup-room-images-storage.sql` and `supabase/setup-video-storage.sql`

3. **Email Service** (optional but recommended):
   - Configure Resend API key or SMTP settings
   - See `EMAIL-SETUP-GUIDE.md` for detailed instructions

## Troubleshooting

### Common Build/Runtime Issues

**Vite Build Errors with Babel Packages:**
The build process excludes certain Babel packages from the bundle (see vite.config.js). If you encounter import errors with `@babel/parser`, `@babel/traverse`, etc., verify they're listed in `rollupOptions.external`.

**Visual Editor Not Loading:**
The visual editor plugins only load in development mode. In production, they're gracefully skipped.

**CORS Errors with Supabase:**
Ensure your local development server URL (http://localhost:5173 by default) is added to Supabase's allowed origins in Authentication settings.

**Booking Overlap Errors:**
If you get errors creating bookings, check the `no_overlapping_bookings` constraint in the database. The constraint ignores cancelled bookings but prevents overlapping confirmed bookings for the same room.

## Additional Resources

The `supabase/` directory contains many SQL migration files for specific features. Key files:
- `complete-setup.sql` - Full database setup (start here for new projects)
- `add-br-package-system.sql` - BR (Boardroom) package feature
- `add-dp20-package-system.sql` - DP20 (Day Pass) package feature
- `booking-payment-fields.sql` - Payment and receipt handling

Documentation files (`.md` in root) provide detailed guides for specific features and fixes. Refer to these when working on related functionality.