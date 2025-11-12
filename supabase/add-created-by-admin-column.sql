-- Add created_by_admin column to bookings table
-- This tracks which admin user created the booking (if created by admin)

-- Add the column (nullable, as not all bookings are created by admin)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS created_by_admin UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Add comment to document the column
COMMENT ON COLUMN public.bookings.created_by_admin IS 'Admin user ID who created this booking on behalf of the customer (NULL for customer-created bookings)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_created_by_admin ON public.bookings(created_by_admin);

-- Verification query (optional - run to check the column was added)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
  AND column_name = 'created_by_admin';
