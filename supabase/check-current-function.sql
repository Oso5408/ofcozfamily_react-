-- Check the current check_room_availability function definition
SELECT
  proname AS function_name,
  pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname = 'check_room_availability';
