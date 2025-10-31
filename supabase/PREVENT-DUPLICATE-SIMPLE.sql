-- =============================================
-- PREVENT DUPLICATE EMAIL REGISTRATION (SIMPLE VERSION)
-- =============================================
-- Run this in Supabase SQL Editor
-- =============================================

-- Step 1: Add UNIQUE constraint on email
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_email_key CASCADE;

ALTER TABLE public.users
ADD CONSTRAINT users_email_key UNIQUE (email);

-- Step 2: Create function to check for duplicates
CREATE OR REPLACE FUNCTION check_email_not_duplicate()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.users WHERE email = NEW.email AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Email address % is already registered', NEW.email
      USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger
DROP TRIGGER IF EXISTS prevent_duplicate_email ON public.users;

CREATE TRIGGER prevent_duplicate_email
  BEFORE INSERT OR UPDATE OF email ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION check_email_not_duplicate();

-- Step 4: Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  existing_user_id UUID;
BEGIN
  SELECT id INTO existing_user_id
  FROM public.users
  WHERE email = NEW.email;

  IF existing_user_id IS NOT NULL THEN
    -- Update existing record instead of creating duplicate
    UPDATE public.users
    SET
      id = NEW.id,
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
      phone = COALESCE(NEW.raw_user_meta_data->>'phone', phone),
      username = COALESCE(
        LOWER(NEW.raw_user_meta_data->>'username'),
        username,
        LOWER(CONCAT(
          SUBSTRING(NEW.email FROM '^[^@]+'),
          FLOOR(RANDOM() * 900 + 100)::TEXT
        ))
      ),
      updated_at = NOW()
    WHERE email = NEW.email;
  ELSE
    -- Create new user
    INSERT INTO public.users (id, email, full_name, phone, username)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      LOWER(COALESCE(
        NEW.raw_user_meta_data->>'username',
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
    RAISE WARNING 'Duplicate email detected for %', NEW.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
