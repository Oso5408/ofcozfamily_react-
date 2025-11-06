-- =============================================
-- Update Lobby Seat (room 9) to Day Pass
-- =============================================
-- This migration updates the room name from "Lobby Seat" to "Day Pass"
-- and updates the capacity from 4 to 1
-- =============================================

UPDATE public.rooms
SET 
  name = 'Day Pass',
  capacity = 1,
  description = 'DayPassDescription'
WHERE id = 9;

-- Verify the update
SELECT id, name, capacity, description
FROM public.rooms
WHERE id = 9;
