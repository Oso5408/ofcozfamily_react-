-- Temporary: Disable RLS for migration
-- Run this BEFORE migrating data

ALTER TABLE public.rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- After migration is complete, run the commands below to re-enable RLS
-- ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.token_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
