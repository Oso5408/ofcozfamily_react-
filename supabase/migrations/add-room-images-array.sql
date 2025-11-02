-- =============================================
-- ADD MULTIPLE IMAGES SUPPORT FOR ROOMS
-- =============================================
-- This migration adds support for multiple images (max 3) per room
-- with visibility control

-- Add new column for multiple images with visibility flags
ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Example structure for images array:
-- [
--   {"url": "https://...", "visible": true, "order": 1},
--   {"url": "https://...", "visible": false, "order": 2},
--   {"url": "https://...", "visible": true, "order": 3}
-- ]

-- Migrate existing image_url to new images array
UPDATE public.rooms
SET images = CASE
  WHEN image_url IS NOT NULL AND image_url != '' THEN
    jsonb_build_array(
      jsonb_build_object(
        'url', image_url,
        'visible', true,
        'order', 1
      )
    )
  ELSE '[]'::jsonb
END
WHERE images = '[]'::jsonb;

-- Keep image_url for backward compatibility (use first visible image)
-- We'll update it via trigger

-- Create function to sync image_url with first visible image from images array
CREATE OR REPLACE FUNCTION sync_room_image_url()
RETURNS TRIGGER AS $$
BEGIN
  -- Set image_url to the first visible image's URL
  NEW.image_url := (
    SELECT (elem->>'url')
    FROM jsonb_array_elements(NEW.images) AS elem
    WHERE (elem->>'visible')::boolean = true
    ORDER BY (elem->>'order')::int
    LIMIT 1
  );

  -- If no visible images, set to NULL
  IF NEW.image_url IS NULL OR NEW.image_url = '' THEN
    NEW.image_url := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-sync image_url
DROP TRIGGER IF EXISTS sync_room_image_url_trigger ON public.rooms;
CREATE TRIGGER sync_room_image_url_trigger
  BEFORE INSERT OR UPDATE OF images ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION sync_room_image_url();

-- Add comment
COMMENT ON COLUMN public.rooms.images IS 'Array of room images with visibility flags. Max 3 images. Structure: [{"url": "...", "visible": boolean, "order": int}]';
