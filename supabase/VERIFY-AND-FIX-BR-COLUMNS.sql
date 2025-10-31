-- =============================================
-- VERIFY AND FIX BR PACKAGE COLUMNS
-- =============================================
-- This script checks if br15_balance and br30_balance columns exist
-- and adds them if they don't. Run this in your Supabase SQL Editor.
-- =============================================

-- Step 1: Check if columns exist
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN ('br15_balance', 'br30_balance')
ORDER BY column_name;

-- Step 2: Add columns if they don't exist (safe - won't error if they already exist)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS br15_balance INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS br30_balance INTEGER DEFAULT 0 NOT NULL;

-- Step 3: Verify columns were added
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN ('br15_balance', 'br30_balance')
ORDER BY column_name;

-- Step 4: Check current BR balances for all users
SELECT
  id,
  email,
  full_name,
  br15_balance,
  br30_balance,
  tokens
FROM public.users
ORDER BY email;

-- Step 5: Create package_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.package_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  package_type TEXT NOT NULL CHECK (package_type IN ('BR15', 'BR30')),
  br_amount INTEGER NOT NULL,
  assigned_by UUID REFERENCES public.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Step 6: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_package_history_user_id ON public.package_history(user_id);
CREATE INDEX IF NOT EXISTS idx_package_history_created_at ON public.package_history(created_at DESC);

-- Step 7: Enable RLS on package_history if not already enabled
ALTER TABLE public.package_history ENABLE ROW LEVEL SECURITY;

-- Step 8: Drop existing policies and recreate them
DROP POLICY IF EXISTS "Users can view own package history" ON public.package_history;
DROP POLICY IF EXISTS "Admins can view all package history" ON public.package_history;
DROP POLICY IF EXISTS "Admins can insert package history" ON public.package_history;

-- Users can view their own package history
CREATE POLICY "Users can view own package history"
  ON public.package_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all package history
CREATE POLICY "Admins can view all package history"
  ON public.package_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Admins can insert package history
CREATE POLICY "Admins can insert package history"
  ON public.package_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Grant permissions
GRANT SELECT ON public.package_history TO authenticated;
GRANT INSERT ON public.package_history TO authenticated;

-- Step 9: Add comments for documentation
COMMENT ON COLUMN public.users.br15_balance IS 'BR balance from BR15 packages (1 BR = 1 hour)';
COMMENT ON COLUMN public.users.br30_balance IS 'BR balance from BR30 packages (1 BR = 1 hour)';
COMMENT ON TABLE public.package_history IS 'Tracks BR package assignments by admin';

-- Step 10: Final verification
SELECT
  'BR columns setup complete!' as status,
  COUNT(*) as total_users,
  SUM(br15_balance) as total_br15,
  SUM(br30_balance) as total_br30
FROM public.users;
