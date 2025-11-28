-- Add missing booking details columns
-- This migration adds equipment, purpose, guests, and special_requests columns to bookings table

-- Add equipment column (JSONB array to store equipment list with quantities)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS equipment JSONB DEFAULT '[]'::jsonb;

-- Add purpose column (TEXT to store booking purpose/business nature)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS purpose TEXT;

-- Add guests column (INTEGER to store number of guests)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS guests INTEGER DEFAULT 1;

-- Add special_requests column (TEXT to store special requests/notes)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS special_requests TEXT;

-- Add comment to document the equipment column structure
COMMENT ON COLUMN public.bookings.equipment IS 'Array of equipment objects: [{"type": "table", "quantity": 2}, {"type": "chair", "quantity": 4}]';

-- Verify the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
  AND column_name IN ('equipment', 'purpose', 'guests', 'special_requests')
ORDER BY column_name;
