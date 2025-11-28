-- =============================================
-- DP20 Package Purchase Tracking System
-- =============================================
-- Tracks DP20 package purchases before admin confirmation
-- Admin can review receipts and assign packages from user management
-- =============================================

-- Create package_purchases table
CREATE TABLE IF NOT EXISTS public.package_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  package_type TEXT NOT NULL CHECK (package_type IN ('DP20', 'BR15', 'BR30')),

  -- Purchase details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'HKD',

  -- Customer info (captured at purchase time)
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,

  -- Receipt tracking
  receipt_url TEXT NOT NULL,
  receipt_uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  admin_notes TEXT,
  processed_by UUID REFERENCES public.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_package_purchases_user_id ON public.package_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_package_purchases_status ON public.package_purchases(status);
CREATE INDEX IF NOT EXISTS idx_package_purchases_created_at ON public.package_purchases(created_at DESC);

-- Add comments
COMMENT ON TABLE public.package_purchases IS 'Tracks package purchases awaiting admin confirmation';
COMMENT ON COLUMN public.package_purchases.status IS 'pending: awaiting review, approved: package assigned, rejected: declined, expired: payment expired';

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE public.package_purchases ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own purchases
CREATE POLICY "Users can view own purchases"
  ON public.package_purchases
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own purchases
CREATE POLICY "Users can create own purchases"
  ON public.package_purchases
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all purchases
CREATE POLICY "Admins can view all purchases"
  ON public.package_purchases
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policy: Admins can update all purchases
CREATE POLICY "Admins can update all purchases"
  ON public.package_purchases
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- =============================================
-- TRIGGER: Update updated_at timestamp
-- =============================================

CREATE OR REPLACE FUNCTION update_package_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_package_purchases_updated_at
  BEFORE UPDATE ON public.package_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_package_purchases_updated_at();

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function: Approve DP20 purchase and assign package
CREATE OR REPLACE FUNCTION approve_dp20_purchase(
  purchase_id UUID,
  admin_id UUID,
  notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  purchase_record RECORD;
BEGIN
  -- Get purchase details
  SELECT * INTO purchase_record
  FROM public.package_purchases
  WHERE id = purchase_id
  AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase not found or already processed';
  END IF;

  -- Verify admin permissions
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = admin_id AND is_admin = true) THEN
    RAISE EXCEPTION 'Admin authorization required';
  END IF;

  -- Assign DP20 package to user
  UPDATE public.users
  SET
    dp20_balance = 20,
    dp20_expiry = NOW() + INTERVAL '90 days'
  WHERE id = purchase_record.user_id;

  -- Record in package history
  INSERT INTO public.package_history (
    user_id,
    package_type,
    br_amount,
    assigned_by,
    reason
  ) VALUES (
    purchase_record.user_id,
    'DP20',
    20,
    admin_id,
    COALESCE(notes, 'DP20 package purchase approved - HK$' || purchase_record.amount)
  );

  -- Mark purchase as approved
  UPDATE public.package_purchases
  SET
    status = 'approved',
    admin_notes = notes,
    processed_by = admin_id,
    processed_at = NOW()
  WHERE id = purchase_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION approve_dp20_purchase IS 'Approve DP20 purchase: assign package to user and update status';

-- Function: Reject purchase
CREATE OR REPLACE FUNCTION reject_purchase(
  purchase_id UUID,
  admin_id UUID,
  rejection_reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verify admin permissions
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = admin_id AND is_admin = true) THEN
    RAISE EXCEPTION 'Admin authorization required';
  END IF;

  -- Mark purchase as rejected
  UPDATE public.package_purchases
  SET
    status = 'rejected',
    admin_notes = rejection_reason,
    processed_by = admin_id,
    processed_at = NOW()
  WHERE id = purchase_id
  AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase not found or already processed';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION reject_purchase IS 'Reject package purchase with reason';

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check table exists
SELECT
  '✅ package_purchases table created' AS status,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'package_purchases';

-- Check RLS is enabled
SELECT
  '✅ RLS enabled' AS status,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'package_purchases';

-- Check policies
SELECT
  '✅ RLS policies created' AS status,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'package_purchases';

SELECT '🎉 DP20 Purchase Tracking System migration complete!' AS status;
