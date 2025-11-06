-- =============================================
-- Add description_en and description_zh columns to rooms table
-- =============================================
-- This migration adds separate columns for English and Chinese descriptions
-- allowing admins to edit room descriptions in both languages
-- =============================================

-- Add description_en and description_zh columns
ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS description_zh TEXT;

-- Optional: Migrate existing description field to description_en if needed
-- UPDATE public.rooms SET description_en = description WHERE description_en IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rooms_description_en ON public.rooms(description_en);
CREATE INDEX IF NOT EXISTS idx_rooms_description_zh ON public.rooms(description_zh);

-- =============================================
-- VERIFICATION
-- =============================================
-- Check that columns were added successfully
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'rooms'
  AND column_name IN ('description_en', 'description_zh');
