import { supabase } from '@/lib/supabase';

/**
 * Cancellation Policy Service
 *
 * Policy Rules:
 * - >48 hours before booking: Free for first 3 cancellations/month
 * - <48 hours before booking: Free for first 1 cancellation/month
 * - Combined limit: Max 3 free cancellations total per month
 * - Additional cancellations beyond limits: 1 token deducted each
 * - No-show: No refund, no cancellation allowed
 */

const cancellationPolicyService = {
  /**
   * Get user's cancellations for a specific month
   */
  async getUserMonthlyCancellations(userId, monthYear = null) {
    console.log('📊 Getting monthly cancellations for user:', userId);

    // Default to current month if not specified
    if (!monthYear) {
      const now = new Date();
      monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    try {
      const { data, error } = await supabase
        .from('cancellation_history')
        .select('*')
        .eq('user_id', userId)
        .eq('month_year', monthYear)
        .order('cancelled_at', { ascending: false });

      if (error) throw error;

      console.log('✅ Found', data?.length || 0, 'cancellations for', monthYear);

      return {
        success: true,
        cancellations: data || [],
        total: data?.length || 0,
        totalWithoutToken: data?.filter(c => !c.token_deducted).length || 0,
        moreThan48h: data?.filter(c => c.hours_before_booking >= 48).length || 0,
        lessThan48h: data?.filter(c => c.hours_before_booking < 48).length || 0,
      };
    } catch (error) {
      console.error('❌ Error getting monthly cancellations:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Calculate hours between now and booking start time
   */
  calculateHoursBeforeBooking(bookingStartTime) {
    const now = new Date();
    const bookingStart = new Date(bookingStartTime);
    const diffMs = bookingStart - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    console.log('⏰ Hours before booking:', diffHours);
    return diffHours;
  },

  /**
   * Determine if token should be deducted based on policy
   */
  async shouldDeductToken(userId, hoursBeforeBooking, monthYear = null) {
    console.log('💰 Checking if token should be deducted...');
    console.log('💰 Hours before booking:', hoursBeforeBooking);

    // Get current month's cancellations
    const result = await this.getUserMonthlyCancellations(userId, monthYear);

    if (!result.success) {
      return { shouldDeduct: false, error: result.error };
    }

    const { moreThan48h, lessThan48h, totalWithoutToken } = result;

    console.log('📊 Current month stats:', { moreThan48h, lessThan48h, totalWithoutToken });

    // Policy logic
    let shouldDeduct = false;
    let reason = '';

    if (hoursBeforeBooking >= 48) {
      // More than 48 hours before
      // Free for first 3 total cancellations in month
      if (totalWithoutToken >= 3) {
        shouldDeduct = true;
        reason = 'Exceeded 3 free cancellations per month';
      } else {
        reason = 'Within 3 free cancellations per month (>48h)';
      }
    } else if (hoursBeforeBooking >= 0) {
      // Less than 48 hours before (but not past booking time)
      // Free for first 1 cancellation <48h, OR if total free cancellations < 3
      if (lessThan48h >= 1 || totalWithoutToken >= 3) {
        shouldDeduct = true;
        reason = 'Exceeded 1 free <48h cancellation or 3 total free cancellations';
      } else {
        reason = 'Within free cancellation limits (<48h)';
      }
    } else {
      // Past booking time (no-show)
      shouldDeduct = true;
      reason = 'Cannot cancel past booking time (no-show)';
    }

    console.log('💰 Result:', { shouldDeduct, reason });

    return {
      shouldDeduct,
      reason,
      currentStats: {
        moreThan48h,
        lessThan48h,
        totalWithoutToken,
        freeCancellationsRemaining: Math.max(0, 3 - totalWithoutToken)
      }
    };
  },

  /**
   * Check if user has enough tokens for cancellation
   */
  async hasEnoughTokens(userId, requiredTokens = 1) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('tokens')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const hasTokens = (data?.tokens || 0) >= requiredTokens;
      console.log('🪙 User tokens:', data?.tokens, '| Required:', requiredTokens, '| Has enough:', hasTokens);

      return { success: true, hasTokens, currentTokens: data?.tokens || 0 };
    } catch (error) {
      console.error('❌ Error checking tokens:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get cancellation policy info for display
   */
  getCancellationPolicyInfo(hoursBeforeBooking) {
    if (hoursBeforeBooking < 0) {
      return {
        canCancel: false,
        type: 'past',
        message: 'Cannot cancel booking after start time (no-show policy applies)',
        willDeductToken: false
      };
    } else if (hoursBeforeBooking >= 48) {
      return {
        canCancel: true,
        type: 'early',
        message: 'Cancellation more than 48 hours in advance',
        policyLimit: '3 free cancellations per month',
        willDeductToken: false // Will be determined by current month's history
      };
    } else {
      return {
        canCancel: true,
        type: 'late',
        message: 'Cancellation less than 48 hours in advance',
        policyLimit: '1 free cancellation per month (or 3 total free cancellations)',
        willDeductToken: false // Will be determined by current month's history
      };
    }
  },

  /**
   * Format policy summary for user
   */
  formatPolicySummary(language = 'en') {
    const policies = {
      en: {
        title: 'Cancellation Policy',
        rules: [
          'If cancellation is made more than 48 hours in advance: Free for up to 3 cancellations per month',
          'If cancellation is made less than 48 hours in advance: Free for 1 cancellation per month',
          'Combined limit: Maximum 3 free cancellations per month',
          'Additional cancellations: 1 token will be deducted',
          'No-show: No refund, please cancel through the system'
        ]
      },
      zh: {
        title: '取消政策',
        rules: [
          '提前48小時以上取消：每月最多可免費取消3次',
          '提前48小時內取消：每月最多可免費取消1次',
          '合計限制：每月最多3次免費取消',
          '超出免費次數：每次取消扣除1個代幣',
          '未出席：不予退款，請透過系統取消'
        ]
      }
    };

    return policies[language] || policies.en;
  }
};

export default cancellationPolicyService;
