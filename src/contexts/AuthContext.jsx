import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, userService, emailService } from '@/services';
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

  // Subscribe to profile changes for real-time updates
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔔 Setting up real-time profile subscription for user:', user.id);

    const channel = supabase
      .channel(`user-profile-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔔 Profile updated in database:', payload.new);
          setProfile(payload.new);
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Unsubscribing from profile changes');
      channel.unsubscribe();
    };
  }, [user?.id]);

  const register = async (userData) => {
    try {
      const result = await authService.signUp(
        userData.email,
        userData.password,
        {
          title: userData.title,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
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

  const updateUserTokens = async (userId, newTokenCount, isTopUp = false, reason = '') => {
    try {
      const result = await userService.updateTokens(userId, newTokenCount, isTopUp, reason);

      if (result.success && userId === user?.id) {
        setProfile(result.profile);
      }

      return result.success ? result.profile : null;
    } catch (error) {
      console.error('Update tokens error:', error);
      return null;
    }
  };

  const assignBRPackage = async (userId, packageType, adminId, amount, expiry = null, reason = '') => {
    try {
      console.log('🎫 Assigning BR package:', { userId, packageType, adminId, amount, expiry, reason });
      const brAmount = amount; // Use the passed amount instead of hardcoded value
      const balanceField = packageType === 'BR15' ? 'br15_balance' : 'br30_balance';

      // Get current user data (including email and name for email notification)
      console.log('📖 Fetching current balance...');
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select(`${balanceField}, email, full_name`)
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('❌ Fetch error:', fetchError);
        throw fetchError;
      }

      console.log('✅ Current data:', userData);
      const currentBalance = userData[balanceField] || 0;
      const newBalance = currentBalance + brAmount;
      console.log('💰 Balance update:', { currentBalance, newBalance });

      // Update user balance
      console.log('💾 Updating user balance...');
      const { data: updatedUsers, error: updateError } = await supabase
        .from('users')
        .update({ [balanceField]: newBalance })
        .eq('id', userId)
        .select();

      if (updateError) {
        console.error('❌ Update error:', updateError);
        throw updateError;
      }

      console.log('✅ Update response:', updatedUsers);

      // Get the updated user (might be array or single object)
      const updatedUser = Array.isArray(updatedUsers) && updatedUsers.length > 0
        ? updatedUsers[0]
        : updatedUsers;

      console.log('✅ User updated:', updatedUser);

      // If no data returned, fetch the user again
      if (!updatedUser) {
        console.log('⚠️ No data returned from update, fetching user...');
        const { data: fetchedUser, error: refetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (refetchError) {
          console.error('❌ Refetch error:', refetchError);
          // Still continue - update likely succeeded
          console.log('ℹ️ Continuing anyway - update likely succeeded');
        } else {
          console.log('✅ Refetched user:', fetchedUser);
          return { success: true, profile: fetchedUser };
        }
      }

      // Record in package history with the provided expiry date
      console.log('📝 Recording in package history...');
      const { error: historyError } = await supabase
        .from('package_history')
        .insert({
          user_id: userId,
          package_type: packageType,
          br_amount: brAmount,
          assigned_by: adminId,
          reason: reason || null,
          expiry_date: expiry || null // Use the passed expiry date or null
        });

      if (historyError) {
        console.error('⚠️ History error (non-critical):', historyError);
        // Don't throw - history is optional
      } else {
        console.log('✅ History recorded');
      }

      // Update local state if it's the current user
      if (userId === user?.id) {
        setProfile(updatedUser);
      }

      // Send package assignment email notification
      console.log('📧 Sending package assignment email to user...');
      try {
        const emailResult = await emailService.sendPackageAssignedEmail(
          userData.email,
          userData.full_name,
          packageType,
          brAmount,
          newBalance,
          reason || 'Package purchase',
          null, // BR packages don't have expiry
          'zh' // Default to Chinese, could be made configurable
        );

        if (!emailResult.success) {
          console.error('❌ Failed to send package assignment email:', emailResult.error);
        } else {
          console.log('✅ Package assignment email sent successfully');
        }
      } catch (emailError) {
        console.error('❌ Email error (non-critical):', emailError);
        // Don't throw - email is optional
      }

      return { success: true, profile: updatedUser };
    } catch (error) {
      console.error('❌ Assign BR package error:', error);
      return { success: false, error: error.message };
    }
  };

  const deductBRBalance = async (userId, brAmount, packageType) => {
    try {
      console.log('=== DEDUCT BR BALANCE DEBUG ===');
      console.log('💳 Input params:', { userId, brAmount, packageType });
      console.log('📊 Current user profile:', profile);

      const balanceField = packageType === 'BR15' ? 'br15_balance' : 'br30_balance';
      console.log('📊 Balance field to check:', balanceField);

      // Get current balance from database (not from cached profile)
      console.log('📖 Fetching FRESH balance from database...');
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')  // Get all fields to debug
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('❌ Fetch error:', fetchError);
        console.error('❌ Error details:', JSON.stringify(fetchError, null, 2));
        throw fetchError;
      }

      console.log('✅ Fresh user data from DB:', userData);
      console.log('✅ BR15 in DB:', userData.br15_balance);
      console.log('✅ BR30 in DB:', userData.br30_balance);

      const currentBalance = userData[balanceField] || 0;
      console.log('💰 Current balance for', packageType, ':', currentBalance);
      console.log('💰 Required:', brAmount);
      console.log('💰 Will have after deduction:', currentBalance - brAmount);

      if (currentBalance < brAmount) {
        console.error('❌ INSUFFICIENT BALANCE!');
        console.error('❌ Package:', packageType);
        console.error('❌ Current:', currentBalance);
        console.error('❌ Required:', brAmount);
        console.error('❌ Short by:', brAmount - currentBalance);
        console.error('=========================');
        return {
          success: false,
          error: `Insufficient BR balance. You have ${currentBalance} BR but need ${brAmount} BR.`
        };
      }

      const newBalance = currentBalance - brAmount;
      console.log('💰 New balance will be:', newBalance);

      // Update balance
      console.log('💾 Updating balance...');
      const { data: updatedUsers, error: updateError } = await supabase
        .from('users')
        .update({ [balanceField]: newBalance })
        .eq('id', userId)
        .select();

      if (updateError) {
        console.error('❌ Update error:', updateError);
        throw updateError;
      }

      const updatedUser = Array.isArray(updatedUsers) && updatedUsers.length > 0
        ? updatedUsers[0]
        : updatedUsers;

      console.log('✅ Balance updated successfully:', updatedUser);

      // Update local state if it's the current user
      if (userId === user?.id) {
        setProfile(updatedUser);
      }

      return { success: true, profile: updatedUser };
    } catch (error) {
      console.error('❌ Deduct BR balance error:', error);
      return { success: false, error: error.message };
    }
  };

  const assignDP20Package = async (userId, adminId, amount, expiry = null, reason = '') => {
    try {
      console.log('🎫 Assigning DP20 package:', { userId, adminId, amount, expiry, reason });

      // Get current user data (including email and name for email notification)
      console.log('📖 Fetching current balance...');
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('dp20_balance, dp20_expiry, email, full_name')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('❌ Fetch error:', fetchError);
        throw fetchError;
      }

      console.log('✅ Current data:', userData);
      const currentBalance = userData.dp20_balance || 0;
      const dpAmount = amount; // Use the passed amount instead of hardcoded 20
      const newBalance = currentBalance + dpAmount;
      // Use provided expiry or calculate 90 days from now
      const newExpiry = expiry || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      console.log('💰 Balance update:', { currentBalance, newBalance, newExpiry });

      // Update user balance and expiry
      console.log('💾 Updating user balance and expiry...');
      const { data: updatedUsers, error: updateError } = await supabase
        .from('users')
        .update({
          dp20_balance: newBalance,
          dp20_expiry: newExpiry
        })
        .eq('id', userId)
        .select();

      if (updateError) {
        console.error('❌ Update error:', updateError);
        throw updateError;
      }

      console.log('✅ Update response:', updatedUsers);

      // Get the updated user
      const updatedUser = Array.isArray(updatedUsers) && updatedUsers.length > 0
        ? updatedUsers[0]
        : updatedUsers;

      console.log('✅ User updated:', updatedUser);

      // If no data returned, fetch the user again
      if (!updatedUser) {
        console.log('⚠️ No data returned from update, fetching user...');
        const { data: fetchedUser, error: refetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (refetchError) {
          console.error('❌ Refetch error:', refetchError);
          console.log('ℹ️ Continuing anyway - update likely succeeded');
        } else {
          console.log('✅ Refetched user:', fetchedUser);
          return { success: true, profile: fetchedUser };
        }
      }

      // Record in package history
      console.log('📝 Recording in package history...');
      const { error: historyError } = await supabase
        .from('package_history')
        .insert({
          user_id: userId,
          package_type: 'DP20',
          br_amount: dpAmount, // Use the actual amount added
          assigned_by: adminId,
          reason: reason || null,
          expiry_date: newExpiry // Use the calculated or provided expiry
        });

      if (historyError) {
        console.error('⚠️ History error (non-critical):', historyError);
        // Don't throw - history is optional
      } else {
        console.log('✅ History recorded');
      }

      // Update local state if it's the current user
      if (userId === user?.id) {
        setProfile(updatedUser);
      }

      // Send package assignment email notification
      console.log('📧 Sending DP20 package assignment email to user...');
      try {
        const emailResult = await emailService.sendPackageAssignedEmail(
          userData.email,
          userData.full_name,
          'DP20',
          dpAmount, // Use the actual amount added
          newBalance,
          reason || 'Package purchase',
          newExpiry, // DP20 packages have expiry
          'zh' // Default to Chinese, could be made configurable
        );

        if (!emailResult.success) {
          console.error('❌ Failed to send package assignment email:', emailResult.error);
        } else {
          console.log('✅ Package assignment email sent successfully');
        }
      } catch (emailError) {
        console.error('❌ Email error (non-critical):', emailError);
        // Don't throw - email is optional
      }

      return { success: true, profile: updatedUser };
    } catch (error) {
      console.error('❌ Assign DP20 package error:', error);
      return { success: false, error: error.message };
    }
  };

  const deductDP20Balance = async (userId) => {
    try {
      console.log('=== DEDUCT DP20 BALANCE DEBUG ===');
      console.log('💳 Input params:', { userId });

      // Get current balance from database
      console.log('📖 Fetching FRESH balance from database...');
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('❌ Fetch error:', fetchError);
        throw fetchError;
      }

      console.log('✅ Fresh user data from DB:', userData);
      const currentBalance = userData.dp20_balance || 0;
      const expiry = userData.dp20_expiry;

      console.log('💰 Current DP20 balance:', currentBalance);
      console.log('📅 Expiry date:', expiry);

      // Check if expired
      if (expiry && new Date(expiry) < new Date()) {
        console.error('❌ DP20 PACKAGE EXPIRED!');
        console.error('❌ Expiry date:', expiry);
        return {
          success: false,
          error: 'DP20 package has expired.'
        };
      }

      // Check if sufficient balance
      if (currentBalance < 1) {
        console.error('❌ INSUFFICIENT DP20 BALANCE!');
        console.error('❌ Current:', currentBalance);
        return {
          success: false,
          error: `Insufficient DP20 balance. You have ${currentBalance} visits remaining.`
        };
      }

      const newBalance = currentBalance - 1;
      console.log('💰 New balance will be:', newBalance);

      // Update balance
      console.log('💾 Updating balance...');
      const { data: updatedUsers, error: updateError } = await supabase
        .from('users')
        .update({ dp20_balance: newBalance })
        .eq('id', userId)
        .select();

      if (updateError) {
        console.error('❌ Update error:', updateError);
        throw updateError;
      }

      const updatedUser = Array.isArray(updatedUsers) && updatedUsers.length > 0
        ? updatedUsers[0]
        : updatedUsers;

      console.log('✅ DP20 balance updated successfully:', updatedUser);

      // Update local state if it's the current user
      if (userId === user?.id) {
        setProfile(updatedUser);
      }

      return { success: true, profile: updatedUser };
    } catch (error) {
      console.error('❌ Deduct DP20 balance error:', error);
      return { success: false, error: error.message };
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
      // Validate new password length
      if (newPassword.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters long' };
      }

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

  const deleteUser = async (userId) => {
    try {
      const result = await userService.deleteUser(userId);
      return result;
    } catch (error) {
      console.error('Delete user error:', error);
      return { success: false, error: error.message };
    }
  };

  const refreshProfile = async () => {
    try {
      if (!user?.id) {
        console.warn('⚠️ Cannot refresh profile: no user logged in');
        return { success: false, error: 'No user logged in' };
      }

      console.log('🔄 Manually refreshing profile for user:', user.id);

      const { data: freshProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('❌ Error refreshing profile:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Profile refreshed:', freshProfile);
      setProfile(freshProfile);
      return { success: true, profile: freshProfile };
    } catch (error) {
      console.error('❌ Refresh profile error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user: profile, // Return profile as user for compatibility
    login,
    register,
    updateUser,
    updateUserTokens,
    assignBRPackage,
    deductBRBalance,
    assignDP20Package,
    deductDP20Balance,
    updateUserRole,
    changePassword,
    resetPassword,
    adminResetPassword,
    findUserByEmail,
    deleteUser,
    refreshProfile,
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
