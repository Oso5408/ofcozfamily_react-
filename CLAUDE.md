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
The app uses localStorage-based authentication with hardcoded admin accounts:
- admin@of-coz.com (password: admin123)
- manager@of-coz.com (password: manager123)

Users have token-based access with 180-day validity periods.

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
- User data stored in localStorage under `ofcoz_*` keys
- Shopping cart persisted to localStorage
- Bilingual content managed through structured translation files