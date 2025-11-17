-- Admin Audit Log Table
-- Tracks all administrative actions for security and compliance

-- Create admin_audit_log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'password_reset',
    'role_change',
    'user_delete',
    'user_edit',
    'booking_edit',
    'booking_cancel',
    'room_edit',
    'package_add',
    'package_deduct'
  )),
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  target_room_id INTEGER REFERENCES public.rooms(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action_type ON public.admin_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target_user_id ON public.admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);

-- Add RLS policies
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can insert audit logs
CREATE POLICY "Admins can create audit logs"
  ON public.admin_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
  ON public.admin_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Create view for easy audit log reading with user details
CREATE OR REPLACE VIEW admin_audit_log_with_details AS
SELECT
  aal.id,
  aal.action_type,
  aal.created_at,
  aal.details,
  aal.ip_address,
  -- Admin who performed the action
  admin_users.email AS admin_email,
  admin_users.full_name AS admin_name,
  -- Target user (if applicable)
  target_users.email AS target_user_email,
  target_users.full_name AS target_user_name,
  -- Target booking (if applicable)
  aal.target_booking_id,
  -- Target room (if applicable)
  rooms.name AS target_room_name
FROM public.admin_audit_log aal
LEFT JOIN public.users admin_users ON aal.admin_id = admin_users.id
LEFT JOIN public.users target_users ON aal.target_user_id = target_users.id
LEFT JOIN public.rooms ON aal.target_room_id = rooms.id
ORDER BY aal.created_at DESC;

-- Grant access to view for admins
GRANT SELECT ON admin_audit_log_with_details TO authenticated;

-- Create function to get recent password reset attempts (for rate limiting)
CREATE OR REPLACE FUNCTION get_recent_password_resets(
  p_target_user_id UUID,
  p_hours INTEGER DEFAULT 1
)
RETURNS INTEGER AS $$
DECLARE
  reset_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO reset_count
  FROM public.admin_audit_log
  WHERE action_type = 'password_reset'
    AND target_user_id = p_target_user_id
    AND created_at > (NOW() - (p_hours || ' hours')::INTERVAL);

  RETURN reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up old audit logs (optional, run monthly)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM public.admin_audit_log
    WHERE created_at < (NOW() - (days_to_keep || ' days')::INTERVAL)
    RETURNING *
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.admin_audit_log IS 'Audit trail for all administrative actions (password resets, role changes, deletions, etc.)';
COMMENT ON FUNCTION get_recent_password_resets IS 'Returns count of password reset attempts for a user in the last N hours (for rate limiting)';
COMMENT ON FUNCTION cleanup_old_audit_logs IS 'Deletes audit logs older than specified days (default: 365 days, 1 year retention)';
