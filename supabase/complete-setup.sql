-- =============================================
-- Cat Cafe Booking System - COMPLETE DATABASE SETUP
-- =============================================
-- This script sets up everything needed for registration to work
-- Run this ONCE in your Supabase SQL Editor
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- =============================================
-- STEP 1: CREATE TABLES
-- =============================================

-- USERS TABLE (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  tokens INTEGER DEFAULT 0 NOT NULL,
  token_valid_until TIMESTAMP WITH TIME ZONE,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ROOMS TABLE
CREATE TABLE IF NOT EXISTS public.rooms (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  capacity INTEGER NOT NULL,
  size TEXT,
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  booking_options JSONB DEFAULT '["token", "cash"]'::jsonb,
  prices JSONB NOT NULL,
  image_url TEXT,
  hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  room_id INTEGER NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  booking_type TEXT NOT NULL CHECK (booking_type IN ('hourly', 'daily', 'monthly')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('token', 'cash')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'cancelled', 'refunded')),
  total_cost DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no-show')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add constraint to prevent overlapping bookings (only if doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_bookings'
  ) THEN
    ALTER TABLE public.bookings ADD CONSTRAINT no_overlapping_bookings
    EXCLUDE USING GIST (
      room_id WITH =,
      tstzrange(start_time, end_time, '[)') WITH &&
    ) WHERE (status NOT IN ('cancelled'));
  END IF;
END $$;

-- TOKEN HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.token_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  change INTEGER NOT NULL,
  new_balance INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('top-up', 'usage', 'deduction', 'refund')),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_zh TEXT,
  description TEXT,
  description_zh TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT,
  stock_quantity INTEGER DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  shipping_address JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =============================================
-- STEP 2: CREATE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON public.bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON public.bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_end_time ON public.bookings(end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_token_history_user_id ON public.token_history(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- =============================================
-- STEP 3: CREATE FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rooms_updated_at ON public.rooms;
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check room availability
CREATE OR REPLACE FUNCTION check_room_availability(
  p_room_id INTEGER,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO conflict_count
  FROM public.bookings
  WHERE room_id = p_room_id
    AND status NOT IN ('cancelled')
    AND (id IS DISTINCT FROM p_exclude_booking_id)
    AND tstzrange(start_time, end_time) && tstzrange(p_start_time, p_end_time);

  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to deduct tokens for booking
CREATE OR REPLACE FUNCTION deduct_tokens_for_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_method = 'token' AND NEW.payment_status = 'completed' THEN
    -- Update user tokens
    UPDATE public.users
    SET tokens = tokens - NEW.total_cost
    WHERE id = NEW.user_id;

    -- Create token history record
    INSERT INTO public.token_history (user_id, change, new_balance, transaction_type, booking_id)
    SELECT
      NEW.user_id,
      -NEW.total_cost,
      tokens,
      'usage',
      NEW.id
    FROM public.users
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS deduct_tokens_on_booking ON public.bookings;
CREATE TRIGGER deduct_tokens_on_booking AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION deduct_tokens_for_booking();

-- =============================================
-- STEP 4: CREATE AUTO-REGISTRATION TRIGGER
-- This is CRITICAL for registration to work!
-- =============================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone, tokens, is_admin, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    0,
    FALSE,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users to automatically create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 6: CREATE SECURITY POLICIES
-- =============================================

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Anyone can view non-hidden rooms" ON public.rooms;
DROP POLICY IF EXISTS "Authenticated users can view all rooms" ON public.rooms;
DROP POLICY IF EXISTS "Authenticated users can manage rooms" ON public.rooms;
DROP POLICY IF EXISTS "Only admins can manage rooms" ON public.rooms;
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view their own token history" ON public.token_history;
DROP POLICY IF EXISTS "System can create token history" ON public.token_history;
DROP POLICY IF EXISTS "Enable read for authenticated users on token_history" ON public.token_history;
DROP POLICY IF EXISTS "Admins can view all token history" ON public.token_history;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;
DROP POLICY IF EXISTS "Only admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Enable read for authenticated users on orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can create their order items" ON public.order_items;
DROP POLICY IF EXISTS "Enable read for authenticated users on order_items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;

-- USERS POLICIES
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable read access for authenticated users" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

-- ROOMS POLICIES
CREATE POLICY "Anyone can view non-hidden rooms" ON public.rooms
  FOR SELECT USING (hidden = FALSE);

CREATE POLICY "Authenticated users can view all rooms" ON public.rooms
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage rooms" ON public.rooms
  FOR ALL USING (auth.role() = 'authenticated');

-- BOOKINGS POLICIES
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable read for authenticated users" ON public.bookings
  FOR SELECT USING (auth.role() = 'authenticated');

-- TOKEN HISTORY POLICIES
CREATE POLICY "Users can view their own token history" ON public.token_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create token history" ON public.token_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read for authenticated users on token_history" ON public.token_history
  FOR SELECT USING (auth.role() = 'authenticated');

-- PRODUCTS POLICIES
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Authenticated users can manage products" ON public.products
  FOR ALL USING (auth.role() = 'authenticated');

-- ORDERS POLICIES
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable read for authenticated users on orders" ON public.orders
  FOR SELECT USING (auth.role() = 'authenticated');

-- ORDER ITEMS POLICIES
CREATE POLICY "Users can view their order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create their order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
  );

CREATE POLICY "Enable read for authenticated users on order_items" ON public.order_items
  FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================
-- SETUP COMPLETE!
-- =============================================
-- Your database is now ready for user registration
-- Users will be automatically created in public.users when they sign up via auth
