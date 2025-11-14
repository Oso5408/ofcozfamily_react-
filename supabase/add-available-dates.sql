-- =============================================
-- Add Available Dates Feature
-- =============================================
-- This allows admins to open specific date ranges for booking
-- By default, ALL dates are closed (unavailable)
-- Only dates in this table are available for booking
-- =============================================

-- Create available_dates table
CREATE TABLE IF NOT EXISTS public.available_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  available_date DATE NOT NULL UNIQUE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add index for fast date lookups
CREATE INDEX IF NOT EXISTS idx_available_dates_date ON public.available_dates(available_date);

-- Enable Row Level Security
ALTER TABLE public.available_dates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running script)
DROP POLICY IF EXISTS "Anyone can view available dates" ON public.available_dates;
DROP POLICY IF EXISTS "Admins can insert available dates" ON public.available_dates;
DROP POLICY IF EXISTS "Admins can delete available dates" ON public.available_dates;

-- Anyone can read available dates (needed for user booking calendar)
CREATE POLICY "Anyone can view available dates" ON public.available_dates
  FOR SELECT USING (true);

-- Only admins can insert available dates
CREATE POLICY "Admins can insert available dates" ON public.available_dates
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Only admins can delete available dates
CREATE POLICY "Admins can delete available dates" ON public.available_dates
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Available dates table created successfully';
  RAISE NOTICE '✅ RLS policies configured';
  RAISE NOTICE '✅ Anyone can view available dates';
  RAISE NOTICE '✅ Only admins can add/remove available dates';
  RAISE NOTICE '⚠️  IMPORTANT: By default, ALL dates are closed for booking';
  RAISE NOTICE '⚠️  Only dates in this table will be available for booking';
END $$;
