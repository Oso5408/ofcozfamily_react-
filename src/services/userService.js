import { supabase, handleSupabaseError } from '@/lib/supabase';

/**
 * User Service
 * Handles all user-related operations with Supabase
 */

export const userService = {
  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { success: true, profile: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Get all users (admin only)
   */
  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, users: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, profile: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Update user tokens
   */
  async updateTokens(userId, newTokenCount, isTopUp = false, reason = '') {
    try {
      // Get current user data
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('tokens')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const oldTokenCount = currentUser.tokens || 0;
      const tokenChange = newTokenCount - oldTokenCount;

      // Update user tokens
      const updates = { tokens: newTokenCount };
      if (isTopUp) {
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 180);
        updates.token_valid_until = validUntil.toISOString();
      }

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Create token history record
      if (tokenChange !== 0) {
        await supabase
          .from('token_history')
          .insert({
            user_id: userId,
            change: tokenChange,
            new_balance: newTokenCount,
            transaction_type: tokenChange > 0 ? 'top-up' : 'deduction',
            reason: reason || null
          });
      }

      return { success: true, profile: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Get user token history
   */
  async getTokenHistory(userId) {
    try {
      const { data, error } = await supabase
        .from('token_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, history: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId, isAdmin) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ is_admin: isAdmin })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, profile: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Find user by email
   */
  async findUserByEmail(email) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
      return { success: true, user: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Delete user (admin only)
   * Note: This only deletes the user profile from the database.
   * The Supabase auth user must be deleted manually from the Supabase dashboard.
   */
  async deleteUser(userId) {
    try {
      console.log('🗑️ Attempting to delete user:', userId);

      // Delete user profile from database
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('❌ Profile deletion error:', profileError);

        // Check if it's a permission error
        if (profileError.code === '42501' || profileError.message?.includes('permission')) {
          return {
            success: false,
            error: 'Missing DELETE permission. Please run add-users-delete-policy.sql in Supabase'
          };
        }

        throw profileError;
      }

      console.log('✅ User profile deleted successfully');
      return {
        success: true,
        warning: 'User profile deleted. Note: You may need to manually delete the auth user from Supabase dashboard (Authentication > Users).'
      };
    } catch (error) {
      console.error('❌ Delete user error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Subscribe to user profile changes
   */
  subscribeToUserProfile(userId, callback) {
    return supabase
      .channel(`user-${userId}-profile`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  },
};
