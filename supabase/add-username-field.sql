-- =============================================
-- Add Username Field to Users Table
-- =============================================
-- This migration adds a unique username field for user identification
-- Usernames must be:
-- - Alphanumeric only (a-z, 0-9)
-- - Minimum 3 characters
-- - Unique across all users
-- - Case-insensitive (stored in lowercase)

-- Step 1: Add username column (nullable first for existing users)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS username TEXT;

-- Step 2: Add unique constraint (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique_idx
ON public.users (LOWER(username));

-- Step 3: Add check constraint for alphanumeric validation
ALTER TABLE public.users
ADD CONSTRAINT username_format_check
CHECK (username ~ '^[a-zA-Z0-9]{3,20}$');

-- Step 4: For existing users without username, generate one from email
-- Format: first part of email + random 3 digits
UPDATE public.users
SET username = LOWER(
  CONCAT(
    SUBSTRING(email FROM '^[^@]+'),
    FLOOR(RANDOM() * 900 + 100)::TEXT
  )
)
WHERE username IS NULL;

-- Step 5: Make username required for new users
ALTER TABLE public.users
ALTER COLUMN username SET NOT NULL;

-- Step 6: Update the handle_new_user trigger function to include username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    LOWER(COALESCE(NEW.raw_user_meta_data->>'username',
      -- Fallback: generate username from email if not provided
      CONCAT(
        SUBSTRING(NEW.email FROM '^[^@]+'),
        FLOOR(RANDOM() * 900 + 100)::TEXT
      )
    ))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Add comment for documentation
COMMENT ON COLUMN public.users.username IS 'Unique username for user identification. Alphanumeric only, 3-20 characters, case-insensitive.';

-- Verification queries (run after migration)
-- SELECT username, email FROM public.users ORDER BY created_at DESC LIMIT 10;
-- SELECT COUNT(DISTINCT username) = COUNT(*) as usernames_are_unique FROM public.users;
