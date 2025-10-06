# Registration Setup Guide

This guide will help you complete the registration setup for your Cat Cafe Booking System.

## Quick Start (3 Steps)

### Step 1: Run Database Setup Script

1. Go to your Supabase project dashboard at [supabase.com](https://supabase.com)
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open `/supabase/complete-setup.sql` from your project
5. Copy **ALL** the contents and paste into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Wait for "Success. No rows returned" message

✅ This creates all tables, triggers, and security policies needed for registration.

### Step 2: Configure Email Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Ensure **Email** provider is enabled (it should be by default)
3. Configure email settings:
   - **Enable email confirmations**:
     - ✅ **Recommended for production**: Users must verify email
     - ❌ **For testing/development**: Disable for faster testing
   - **Secure email change**: Enable (recommended)

### Step 3: Test Registration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open the app in your browser (usually http://localhost:5173)

3. Navigate to the registration page (`/register`)

4. Fill out the form:
   - Name: Test User
   - Email: test@example.com
   - Password: TestPassword123!
   - Confirm Password: TestPassword123!

5. Click "Register"

6. ✅ If successful, you should:
   - See a success message
   - Be automatically logged in
   - Redirect to the dashboard

## Verification

### Check Database

1. Go to **Table Editor** in Supabase dashboard
2. Select **users** table
3. You should see your newly created user with:
   - Email
   - Full name
   - Tokens: 0
   - is_admin: false

### Check Authentication

1. Go to **Authentication** → **Users** in Supabase dashboard
2. You should see the same user listed
3. Confirm status shows as "confirmed" (or "unconfirmed" if email confirmation is enabled)

## Troubleshooting

### Error: "Missing Supabase environment variables"

**Solution**:
1. Ensure `.env` file exists in project root
2. Verify it contains:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. Restart your dev server after changes

### Error: "User already registered"

**Solution**:
- The email is already in use
- Try a different email or delete the user from Supabase dashboard

### Error: "Password should be at least 6 characters"

**Solution**:
- Supabase requires minimum 6 characters
- Use a stronger password (recommended: 8+ chars with mix of upper, lower, numbers, special chars)

### Error: "Failed to create user profile"

**Solution**:
1. Check that you ran `/supabase/complete-setup.sql` successfully
2. Verify the trigger exists:
   - Go to **Database** → **Triggers** in Supabase
   - Look for trigger named `on_auth_user_created` on table `auth.users`
3. Re-run the setup script if needed

### Registration succeeds but no redirect

**Solution**:
- Check browser console for errors
- Verify AuthContext is properly initialized
- Check network tab for API responses

## Email Confirmation Setup (Optional)

If you enabled email confirmations:

### Development (No Email Sending)

1. In Supabase dashboard, go to **Authentication** → **Providers** → **Email**
2. Disable "Enable email confirmations"
3. Users can register and login immediately

### Production (With Email Sending)

1. Configure email provider in Supabase:
   - Go to **Settings** → **Auth** → **SMTP Settings**
   - Options:
     - Use Supabase's default (limited)
     - Configure custom SMTP (SendGrid, AWS SES, etc.)

2. Customize email templates:
   - Go to **Authentication** → **Email Templates**
   - Edit "Confirm signup" template
   - Customize with your branding

3. Test the flow:
   - Register new user
   - Check email inbox
   - Click confirmation link
   - User can now login

## Creating an Admin User

After registering your first user:

1. Get your user ID:
   - Go to **Authentication** → **Users** in Supabase
   - Copy the UUID of your user

2. Open SQL Editor

3. Run this query (replace `YOUR-USER-ID` with your actual UUID):
   ```sql
   UPDATE public.users
   SET is_admin = true
   WHERE id = 'YOUR-USER-ID';
   ```

4. Refresh the page and you should now have admin access

## Form Validation

The registration form now includes:

✅ **Name validation**: Required field
✅ **Email validation**: Must be valid email format
✅ **Password validation**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (@$!%*?&)
✅ **Password confirmation**: Must match password
✅ **Real-time feedback**: Shows errors as you type
✅ **Bilingual support**: Error messages in English and Chinese

## Security Features

✅ **Row Level Security (RLS)**: Enabled on all tables
✅ **Automatic profile creation**: Users created via secure trigger
✅ **Token-based auth**: Secure session management
✅ **Password hashing**: Handled automatically by Supabase
✅ **SQL injection protection**: Parameterized queries

## Next Steps

After successful registration setup:

1. ✅ Test login functionality
2. ✅ Test password reset flow
3. ✅ Create a few test users
4. ✅ Test booking functionality with registered users
5. ✅ Create admin user and test admin dashboard
6. ✅ Configure production email provider
7. ✅ Set up rate limiting (in Supabase dashboard)

## Support

If you encounter issues:

1. Check the browser console for errors
2. Check Supabase logs: **Logs** → **Auth Logs**
3. Review the [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
4. Check this project's issues on GitHub

## Files Reference

- `/supabase/complete-setup.sql` - Complete database setup script
- `/src/pages/RegisterPage.jsx` - Registration page UI
- `/src/contexts/AuthContext.jsx` - Authentication logic
- `/src/services/authService.js` - Supabase auth integration
- `.env` - Environment variables (Supabase credentials)

---

**✨ Registration is now complete and ready to use!**
