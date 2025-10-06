-- =============================================
-- SEED ROOMS DATA
-- =============================================
-- This script inserts rooms A through H into the rooms table
-- Room G is set as hidden by default (requires admin to make visible)

-- Clear existing rooms (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE public.rooms RESTART IDENTITY CASCADE;

-- Insert rooms A through H
INSERT INTO public.rooms (id, name, capacity, size, description, features, booking_options, prices, image_url, hidden, created_at, updated_at)
VALUES
  -- Room A (ID: 8)
  (
    8,
    'Room A',
    6,
    '約60尺',
    'RoomADescription',
    '["Cat-friendly furniture", "Scratching posts", "Toy basket", "TV"]'::JSONB,
    '["token", "cash"]'::JSONB,
    '{"token": 1, "cash": {"hourly": 120, "daily": 600, "monthly": 5000}}'::JSONB,
    'Cozy workspace for six with essential cat-friendly features and a TV',
    FALSE,
    NOW(),
    NOW()
  ),

  -- Room B (ID: 1)
  (
    1,
    'Room B',
    6,
    '約70尺',
    'RoomBDescription',
    '["Spacious living area", "Cat climbing tree", "Premium bedding"]'::JSONB,
    '["token", "cash"]'::JSONB,
    '{"token": 1, "cash": {"hourly": 120, "daily": 600, "monthly": 5000}}'::JSONB,
    'Spacious room for six with modern cat-friendly amenities',
    FALSE,
    NOW(),
    NOW()
  ),

  -- Room C (ID: 2)
  (
    2,
    'Room C',
    4,
    '約60-90尺',
    'RoomCDescription',
    '["Spacious living area", "Cat climbing tree", "Premium bedding", "TV"]'::JSONB,
    '["cash"]'::JSONB,
    '{"cash": {"hourly": 150, "daily": 800, "monthly": 6000}}'::JSONB,
    'Luxurious suite with elegant cat-themed interior design and a TV',
    FALSE,
    NOW(),
    NOW()
  ),

  -- Room D (ID: 3)
  (
    3,
    'Room D',
    7,
    '約60尺',
    'RoomDDescription',
    '["Garden view", "Cat balcony", "Meditation corner"]'::JSONB,
    '["token", "cash"]'::JSONB,
    '{"token": 1, "cash": {"hourly": 120, "daily": 600, "monthly": 5000}}'::JSONB,
    'Peaceful room for seven with garden view and cat-friendly amenities',
    FALSE,
    NOW(),
    NOW()
  ),

  -- Room E (ID: 4)
  (
    4,
    'Room E',
    6,
    '約60尺',
    'RoomEDescription',
    '["Themed decor", "Interactive cat toys", "Cozy reading nook", "TV"]'::JSONB,
    '["token", "cash"]'::JSONB,
    '{"token": 1, "cash": {"hourly": 120, "daily": 600, "monthly": 5000}}'::JSONB,
    'Whimsical room for six with playful cat-themed decorations and a TV',
    FALSE,
    NOW(),
    NOW()
  ),

  -- Room F (ID: 5)
  (
    5,
    'Room F',
    4,
    '約60-80尺',
    'RoomFDescription',
    '["Premium bedding", "Cat climbing tree", "Garden view", "TV"]'::JSONB,
    '["token", "cash"]'::JSONB,
    '{"token": 1, "cash": {"hourly": 120, "daily": 600, "monthly": 5000}}'::JSONB,
    'Comfortable room with modern amenities and a TV',
    FALSE,
    NOW(),
    NOW()
  ),

  -- Room G (ID: 6, Hidden - requires admin manual control)
  (
    6,
    'Room G',
    4,
    '約60-80尺',
    'RoomGDescription',
    '["Cat balcony", "Meditation corner", "Interactive cat toys", "TV"]'::JSONB,
    '["token", "cash"]'::JSONB,
    '{"token": 1, "cash": {"hourly": 120, "daily": 600, "monthly": 5000}}'::JSONB,
    'Serene room with peaceful atmosphere and a TV',
    TRUE,
    NOW(),
    NOW()
  ),

  -- Room H (ID: 7)
  (
    7,
    'Room H',
    6,
    '約60尺',
    'RoomHDescription',
    '["Spacious living area", "Themed decor", "Cozy reading nook"]'::JSONB,
    '["token", "cash"]'::JSONB,
    '{"token": 1, "cash": {"hourly": 120, "daily": 600, "monthly": 5000}}'::JSONB,
    'Large family-friendly room for six with cat amenities',
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

-- Update sequence to match the highest ID
SELECT setval('rooms_id_seq', (SELECT MAX(id) FROM public.rooms));

-- Verify the insertion
SELECT id, name, capacity, hidden FROM public.rooms ORDER BY id;

-- Summary
SELECT
  COUNT(*) as total_rooms,
  COUNT(*) FILTER (WHERE hidden = FALSE) as visible_rooms,
  COUNT(*) FILTER (WHERE hidden = TRUE) as hidden_rooms
FROM public.rooms;
