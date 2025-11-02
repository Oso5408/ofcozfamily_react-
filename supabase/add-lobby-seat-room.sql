-- =============================================
-- ADD LOBBY SEAT ROOM FOR DP20 BOOKINGS
-- =============================================
-- This script adds the Lobby Seat room (ID: 9)
-- Used for One Day Pass bookings with DP20 packages
-- =============================================

-- Insert Lobby Seat room
INSERT INTO public.rooms (id, name, capacity, size, description, features, booking_options, prices, image_url, hidden, created_at, updated_at)
VALUES
  (
    9,
    'Lobby Seat',
    4,
    'N/A',
    'LobbySeatDescription',
    '["Open seating area", "Shared workspace", "WiFi access", "Cat-friendly environment"]'::JSONB,
    '["cash", "dp20"]'::JSONB,
    '{"cash": {"daily": 100}, "dp20": {"perVisit": 1}}'::JSONB,
    'Comfortable lobby seating with cat-friendly atmosphere',
    FALSE,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  capacity = EXCLUDED.capacity,
  size = EXCLUDED.size,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  booking_options = EXCLUDED.booking_options,
  prices = EXCLUDED.prices,
  image_url = EXCLUDED.image_url,
  hidden = EXCLUDED.hidden,
  updated_at = NOW();

-- Update sequence to ensure it's at least 9
SELECT setval('rooms_id_seq', GREATEST((SELECT MAX(id) FROM public.rooms), 9));

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check if Lobby Seat was added
SELECT
  '✅ Lobby Seat Added' AS status,
  id,
  name,
  capacity,
  booking_options,
  prices,
  hidden
FROM public.rooms
WHERE id = 9;

-- Show all rooms
SELECT
  '📊 All Rooms' AS info,
  id,
  name,
  capacity,
  hidden,
  booking_options
FROM public.rooms
ORDER BY id;

-- Summary
SELECT
  COUNT(*) as total_rooms,
  COUNT(*) FILTER (WHERE hidden = FALSE) as visible_rooms,
  COUNT(*) FILTER (WHERE hidden = TRUE) as hidden_rooms,
  COUNT(*) FILTER (WHERE booking_options @> '["dp20"]') as dp20_enabled_rooms
FROM public.rooms;
