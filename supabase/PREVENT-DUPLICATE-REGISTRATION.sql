-- =============================================
-- PREVENT DUPLICATE EMAIL REGISTRATION
-- =============================================
-- This ensures users cannot register with duplicate emails
-- even if database constraints fail
-- =============================================

-- Step 1: Ensure UNIQUE constraint on public.users email
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_email_key CASCADE;

ALTER TABLE public.users
ADD CONSTRAINT users_email_key UNIQUE (email);

-- Step 2: Create function to check for existing email before insert
CREATE OR REPLACE FUNCTION check_email_not_duplicate()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if email already exists in public.users
  IF EXISTS (
    SELECT 1 FROM public.users WHERE email = NEW.email AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Email address % is already registered', NEW.email
      USING ERRCODE = '23505';  -- unique_violation error code
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger to run before insert on users
DROP TRIGGER IF EXISTS prevent_duplicate_email ON public.users;

CREATE TRIGGER prevent_duplicate_email
  BEFORE INSERT OR UPDATE OF email ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION check_email_not_duplicate();

-- Step 4: Update handle_new_user to handle duplicates gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  existing_user_id UUID;
BEGIN
  -- Check if user already exists in public.users
  SELECT id INTO existing_user_id
  FROM public.users
  WHERE email = NEW.email;

  IF existing_user_id IS NOT NULL THEN
    -- User already exists in public.users
    -- This can happen if:
    -- 1. User deleted their auth account but public.users record remained
    -- 2. Manual data manipulation

    -- Option A: Update existing record with new auth ID
    UPDATE public.users
    SET
      id = NEW.id,
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
      phone = COALESCE(NEW.raw_user_meta_data->>'phone', phone),
      username = COALESCE(
        LOWER(NEW.raw_user_meta_data->>'username'),
        username,
        -- Fallback: generate from email
        LOWER(CONCAT(
          SUBSTRING(NEW.email FROM '^[^@]+'),
          FLOOR(RANDOM() * 900 + 100)::TEXT
        ))
      ),
      updated_at = NOW()
    WHERE email = NEW.email;

    RAISE NOTICE 'Updated existing user record for email: %', NEW.email;
  ELSE
    -- Create new user record
    INSERT INTO public.users (id, email, full_name, phone, username)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      LOWER(COALESCE(
        NEW.raw_user_meta_data->>'username',
        -- Fallback: generate username from email
        CONCAT(
          SUBSTRING(NEW.email FROM '^[^@]+'),
          FLOOR(RANDOM() * 900 + 100)::TEXT
        )
      ))
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If we still get unique violation, log it but don't fail auth
    RAISE WARNING 'Duplicate email detected for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Ensure trigger is properly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Add index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email_lower
ON public.users (LOWER(email));

-- Step 7: Verification
-- Check that constraint is active
SELECT
  conname as constraint_name,
  contype as type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND conname = 'users_email_key';

-- Check that trigger exists
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'prevent_duplicate_email'
  AND event_object_table = 'users';

-- Check handle_new_user trigger
SELECT
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_table = 'users';

-- Final confirmation message
DO $$
BEGIN
  RAISE NOTICE 'Duplicate email prevention is now active!';
  RAISE NOTICE 'Test by trying to register with an existing email - it should fail gracefully.';
END $$;
