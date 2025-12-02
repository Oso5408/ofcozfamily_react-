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
            title: userData.title,
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone: userData.phone,
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
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {boolean} rememberMe - If true, extends session duration to 30 days
   */
  async signIn(email, password, rememberMe = false) {
    try {
      // Store rememberMe preference for session management
      if (rememberMe) {
        localStorage.setItem('ofcoz_remember_me', 'true');
        // Set expiry to 30 days from now
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        localStorage.setItem('ofcoz_session_expiry', expiryDate.toISOString());
      } else {
        localStorage.removeItem('ofcoz_remember_me');
        localStorage.removeItem('ofcoz_session_expiry');
      }

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

      console.log('✅ Login successful with rememberMe:', rememberMe);

      return { success: true, user: data.user, profile, rememberMe };
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
