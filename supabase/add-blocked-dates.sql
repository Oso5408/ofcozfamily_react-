-- =============================================
-- Add Blocked Dates Feature
-- =============================================
-- This allows admins to block specific dates from booking
-- Blocked dates are system-wide (all rooms)
-- =============================================

-- Create blocked_dates table
CREATE TABLE IF NOT EXISTS public.blocked_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocked_date DATE NOT NULL UNIQUE,
  reason TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add index for fast date lookups
CREATE INDEX IF NOT EXISTS idx_blocked_dates_date ON public.blocked_dates(blocked_date);

-- Enable Row Level Security
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running script)
DROP POLICY IF EXISTS "Anyone can view blocked dates" ON public.blocked_dates;
DROP POLICY IF EXISTS "Admins can insert blocked dates" ON public.blocked_dates;
DROP POLICY IF EXISTS "Admins can delete blocked dates" ON public.blocked_dates;

-- Anyone can read blocked dates (needed for user booking calendar to filter dates)
CREATE POLICY "Anyone can view blocked dates" ON public.blocked_dates
  FOR SELECT USING (true);

-- Only admins can insert blocked dates
CREATE POLICY "Admins can insert blocked dates" ON public.blocked_dates
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Only admins can delete blocked dates
CREATE POLICY "Admins can delete blocked dates" ON public.blocked_dates
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Blocked dates table created successfully';
  RAISE NOTICE '✅ RLS policies configured';
  RAISE NOTICE '✅ Anyone can view blocked dates';
  RAISE NOTICE '✅ Only admins can add/remove blocked dates';
END $$;
