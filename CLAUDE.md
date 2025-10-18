# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based cat cafe booking and e-commerce web application with bilingual support (English/Chinese). The app includes user authentication, room booking system, product management, admin dashboard, and shopping cart functionality.

## Development Commands

### Core Commands
- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production (runs `tools/generate-llms.js` then Vite build)
- `npm run preview` - Preview production build

### Build Process
The build command executes `tools/generate-llms.js` before building, which appears to extract routing and metadata information from the codebase.

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

## Known Issues & Solutions

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