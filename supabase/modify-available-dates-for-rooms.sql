-- =============================================
-- Modify Available Dates for Room-Specific Availability
-- =============================================
-- This migration adds room-specific date availability
-- Allows opening dates for specific rooms OR all rooms (system-wide)
--
-- Logic:
-- - room_id IS NULL → Date available for ALL rooms (system-wide)
-- - room_id = X → Date available ONLY for room X
-- =============================================

-- Step 1: Drop existing unique constraint (available_date must be unique)
ALTER TABLE public.available_dates DROP CONSTRAINT IF EXISTS available_dates_available_date_key;

-- Step 2: Add room_id column (nullable, allows NULL for "all rooms")
ALTER TABLE public.available_dates
ADD COLUMN IF NOT EXISTS room_id INTEGER REFERENCES public.rooms(id) ON DELETE CASCADE;

-- Step 3: Add composite unique constraint (date + room combination must be unique)
-- This prevents duplicate entries like: (2025-09-09, room_id=5) appearing twice
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_date_room'
  ) THEN
    ALTER TABLE public.available_dates
    ADD CONSTRAINT unique_date_room UNIQUE (available_date, room_id);
  END IF;
END $$;

-- Step 4: Add index for fast room-specific lookups
CREATE INDEX IF NOT EXISTS idx_available_dates_room_id ON public.available_dates(room_id);

-- Step 5: Add index for fast date + room lookups
CREATE INDEX IF NOT EXISTS idx_available_dates_date_room ON public.available_dates(available_date, room_id);

-- Step 6: Update RLS policies (no changes needed - existing policies still work)
-- Anyone can still view available dates
-- Admins can still insert/delete available dates

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Available dates table modified for room-specific availability';
  RAISE NOTICE '✅ Added room_id column (nullable)';
  RAISE NOTICE '✅ Added composite unique constraint (available_date, room_id)';
  RAISE NOTICE '✅ Added indexes for fast queries';
  RAISE NOTICE '📘 Logic: room_id IS NULL = all rooms, room_id = X = specific room only';
  RAISE NOTICE '⚠️  Existing data: All current available dates now apply to ALL rooms (room_id = NULL)';
END $$;
