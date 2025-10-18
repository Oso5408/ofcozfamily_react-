-- =============================================
-- Add Receipt Number (Booking Number) Feature
-- =============================================
-- This script adds automatic receipt number generation to bookings
-- Receipt numbers are 7-digit unique identifiers (e.g., "7557cc0")
-- =============================================

-- Step 1: Add receipt_number column to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS receipt_number TEXT UNIQUE;

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_receipt_number
ON public.bookings(receipt_number);

-- Step 3: Create function to generate unique receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
  new_receipt_number TEXT;
  is_unique BOOLEAN;
BEGIN
  -- Loop until we find a unique receipt number
  LOOP
    -- Generate a 7-digit number
    new_receipt_number := LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0');

    -- Check if this number already exists
    SELECT NOT EXISTS (
      SELECT 1 FROM public.bookings WHERE receipt_number = new_receipt_number
    ) INTO is_unique;

    -- Exit loop if unique
    EXIT WHEN is_unique;
  END LOOP;

  RETURN new_receipt_number;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger function to auto-generate receipt number
CREATE OR REPLACE FUNCTION set_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if receipt_number is not already set
  IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
    NEW.receipt_number := generate_receipt_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger for new bookings
DROP TRIGGER IF EXISTS trigger_set_receipt_number ON public.bookings;
CREATE TRIGGER trigger_set_receipt_number
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION set_receipt_number();

-- Step 6: Backfill receipt numbers for existing bookings that don't have one
DO $$
DECLARE
  booking_record RECORD;
BEGIN
  -- Loop through bookings without receipt numbers
  FOR booking_record IN
    SELECT id FROM public.bookings WHERE receipt_number IS NULL
  LOOP
    -- Generate and update receipt number
    UPDATE public.bookings
    SET receipt_number = generate_receipt_number()
    WHERE id = booking_record.id;
  END LOOP;
END $$;

-- Step 7: Verify - Check that all bookings now have receipt numbers
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM public.bookings
  WHERE receipt_number IS NULL;

  IF missing_count > 0 THEN
    RAISE NOTICE 'Warning: % bookings still missing receipt numbers', missing_count;
  ELSE
    RAISE NOTICE 'Success: All bookings have receipt numbers';
  END IF;
END $$;

-- Step 8: Add comment for documentation
COMMENT ON COLUMN public.bookings.receipt_number IS 'Unique 7-digit booking receipt number, auto-generated on insert';
COMMENT ON FUNCTION generate_receipt_number() IS 'Generates a unique 7-digit receipt number for bookings';
COMMENT ON FUNCTION set_receipt_number() IS 'Trigger function to auto-generate receipt number for new bookings';
