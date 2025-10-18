# Registration Testing Guide

This guide provides comprehensive test cases for the registration functionality.

## Pre-Testing Setup

1. ✅ Ensure Supabase database is set up (run `/supabase/complete-setup.sql`)
2. ✅ Verify `.env` file has correct Supabase credentials
3. ✅ Start development server: `npm run dev`
4. ✅ Open browser to registration page (usually `http://localhost:5173/#/register`)

## Test Cases

### 1. Form Validation Tests

#### Test 1.1: Empty Form Submission
**Steps:**
1. Leave all fields empty
2. Click "Register" button

**Expected Result:**
- ✅ Form should show validation errors for all required fields
- ✅ Button should be disabled or show error toasts
- ✅ No API call should be made

#### Test 1.2: Invalid Email Format
**Steps:**
1. Name: "Test User"
2. Email: "invalidemail" (no @ symbol)
3. Password: "ValidPass123!"
4. Confirm Password: "ValidPass123!"
5. Click out of email field (blur)

**Expected Result:**
- ✅ Email field should show red border
- ✅ Error message: "Please enter a valid email address" (or Chinese equivalent)
- ✅ Submit button should be disabled

#### Test 1.3: Weak Password (Too Short)
**Steps:**
1. Name: "Test User"
2. Email: "test@example.com"
3. Password: "abc123" (only 6 characters)
4. Confirm Password: "abc123"
5. Click out of password field

**Expected Result:**
- ✅ Password field shows red border
- ✅ Password strength indicator shows "Very Weak" in red
- ✅ Error message shows requirements not met
- ✅ Submit button disabled

#### Test 1.4: Weak Password (Missing Requirements)
**Steps:**
1. Name: "Test User"
2. Email: "test@example.com"
3. Password: "password123" (no uppercase, no special char)
4. Confirm Password: "password123"
5. Click out of password field

**Expected Result:**
- ✅ Password strength indicator shows low strength
- ✅ Error list shows missing:
  - At least one uppercase letter
  - At least one special character
- ✅ Submit button disabled

#### Test 1.5: Password Mismatch
**Steps:**
1. Name: "Test User"
2. Email: "test@example.com"
3. Password: "ValidPass123!"
4. Confirm Password: "ValidPass456!"
5. Click out of confirm password field

**Expected Result:**
- ✅ Confirm password field shows red border
- ✅ Error: "Passwords do not match"
- ✅ Submit button disabled

#### Test 1.6: Strong Password (All Requirements Met)
**Steps:**
1. Name: "Test User"
2. Email: "test@example.com"
3. Password: "ValidPass123!"
4. Confirm Password: "ValidPass123!"

**Expected Result:**
- ✅ Password strength indicator shows "Very Strong" in green
- ✅ No validation errors shown
- ✅ Submit button enabled
- ✅ All fields have green/normal borders

### 2. Registration Success Tests

#### Test 2.1: First Time Registration
**Steps:**
1. Fill form with valid data:
   - Name: "John Doe"
   - Email: "john.doe@example.com" (unique email)
   - Password: "SecurePass123!"
   - Confirm Password: "SecurePass123!"
2. Click "Register"

**Expected Result:**
- ✅ Button shows "Registering..." with loading state
- ✅ Success toast appears: "Registration Successful!"
- ✅ Automatically redirects to `/dashboard`
- ✅ User is logged in
- ✅ User profile created in Supabase database

**Verification in Supabase:**
1. Go to **Authentication** → **Users**
2. User should appear with email "john.doe@example.com"
3. Go to **Table Editor** → **users**
4. User profile should exist with:
   - Same ID as auth user
   - Email: john.doe@example.com
   - Full name: John Doe
   - Tokens: 0
   - is_admin: false

#### Test 2.2: Bilingual Support (Chinese)
**Steps:**
1. Switch language to Chinese (中文)
2. Fill registration form
3. Submit

**Expected Result:**
- ✅ All labels in Chinese
- ✅ Success message in Chinese: "註冊成功！"
- ✅ Description: "歡迎加入Ofcoz Family！"
- ✅ Redirects to dashboard

### 3. Error Handling Tests

#### Test 3.1: Duplicate Email Registration
**Steps:**
1. Register first user: test@example.com
2. Logout
3. Try to register again with same email: test@example.com

**Expected Result:**
- ✅ Error toast appears
- ✅ Title: "Registration Failed"
- ✅ Message: "This email is already registered. Please login or use a different email."
- ✅ User stays on registration page
- ✅ Form data is preserved

#### Test 3.2: Network Error Simulation
**Steps:**
1. Open browser DevTools → Network tab
2. Set throttling to "Offline"
3. Fill registration form
4. Click "Register"

**Expected Result:**
- ✅ Error toast appears after timeout
- ✅ Message about network connection
- ✅ Loading state stops
- ✅ Form is still editable

#### Test 3.3: Invalid Supabase Credentials
**Steps:**
1. Modify `.env` file with wrong credentials
2. Restart dev server
3. Try to register

**Expected Result:**
- ✅ Error toast appears
- ✅ Console shows Supabase connection error
- ✅ User-friendly error message displayed

### 4. UI/UX Tests

#### Test 4.1: Real-time Validation Feedback
**Steps:**
1. Start typing in name field
2. Click out (blur event)
3. Observe validation

**Expected Result:**
- ✅ Validation only triggers on blur, not while typing
- ✅ Error appears immediately on blur if invalid
- ✅ Error disappears when field becomes valid

#### Test 4.2: Password Strength Indicator
**Steps:**
1. Type progressively stronger passwords:
   - "abc" → Very Weak (red)
   - "abc123" → Weak (orange)
   - "Abc123" → Fair (yellow)
   - "Abc123!" → Strong (light green)
   - "Abc123!@#" → Very Strong (green)

**Expected Result:**
- ✅ Strength bar color changes appropriately
- ✅ Strength label updates
- ✅ Bar width increases with strength

#### Test 4.3: Form Navigation
**Steps:**
1. Click "Already have an account? Sign in now" link
2. Verify redirect to login page
3. Go back to register
4. Click "Back to Home" link
5. Verify redirect to home page

**Expected Result:**
- ✅ All links work correctly
- ✅ Navigation preserves app state

#### Test 4.4: Responsive Design
**Steps:**
1. Test on different screen sizes:
   - Desktop (1920x1080)
   - Tablet (768x1024)
   - Mobile (375x667)

**Expected Result:**
- ✅ Form is readable on all sizes
- ✅ Buttons are clickable
- ✅ No horizontal scroll
- ✅ Text is legible

### 5. Security Tests

#### Test 5.1: Password Visibility Toggle
**Steps:**
1. Type password in password field
2. Click eye icon to toggle visibility
3. Verify password is visible
4. Click again to hide

**Expected Result:**
- ✅ Password toggles between visible and hidden
- ✅ Confirm password field works the same way
- ✅ Icon changes appropriately

#### Test 5.2: SQL Injection Attempt
**Steps:**
1. Name: `'; DROP TABLE users; --`
2. Email: `test@example.com`
3. Password: `ValidPass123!`
4. Submit

**Expected Result:**
- ✅ Registration processes normally
- ✅ Name is stored as literal string
- ✅ No SQL injection occurs (Supabase uses parameterized queries)
- ✅ Database tables remain intact

#### Test 5.3: XSS Attempt
**Steps:**
1. Name: `<script>alert('XSS')</script>`
2. Email: `test@example.com`
3. Password: `ValidPass123!`
4. Submit and check dashboard

**Expected Result:**
- ✅ Script tag is escaped and stored as text
- ✅ No alert appears
- ✅ Name displays as literal text, not executed

### 6. Database Tests

#### Test 6.1: User Profile Auto-Creation
**Steps:**
1. Register new user
2. Check Supabase database immediately

**Expected Result:**
- ✅ Auth user created in `auth.users`
- ✅ Profile automatically created in `public.users` via trigger
- ✅ IDs match between tables
- ✅ Default values set correctly (tokens: 0, is_admin: false)

#### Test 6.2: Row Level Security
**Steps:**
1. Register user A
2. Login as user A
3. Try to access user B's data via API

**Expected Result:**
- ✅ User A can only see their own profile
- ✅ RLS policies prevent unauthorized access
- ✅ Proper error message if attempted

### 7. Edge Cases

#### Test 7.1: Very Long Name
**Steps:**
1. Name: 150 character string
2. Email: valid email
3. Password: valid password
4. Submit

**Expected Result:**
- ✅ Validation error: "Name must be less than 100 characters"
- ✅ Submit blocked

#### Test 7.2: Special Characters in Name
**Steps:**
1. Name: "José María O'Brien-Smith 李明"
2. Email: valid email
3. Password: valid password
4. Submit

**Expected Result:**
- ✅ Registration succeeds
- ✅ Name stored correctly with all characters
- ✅ Dashboard displays name properly

#### Test 7.3: Email with Plus Addressing
**Steps:**
1. Email: "user+test@example.com"
2. Fill other fields validly
3. Submit

**Expected Result:**
- ✅ Registration succeeds
- ✅ Email stored exactly as entered
- ✅ User can login with this email

#### Test 7.4: Rapid Multiple Submissions
**Steps:**
1. Fill form
2. Click submit button rapidly 5 times

**Expected Result:**
- ✅ Button disabled after first click
- ✅ Only one registration request sent
- ✅ No duplicate users created

## Test Checklist

Before considering registration complete, verify:

- [ ] All validation tests pass
- [ ] Success flow works in both languages
- [ ] Error handling is graceful and user-friendly
- [ ] Database trigger creates user profiles automatically
- [ ] RLS policies protect user data
- [ ] UI is responsive across devices
- [ ] Password strength indicator works correctly
- [ ] Real-time validation provides good UX
- [ ] No console errors during normal flow
- [ ] Forms are accessible (keyboard navigation works)

## Common Issues and Solutions

### Issue: "Missing Supabase environment variables"
**Solution**: Ensure `.env` file exists and restart dev server

### Issue: User created in auth but not in users table
**Solution**: Check that trigger exists (`on_auth_user_created`). Re-run `/supabase/complete-setup.sql`

### Issue: "Permission denied" on registration
**Solution**: Check RLS policies are set correctly. Trigger should use SECURITY DEFINER

### Issue: Registration succeeds but no redirect
**Solution**: Check browser console. Verify AuthContext is working. Check for routing errors

## Performance Testing

### Load Test Scenario
1. Register 10 users sequentially
2. Measure average response time
3. Check database for all profiles

**Expected:**
- Average response time < 2 seconds
- All profiles created correctly
- No memory leaks
- No database errors

## Accessibility Testing

1. ✅ Tab navigation works through all fields
2. ✅ Screen reader announces errors
3. ✅ Labels associated with inputs
4. ✅ Error messages have sufficient color contrast
5. ✅ Focus indicators visible

---

**✨ After completing all tests, registration is production-ready!**
