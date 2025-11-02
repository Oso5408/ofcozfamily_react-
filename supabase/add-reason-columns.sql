-- =============================================
-- ADD REASON COLUMNS TO HISTORY TABLES
-- =============================================
-- This migration adds a 'reason' column to token_history and package_history
-- tables to track why tokens or BR packages were added/removed
--
-- Run this in your Supabase SQL Editor
-- =============================================

-- Add reason column to token_history table
ALTER TABLE public.token_history
ADD COLUMN IF NOT EXISTS reason TEXT;

-- Add comment
COMMENT ON COLUMN public.token_history.reason IS 'Admin-provided reason for token adjustment (e.g., Promotion, Compensation, Purchase)';

-- Add reason column to package_history table
ALTER TABLE public.package_history
ADD COLUMN IF NOT EXISTS reason TEXT;

-- Add comment
COMMENT ON COLUMN public.package_history.reason IS 'Admin-provided reason for package assignment (e.g., Purchase, Promotion, Gift)';

-- Verify columns were added
SELECT
  '✅ Columns added successfully!' AS status,
  'token_history' AS table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'token_history' AND column_name = 'reason'

UNION ALL

SELECT
  '✅ Columns added successfully!' AS status,
  'package_history' AS table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'package_history' AND column_name = 'reason';

-- Sample query to view recent records with reasons
SELECT
  '📊 Recent Token History (with reasons):' AS info,
  th.id,
  u.email,
  th.change,
  th.new_balance,
  th.transaction_type,
  th.reason,
  th.created_at
FROM token_history th
JOIN users u ON th.user_id = u.id
ORDER BY th.created_at DESC
LIMIT 5;

SELECT
  '📊 Recent Package History (with reasons):' AS info,
  ph.id,
  u.email,
  ph.package_type,
  ph.br_amount,
  ph.reason,
  ph.created_at
FROM package_history ph
JOIN users u ON ph.user_id = u.id
ORDER BY ph.created_at DESC
LIMIT 5;
