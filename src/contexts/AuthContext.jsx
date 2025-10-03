import React, { createContext, useContext, useState, useEffect } from 'react';
import { sendActivationEmail } from '@/lib/email';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('ofcoz_user');
      const rememberMe = localStorage.getItem('ofcoz_remember_me');
      
      if (savedUser && rememberMe === 'true') {
        setUser(JSON.parse(savedUser));
      } else if (savedUser && !rememberMe) {
        const sessionUser = sessionStorage.getItem('ofcoz_session_user');
        if (sessionUser) {
          setUser(JSON.parse(sessionUser));
        }
      }
      
      let users = JSON.parse(localStorage.getItem('ofcoz_users') || '[]');

      // Note: Admin accounts must be created manually through registration
      // No default credentials for security reasons
      
      const updatedUsers = users.map(u => {
          if (!u.tokenValidUntil) {
              const validUntil = new Date();
              validUntil.setDate(validUntil.getDate() + 180);
              return {...u, tokenValidUntil: validUntil.toISOString()};
          }
          return u;
      });
      localStorage.setItem('ofcoz_users', JSON.stringify(updatedUsers));
    } catch (error) {
      console.error("Failed to initialize auth state:", error);
      localStorage.removeItem('ofcoz_user');
      localStorage.removeItem('ofcoz_session_user');
      localStorage.removeItem('ofcoz_remember_me');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (email, password, rememberMe = false) => {
    const users = JSON.parse(localStorage.getItem('ofcoz_users') || '[]');
    const loggedInUser = users.find(u => u.email === email && u.password === password);
    
    if (loggedInUser) {
      const userWithoutPassword = { ...loggedInUser };
      delete userWithoutPassword.password;
      setUser(userWithoutPassword);
      
      if (rememberMe) {
        localStorage.setItem('ofcoz_user', JSON.stringify(userWithoutPassword));
        localStorage.setItem('ofcoz_remember_me', 'true');
      } else {
        sessionStorage.setItem('ofcoz_session_user', JSON.stringify(userWithoutPassword));
        localStorage.removeItem('ofcoz_remember_me');
        localStorage.removeItem('ofcoz_user');
      }
      
      return { success: true };
    }
    
    return { success: false, error: 'Invalid email or password' };
  };

  const register = (userData) => {
    const users = JSON.parse(localStorage.getItem('ofcoz_users') || '[]');
    
    if (users.find(u => u.email === userData.email)) {
      return { success: false, error: 'Email already exists' };
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 180);

    const newUser = {
      id: Date.now().toString(),
      ...userData,
      tokens: 0,
      createdAt: new Date().toISOString(),
      isAdmin: false,
      tokenValidUntil: validUntil.toISOString(),
      tokenHistory: [],
    };

    users.push(newUser);
    localStorage.setItem('ofcoz_users', JSON.stringify(users));

    const userWithoutPassword = { ...newUser };
    delete userWithoutPassword.password;
    setUser(userWithoutPassword);
    sessionStorage.setItem('ofcoz_session_user', JSON.stringify(userWithoutPassword));
    
    sendActivationEmail(newUser);

    return { success: true };
  };

  const updateUser = (updatedData) => {
    if (!user) return;
    const users = JSON.parse(localStorage.getItem('ofcoz_users') || '[]');
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex === -1) return;

    const currentUser = users[userIndex];
    const updatedUserObject = { ...currentUser, ...updatedData };
    users[userIndex] = updatedUserObject;
    localStorage.setItem('ofcoz_users', JSON.stringify(users));
    
    const userToSet = { ...updatedUserObject };
    delete userToSet.password;
    setUser(userToSet);
    
    const rememberMe = localStorage.getItem('ofcoz_remember_me');
    if (rememberMe === 'true') {
      localStorage.setItem('ofcoz_user', JSON.stringify(userToSet));
    } else {
      sessionStorage.setItem('ofcoz_session_user', JSON.stringify(userToSet));
    }
  };

  const updateUserTokens = (userId, newTokenCount, isTopUp = false) => {
    const users = JSON.parse(localStorage.getItem('ofcoz_users') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) return null;

    const currentUser = users[userIndex];
    const oldTokenCount = currentUser.tokens || 0;
    currentUser.tokens = newTokenCount;

    if (isTopUp) {
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 180);
        currentUser.tokenValidUntil = validUntil.toISOString();
    }
    
    // Add to token history
    if (!currentUser.tokenHistory) {
      currentUser.tokenHistory = [];
    }
    const tokenChange = newTokenCount - oldTokenCount;
    if (tokenChange !== 0) {
      currentUser.tokenHistory.push({
        date: new Date().toISOString(),
        change: tokenChange,
        newBalance: newTokenCount,
        type: tokenChange > 0 ? 'top-up' : 'usage/deduction'
      });
    }

    users[userIndex] = currentUser;
    localStorage.setItem('ofcoz_users', JSON.stringify(users));
    
    if (user && user.id === userId) {
      const updatedUserForState = { ...currentUser };
       delete updatedUserForState.password;
      setUser(updatedUserForState);
      
      const rememberMe = localStorage.getItem('ofcoz_remember_me');
      if (rememberMe === 'true') {
        localStorage.setItem('ofcoz_user', JSON.stringify(updatedUserForState));
      } else {
        sessionStorage.setItem('ofcoz_session_user', JSON.stringify(updatedUserForState));
      }
    }
    return currentUser;
  };

  const updateUserRole = (userId, isAdmin) => {
    const users = JSON.parse(localStorage.getItem('ofcoz_users') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);
    if(userIndex === -1) return;

    users[userIndex].isAdmin = isAdmin;
    localStorage.setItem('ofcoz_users', JSON.stringify(users));
  };

  const changePassword = (userId, oldPassword, newPassword) => {
    const users = JSON.parse(localStorage.getItem('ofcoz_users') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return { success: false, error: 'User not found' };
    }

    if (users[userIndex].password !== oldPassword) {
      return { success: false, error: 'Incorrect old password' };
    }

    users[userIndex].password = newPassword;
    localStorage.setItem('ofcoz_users', JSON.stringify(users));

    return { success: true };
  };
  
  const resetPassword = (email, newPassword) => {
      const users = JSON.parse(localStorage.getItem('ofcoz_users') || '[]');
      const userIndex = users.findIndex(u => u.email === email);
      if (userIndex === -1) {
          return { success: false, error: 'User not found' };
      }
      users[userIndex].password = newPassword;
      localStorage.setItem('ofcoz_users', JSON.stringify(users));
      return { success: true };
  };

  const adminResetPassword = (userId, newPassword) => {
    const users = JSON.parse(localStorage.getItem('ofcoz_users') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return { success: false, error: 'User not found' };
    }
    users[userIndex].password = newPassword;
    localStorage.setItem('ofcoz_users', JSON.stringify(users));
    return { success: true };
  };

  const findUserByEmail = (email) => {
    const users = JSON.parse(localStorage.getItem('ofcoz_users') || '[]');
    return users.find(u => u.email === email);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ofcoz_user');
    localStorage.removeItem('ofcoz_remember_me');
    sessionStorage.removeItem('ofcoz_session_user');
  };

  const value = {
    user,
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
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};