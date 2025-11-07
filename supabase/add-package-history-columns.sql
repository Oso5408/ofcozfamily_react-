-- Add missing columns to package_history table
-- This adds expiry_date and reason columns for better tracking

-- Add expiry_date column
ALTER TABLE public.package_history
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE;

-- Add reason column (separate from notes for clarity)
ALTER TABLE public.package_history
ADD COLUMN IF NOT EXISTS reason TEXT;

-- Update package_type constraint to include DP20
ALTER TABLE public.package_history
DROP CONSTRAINT IF EXISTS package_history_package_type_check;

ALTER TABLE public.package_history
ADD CONSTRAINT package_history_package_type_check
CHECK (package_type IN ('BR15', 'BR30', 'DP20'));

-- Add comment to explain the columns
COMMENT ON COLUMN public.package_history.expiry_date IS 'Expiry date for the package (NULL means no expiry)';
COMMENT ON COLUMN public.package_history.reason IS 'Reason for package assignment (e.g., purchase, promotion)';
COMMENT ON COLUMN public.package_history.notes IS 'Additional notes from admin';
