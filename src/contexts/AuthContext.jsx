import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, userService } from '@/services';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          // Fetch user profile
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          setProfile(userProfile);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    // IMPORTANT: Cannot use await/async Supabase calls here due to deadlock bug
    // See: https://github.com/supabase/auth-js/issues/936
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔔 Auth state changed:', event);
        console.log('📧 Session user:', session?.user?.email);
        console.log('🆔 Session ID:', session?.user?.id);

        // Log stack trace to see what triggered SIGNED_OUT
        if (event === 'SIGNED_OUT') {
          console.log('🚨 SIGNED_OUT triggered! Stack trace:');
          console.trace();
        }

        if (session?.user) {
          setUser(session.user);
          // Fetch profile WITHOUT await to avoid deadlock
          supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data: userProfile }) => {
              console.log('👤 Profile fetched in listener:', userProfile);
              setProfile(userProfile);
            })
            .catch(err => console.error('Profile fetch error in listener:', err));
        } else {
          console.log('⚠️ No session - clearing user and profile');
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const register = async (userData) => {
    try {
      const result = await authService.signUp(
        userData.email,
        userData.password,
        {
          fullName: userData.fullName,
          phone: userData.phone,
          username: userData.username, // Add username
        }
      );

      if (!result.success) {
        return { success: false, error: result.error };
      }

      console.log('✅ Auth user created successfully');

      // Check if email confirmation is required
      if (result.emailConfirmationRequired) {
        console.log('📧 Email confirmation required - user must verify email');
        return {
          success: true,
          emailConfirmationRequired: true,
          message: 'Please check your email to confirm your account.'
        };
      }

      // After successful registration, automatically log in
      // Wait for trigger to create the user profile (increased to 2 seconds for reliability)
      console.log('⏳ Waiting 2s for profile creation...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Try to login and fetch the profile
      console.log('🔐 Attempting auto-login...');
      const loginResult = await login(userData.email, userData.password);

      if (!loginResult.success) {
        // If auto-login fails, still return success but with a note
        console.warn('❌ Auto-login failed after registration, but registration was successful');
        console.log('Reason:', loginResult.error);
        return {
          success: true,
          requiresManualLogin: true,
          message: 'Registration successful. Please login.'
        };
      }

      console.log('✅ Auto-login successful, user:', loginResult);
      return { success: true, user: loginResult.user };
    } catch (error) {
      console.error('❌ Registration error:', error);
      return { success: false, error: error.message };
    }
  };

  const login = async (email, password, rememberMe = false) => {
    try {
      const result = await authService.signIn(email, password);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      setUser(result.user);
      setProfile(result.profile);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logout called! Stack trace:');
      console.trace();
      await authService.signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (updates) => {
    if (!user) return;

    try {
      const result = await userService.updateProfile(user.id, updates);

      if (result.success) {
        setProfile(result.profile);
      }

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateUserTokens = async (userId, newTokenCount, isTopUp = false) => {
    try {
      const result = await userService.updateTokens(userId, newTokenCount, isTopUp);

      if (result.success && userId === user?.id) {
        setProfile(result.profile);
      }

      return result.success ? result.profile : null;
    } catch (error) {
      console.error('Update tokens error:', error);
      return null;
    }
  };

  const updateUserRole = async (userId, isAdmin) => {
    try {
      const result = await userService.updateUserRole(userId, isAdmin);

      if (result.success && userId === user?.id) {
        setProfile(result.profile);
      }

      return result;
    } catch (error) {
      console.error('Update role error:', error);
    }
  };

  const changePassword = async (userId, oldPassword, newPassword) => {
    try {
      // First verify old password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });

      if (signInError) {
        return { success: false, error: 'Incorrect old password' };
      }

      // Update to new password
      const result = await authService.updatePassword(newPassword);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (email, newPassword) => {
    try {
      const result = await authService.resetPassword(email);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const adminResetPassword = async (userId, newPassword) => {
    // This requires service_role key, so it should be done via backend
    // For now, return not implemented
    return { success: false, error: 'Admin password reset must be done via Supabase dashboard' };
  };

  const findUserByEmail = async (email) => {
    try {
      const result = await userService.findUserByEmail(email);
      return result.user;
    } catch (error) {
      return null;
    }
  };

  const value = {
    user: profile, // Return profile as user for compatibility
    login,
    register,
    updateUser,
    updateUserTokens,
    updateUserRole,
    changePassword,
    resetPassword,
    adminResetPassword,
    findUserByEmail,
    logout,
    isLoading,
    // Additional Supabase-specific data
    authUser: user,
    profile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
