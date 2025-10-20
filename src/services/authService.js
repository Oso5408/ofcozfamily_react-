import { supabase, handleSupabaseError } from '@/lib/supabase';

/**
 * Authentication Service
 * Handles all authentication-related operations with Supabase
 */

export const authService = {
  /**
   * Sign up a new user
   */
  async signUp(email, password, userData) {
    try {
      console.log('📞 Calling Supabase signUp API...');
      console.log('Email:', email);

      // Create auth user - the database trigger will automatically create the user profile
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.fullName,
            phone: userData.phone,
            username: userData.username, // Add username to metadata
          }
        }
      });

      console.log('📥 Supabase response received');
      console.log('Auth data:', authData);
      console.log('Auth error:', authError);

      if (authError) throw authError;

      // Check if email confirmation is required
      // When confirmation is required, session will be null and user will have identities
      const emailConfirmationRequired = !authData.session && authData.user && authData.user.identities && authData.user.identities.length === 0;

      console.log('Email confirmation required:', emailConfirmationRequired);
      console.log('Session:', authData.session);
      console.log('User confirmed_at:', authData.user?.confirmed_at);

      // User profile is created automatically by database trigger
      return {
        success: true,
        user: authData.user,
        emailConfirmationRequired,
        session: authData.session
      };
    } catch (error) {
      console.error('🔥 Auth service error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Sign in user
   */
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      return { success: true, user: data.user, profile };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Sign out user
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Get current session
   */
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { success: true, session };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Get current user with profile
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      if (!user) return { success: true, user: null };

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      return { success: true, user, profile };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Reset password
   */
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#/reset-password`,
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Update password
   */
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};
