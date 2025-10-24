-- =============================================
-- BR Package System Migration
-- =============================================
-- Adds BR15 and BR30 package balances to users
-- Creates package_history table for tracking
-- =============================================

-- Add BR balance columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS br15_balance INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS br30_balance INTEGER DEFAULT 0 NOT NULL;

-- Create package_history table
CREATE TABLE IF NOT EXISTS public.package_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  package_type TEXT NOT NULL CHECK (package_type IN ('BR15', 'BR30')),
  br_amount INTEGER NOT NULL,
  assigned_by UUID REFERENCES public.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_package_history_user_id ON public.package_history(user_id);
CREATE INDEX IF NOT EXISTS idx_package_history_created_at ON public.package_history(created_at DESC);

-- Enable RLS on package_history
ALTER TABLE public.package_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for package_history
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

-- Update updated_at trigger for users table (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment on columns for documentation
COMMENT ON COLUMN public.users.br15_balance IS 'BR balance from BR15 packages (1 BR = 1 hour)';
COMMENT ON COLUMN public.users.br30_balance IS 'BR balance from BR30 packages (1 BR = 1 hour)';
COMMENT ON TABLE public.package_history IS 'Tracks BR package assignments by admin';
