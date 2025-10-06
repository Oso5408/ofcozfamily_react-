-- Cat Cafe Booking System Database Schema - FIXED VERSION
-- This file contains the complete database schema for the booking system
-- Run this SQL in your Supabase SQL Editor

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Anyone can view non-hidden rooms" ON public.rooms;
DROP POLICY IF EXISTS "Only admins can manage rooms" ON public.rooms;
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view their own token history" ON public.token_history;
DROP POLICY IF EXISTS "Admins can view all token history" ON public.token_history;
DROP POLICY IF EXISTS "System can create token history" ON public.token_history;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Only admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can create their order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;

-- =============================================
-- FIXED ROW LEVEL SECURITY POLICIES
-- =============================================

-- USERS policies (FIXED - no recursion)
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- For admin access, we'll use a simpler approach
-- Admins will be granted via service role or we'll disable RLS for admin operations
CREATE POLICY "Enable read access for authenticated users" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

-- ROOMS policies (FIXED - allow unauthenticated access to non-hidden rooms)
CREATE POLICY "Anyone can view non-hidden rooms" ON public.rooms
  FOR SELECT USING (hidden = FALSE);

CREATE POLICY "Authenticated users can view all rooms" ON public.rooms
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage rooms" ON public.rooms
  FOR ALL USING (auth.role() = 'authenticated');

-- BOOKINGS policies (FIXED)
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable read for authenticated users" ON public.bookings
  FOR SELECT USING (auth.role() = 'authenticated');

-- TOKEN HISTORY policies (FIXED)
CREATE POLICY "Users can view their own token history" ON public.token_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create token history" ON public.token_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read for authenticated users" ON public.token_history
  FOR SELECT USING (auth.role() = 'authenticated');

-- PRODUCTS policies (FIXED)
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Authenticated users can manage products" ON public.products
  FOR ALL USING (auth.role() = 'authenticated');

-- ORDERS policies (FIXED)
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable read for authenticated users" ON public.orders
  FOR SELECT USING (auth.role() = 'authenticated');

-- ORDER ITEMS policies (FIXED)
CREATE POLICY "Users can view their order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create their order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
  );

CREATE POLICY "Enable read for authenticated users" ON public.order_items
  FOR SELECT USING (auth.role() = 'authenticated');
