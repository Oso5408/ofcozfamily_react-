import { supabase } from '@/lib/supabase';

/**
 * Package Purchase Service
 * Handles DP20 and other package purchases before admin confirmation
 */

export const packagePurchaseService = {
  /**
   * Create a new package purchase record
   * @param {Object} purchaseData - Purchase details
   * @param {string} purchaseData.packageType - 'DP20', 'BR15', or 'BR30'
   * @param {number} purchaseData.amount - Purchase amount
   * @param {string} purchaseData.customerName - Customer name
   * @param {string} purchaseData.customerEmail - Customer email
   * @param {string} purchaseData.customerPhone - Customer phone
   * @param {string} purchaseData.receiptUrl - Receipt storage URL
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async createPurchase(purchaseData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('package_purchases')
        .insert({
          user_id: user.id,
          package_type: purchaseData.packageType,
          amount: purchaseData.amount,
          currency: 'HKD',
          customer_name: purchaseData.customerName,
          customer_email: purchaseData.customerEmail,
          customer_phone: purchaseData.customerPhone,
          receipt_url: purchaseData.receiptUrl,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating package purchase:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Package purchase created:', data.id);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Exception in createPurchase:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all purchases for current user
   * @returns {Promise<{success: boolean, purchases?: array, error?: string}>}
   */
  async getUserPurchases() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('package_purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching user purchases:', error);
        return { success: false, error: error.message };
      }

      return { success: true, purchases: data };
    } catch (error) {
      console.error('❌ Exception in getUserPurchases:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all pending purchases (admin only)
   * @returns {Promise<{success: boolean, purchases?: array, error?: string}>}
   */
  async getPendingPurchases() {
    try {
      const { data, error } = await supabase
        .from('package_purchases')
        .select(`
          *,
          users:user_id (
            id,
            email,
            full_name,
            phone
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching pending purchases:', error);
        return { success: false, error: error.message };
      }

      return { success: true, purchases: data };
    } catch (error) {
      console.error('❌ Exception in getPendingPurchases:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all purchases with filters (admin only)
   * @param {Object} filters - Filter options
   * @param {string} filters.status - Filter by status ('pending', 'approved', 'rejected')
   * @param {string} filters.packageType - Filter by package type
   * @returns {Promise<{success: boolean, purchases?: array, error?: string}>}
   */
  async getAllPurchases(filters = {}) {
    try {
      let query = supabase
        .from('package_purchases')
        .select(`
          *,
          users:user_id (
            id,
            email,
            full_name,
            phone
          ),
          processed_by_user:processed_by (
            id,
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.packageType) {
        query = query.eq('package_type', filters.packageType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching all purchases:', error);
        return { success: false, error: error.message };
      }

      return { success: true, purchases: data };
    } catch (error) {
      console.error('❌ Exception in getAllPurchases:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Approve DP20 purchase and assign package to user
   * @param {string} purchaseId - Purchase ID
   * @param {string} adminNotes - Optional notes from admin
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async approvePurchase(purchaseId, adminNotes = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Call database function to approve purchase
      const { data, error } = await supabase.rpc('approve_dp20_purchase', {
        purchase_id: purchaseId,
        admin_id: user.id,
        notes: adminNotes
      });

      if (error) {
        console.error('❌ Error approving purchase:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Purchase approved:', purchaseId);
      return { success: true };
    } catch (error) {
      console.error('❌ Exception in approvePurchase:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Reject package purchase
   * @param {string} purchaseId - Purchase ID
   * @param {string} rejectionReason - Reason for rejection
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async rejectPurchase(purchaseId, rejectionReason) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Call database function to reject purchase
      const { data, error } = await supabase.rpc('reject_purchase', {
        purchase_id: purchaseId,
        admin_id: user.id,
        rejection_reason: rejectionReason
      });

      if (error) {
        console.error('❌ Error rejecting purchase:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Purchase rejected:', purchaseId);
      return { success: true };
    } catch (error) {
      console.error('❌ Exception in rejectPurchase:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update purchase status manually (admin only)
   * @param {string} purchaseId - Purchase ID
   * @param {string} status - New status
   * @param {string} adminNotes - Optional notes
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async updatePurchaseStatus(purchaseId, status, adminNotes = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const updateData = {
        status,
        processed_by: user.id,
        processed_at: new Date().toISOString()
      };

      if (adminNotes) {
        updateData.admin_notes = adminNotes;
      }

      const { error } = await supabase
        .from('package_purchases')
        .update(updateData)
        .eq('id', purchaseId);

      if (error) {
        console.error('❌ Error updating purchase status:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Purchase status updated:', purchaseId, status);
      return { success: true };
    } catch (error) {
      console.error('❌ Exception in updatePurchaseStatus:', error);
      return { success: false, error: error.message };
    }
  }
};
