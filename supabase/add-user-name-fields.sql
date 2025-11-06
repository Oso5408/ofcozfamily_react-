-- =============================================
-- Add Title, First Name, Last Name Fields to Users Table
-- Remove Username Field
-- Make Phone Required
-- =============================================
-- Run this in your Supabase SQL Editor

-- Step 1: Add new columns (nullable first for existing users)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Step 2: Populate new fields for existing users from full_name
-- Split full_name into first_name and last_name (simple approach)
UPDATE public.users
SET
  title = 'Mr.',
  first_name = CASE
    WHEN full_name IS NOT NULL AND full_name != '' THEN
      SPLIT_PART(full_name, ' ', 1)
    ELSE 'User'
  END,
  last_name = CASE
    WHEN full_name IS NOT NULL AND full_name != '' AND array_length(string_to_array(full_name, ' '), 1) > 1 THEN
      SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
    ELSE ''
  END
WHERE title IS NULL OR first_name IS NULL OR last_name IS NULL;

-- Step 3: Make new fields required
ALTER TABLE public.users
ALTER COLUMN title SET NOT NULL,
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;

-- Step 4: Make phone required (update empty values first)
UPDATE public.users
SET phone = ''
WHERE phone IS NULL;

ALTER TABLE public.users
ALTER COLUMN phone SET NOT NULL;

-- Step 5: Drop username constraints and column
DROP INDEX IF EXISTS users_username_unique_idx;
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS username_format_check;
ALTER TABLE public.users
DROP COLUMN IF EXISTS username;

-- Step 6: Update the handle_new_user trigger function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    title,
    first_name,
    last_name,
    full_name,
    phone,
    tokens,
    is_admin,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'title', 'Mr.'),
    COALESCE(NEW.raw_user_meta_data->>'first_name', COALESCE(NEW.raw_user_meta_data->>'firstName', '')),
    COALESCE(NEW.raw_user_meta_data->>'last_name', COALESCE(NEW.raw_user_meta_data->>'lastName', '')),
    -- Construct full_name from first_name and last_name for backward compatibility
    CONCAT(
      COALESCE(NEW.raw_user_meta_data->>'first_name', COALESCE(NEW.raw_user_meta_data->>'firstName', '')),
      ' ',
      COALESCE(NEW.raw_user_meta_data->>'last_name', COALESCE(NEW.raw_user_meta_data->>'lastName', ''))
    ),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    0,
    FALSE,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Add comments for documentation
COMMENT ON COLUMN public.users.title IS 'User title/salutation (Mr., Ms., Mrs., Dr.)';
COMMENT ON COLUMN public.users.first_name IS 'User first name (given name)';
COMMENT ON COLUMN public.users.last_name IS 'User last name (surname)';
COMMENT ON COLUMN public.users.phone IS 'User phone number (required)';

-- Verification queries (run after migration to check)
-- SELECT id, email, title, first_name, last_name, full_name, phone FROM public.users ORDER BY created_at DESC LIMIT 10;
