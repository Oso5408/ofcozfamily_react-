-- Add cancellation tracking columns to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS cancellation_hours_before INTEGER,
ADD COLUMN IF NOT EXISTS token_deducted_for_cancellation BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Create cancellation_history table for tracking monthly cancellations
CREATE TABLE IF NOT EXISTS public.cancellation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  cancelled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  hours_before_booking INTEGER NOT NULL,
  token_deducted BOOLEAN DEFAULT FALSE,
  month_year TEXT NOT NULL, -- Format: 'YYYY-MM'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_cancellation_history_user_month
ON public.cancellation_history(user_id, month_year);

-- Enable RLS on cancellation_history
ALTER TABLE public.cancellation_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own cancellation history
CREATE POLICY "Users can view own cancellation history"
ON public.cancellation_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own cancellation history
CREATE POLICY "Users can insert own cancellation history"
ON public.cancellation_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Admins can view all cancellation history
CREATE POLICY "Admins can view all cancellation history"
ON public.cancellation_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Function to automatically create cancellation history when booking is cancelled
CREATE OR REPLACE FUNCTION create_cancellation_history()
RETURNS TRIGGER AS $$
DECLARE
  booking_start TIMESTAMP WITH TIME ZONE;
  hours_diff INTEGER;
  month_year_str TEXT;
BEGIN
  -- Only proceed if status changed to 'cancelled'
  IF NEW.status = 'cancelled' AND (OLD.status IS NULL OR OLD.status != 'cancelled') THEN

    -- Get booking start time
    booking_start := NEW.start_time;

    -- Calculate hours between cancellation and booking
    hours_diff := EXTRACT(EPOCH FROM (booking_start - NEW.cancelled_at)) / 3600;

    -- Get month-year string
    month_year_str := TO_CHAR(NEW.cancelled_at, 'YYYY-MM');

    -- Insert into cancellation history
    INSERT INTO public.cancellation_history (
      user_id,
      booking_id,
      cancelled_at,
      hours_before_booking,
      token_deducted,
      month_year
    ) VALUES (
      NEW.user_id,
      NEW.id,
      NEW.cancelled_at,
      hours_diff,
      NEW.token_deducted_for_cancellation,
      month_year_str
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_create_cancellation_history ON public.bookings;
CREATE TRIGGER trigger_create_cancellation_history
AFTER UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION create_cancellation_history();

-- Comments for documentation
COMMENT ON TABLE public.cancellation_history IS 'Tracks user cancellations per month for policy enforcement';
COMMENT ON COLUMN public.bookings.cancelled_at IS 'Timestamp when booking was cancelled';
COMMENT ON COLUMN public.bookings.cancellation_hours_before IS 'Hours between cancellation and booking start time';
COMMENT ON COLUMN public.bookings.token_deducted_for_cancellation IS 'Whether a token was deducted for this cancellation';
