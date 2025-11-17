import { supabase, handleSupabaseError } from '@/lib/supabase';

/**
 * Audit Service
 * Handles all administrative audit logging for security and compliance
 */

export const auditService = {
  /**
   * Log an administrative action
   * @param {string} actionType - Type of action ('password_reset', 'role_change', 'user_delete', etc.)
   * @param {object} options - Additional details
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async logAction(actionType, options = {}) {
    try {
      const {
        targetUserId = null,
        targetBookingId = null,
        targetRoomId = null,
        details = {},
        ipAddress = null,
        userAgent = null
      } = options;

      // Get current admin user ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ Cannot log audit: No authenticated user');
        return { success: false, error: 'Not authenticated' };
      }

      // Insert audit log
      const { error } = await supabase
        .from('admin_audit_log')
        .insert({
          admin_id: user.id,
          action_type: actionType,
          target_user_id: targetUserId,
          target_booking_id: targetBookingId,
          target_room_id: targetRoomId,
          details: details,
          ip_address: ipAddress,
          user_agent: userAgent || navigator.userAgent
        });

      if (error) throw error;

      console.log('✅ Audit log created:', { actionType, targetUserId });
      return { success: true };
    } catch (error) {
      console.error('❌ Error logging audit action:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Log a password reset action
   */
  async logPasswordReset(targetUserId, details = {}) {
    return this.logAction('password_reset', {
      targetUserId,
      details: {
        ...details,
        timestamp: new Date().toISOString()
      }
    });
  },

  /**
   * Log a role change action
   */
  async logRoleChange(targetUserId, oldRole, newRole) {
    return this.logAction('role_change', {
      targetUserId,
      details: {
        old_role: oldRole,
        new_role: newRole,
        timestamp: new Date().toISOString()
      }
    });
  },

  /**
   * Log a user deletion action
   */
  async logUserDelete(targetUserId, userEmail) {
    return this.logAction('user_delete', {
      targetUserId,
      details: {
        user_email: userEmail,
        timestamp: new Date().toISOString()
      }
    });
  },

  /**
   * Log a user edit action
   */
  async logUserEdit(targetUserId, changes) {
    return this.logAction('user_edit', {
      targetUserId,
      details: {
        changes,
        timestamp: new Date().toISOString()
      }
    });
  },

  /**
   * Log a booking edit action
   */
  async logBookingEdit(bookingId, changes) {
    return this.logAction('booking_edit', {
      targetBookingId: bookingId,
      details: {
        changes,
        timestamp: new Date().toISOString()
      }
    });
  },

  /**
   * Log a booking cancellation action
   */
  async logBookingCancel(bookingId, reason) {
    return this.logAction('booking_cancel', {
      targetBookingId: bookingId,
      details: {
        reason,
        timestamp: new Date().toISOString()
      }
    });
  },

  /**
   * Log a room edit action
   */
  async logRoomEdit(roomId, changes) {
    return this.logAction('room_edit', {
      targetRoomId: roomId,
      details: {
        changes,
        timestamp: new Date().toISOString()
      }
    });
  },

  /**
   * Log a package add action
   */
  async logPackageAdd(targetUserId, packageType, amount) {
    return this.logAction('package_add', {
      targetUserId,
      details: {
        package_type: packageType,
        amount,
        timestamp: new Date().toISOString()
      }
    });
  },

  /**
   * Log a package deduct action
   */
  async logPackageDeduct(targetUserId, packageType, amount) {
    return this.logAction('package_deduct', {
      targetUserId,
      details: {
        package_type: packageType,
        amount,
        timestamp: new Date().toISOString()
      }
    });
  },

  /**
   * Check if password reset is rate limited
   * @param {string} targetUserId - User ID to check
   * @param {number} maxResets - Maximum resets allowed per hour (default: 3)
   * @returns {Promise<{allowed: boolean, count: number, error?: string}>}
   */
  async checkPasswordResetRateLimit(targetUserId, maxResets = 3) {
    try {
      const { data, error } = await supabase
        .rpc('get_recent_password_resets', {
          p_target_user_id: targetUserId,
          p_hours: 1
        });

      if (error) throw error;

      const resetCount = data || 0;
      const allowed = resetCount < maxResets;

      console.log('🔒 Rate limit check:', { userId: targetUserId, count: resetCount, allowed });

      return {
        allowed,
        count: resetCount,
        remaining: Math.max(0, maxResets - resetCount)
      };
    } catch (error) {
      console.error('❌ Error checking rate limit:', error);
      // On error, allow the action (fail open for better UX)
      return { allowed: true, count: 0, error: handleSupabaseError(error) };
    }
  },

  /**
   * Get audit logs with pagination
   * @param {object} options - Query options
   * @returns {Promise<{success: boolean, logs?: array, error?: string}>}
   */
  async getAuditLogs(options = {}) {
    try {
      const {
        actionType = null,
        targetUserId = null,
        limit = 50,
        offset = 0
      } = options;

      let query = supabase
        .from('admin_audit_log_with_details')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (actionType) {
        query = query.eq('action_type', actionType);
      }

      if (targetUserId) {
        query = query.eq('target_user_id', targetUserId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, logs: data || [] };
    } catch (error) {
      console.error('❌ Error fetching audit logs:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(userId, limit = 20) {
    return this.getAuditLogs({ targetUserId: userId, limit });
  },

  /**
   * Get recent audit logs (last 24 hours)
   */
  async getRecentAuditLogs(limit = 50) {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('admin_audit_log_with_details')
        .select('*')
        .gte('created_at', oneDayAgo)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, logs: data || [] };
    } catch (error) {
      console.error('❌ Error fetching recent audit logs:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }
};
