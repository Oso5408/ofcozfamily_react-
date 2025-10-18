-- Cat Cafe Booking System Database Schema
-- This file contains the complete database schema for the booking system
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable btree_gist extension for exclusion constraints
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- =============================================
-- USERS TABLE (extends Supabase auth.users)
-- =============================================
CREATE TABLE public.users (
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

-- =============================================
-- ROOMS TABLE
-- =============================================
CREATE TABLE public.rooms (
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

-- =============================================
-- BOOKINGS TABLE
-- =============================================
CREATE TABLE public.bookings (
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraint to prevent overlapping bookings for the same room
  CONSTRAINT no_overlapping_bookings EXCLUDE USING GIST (
    room_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
  ) WHERE (status NOT IN ('cancelled'))
);

-- =============================================
-- TOKEN HISTORY TABLE
-- =============================================
CREATE TABLE public.token_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  change INTEGER NOT NULL,
  new_balance INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('top-up', 'usage', 'deduction', 'refund')),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =============================================
-- PRODUCTS TABLE
-- =============================================
CREATE TABLE public.products (
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

-- =============================================
-- ORDERS TABLE
-- =============================================
CREATE TABLE public.orders (
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

-- =============================================
-- ORDER ITEMS TABLE
-- =============================================
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_room_id ON public.bookings(room_id);
CREATE INDEX idx_bookings_start_time ON public.bookings(start_time);
CREATE INDEX idx_bookings_end_time ON public.bookings(end_time);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_token_history_user_id ON public.token_history(user_id);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_is_active ON public.products(is_active);

-- =============================================
-- FUNCTIONS FOR AUTOMATIC UPDATES
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- USERS policies
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ROOMS policies
CREATE POLICY "Anyone can view non-hidden rooms" ON public.rooms
  FOR SELECT USING (hidden = FALSE OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Only admins can manage rooms" ON public.rooms
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- BOOKINGS policies
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Admins can manage all bookings" ON public.bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- TOKEN HISTORY policies
CREATE POLICY "Users can view their own token history" ON public.token_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all token history" ON public.token_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "System can create token history" ON public.token_history
  FOR INSERT WITH CHECK (TRUE);

-- PRODUCTS policies
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = TRUE OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Only admins can manage products" ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ORDERS policies
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ORDER ITEMS policies
CREATE POLICY "Users can view their order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create their order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can view all order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

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

CREATE TRIGGER deduct_tokens_on_booking AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION deduct_tokens_for_booking();
