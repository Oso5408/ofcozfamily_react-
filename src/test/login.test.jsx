import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';

// Mock the authService
vi.mock('@/services/authService', () => ({
  authService: {
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
}));

// Mock the userService
vi.mock('@/services/userService', () => ({
  userService: {
    updateProfile: vi.fn(),
    updateTokens: vi.fn(),
    updateUserRole: vi.fn(),
    findUserByEmail: vi.fn(),
  },
}));

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      signInWithPassword: vi.fn(),
    },
    from: vi.fn(),
  },
  handleSupabaseError: vi.fn((error) => error.message || 'An error occurred'),
}));

// Test component that uses the auth context
function TestLoginComponent() {
  const { login, user } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);

    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          data-testid="email-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          data-testid="password-input"
        />
        <button type="submit" disabled={loading} data-testid="login-button">
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      {error && <div data-testid="error-message">{error}</div>}
      {user && <div data-testid="user-info">Welcome {user.email}</div>}
    </div>
  );
}

describe('Login System - Invalid Credentials', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('should reject login with non-existent user (never visited website)', async () => {
    // Mock Supabase to return invalid credentials error
    authService.signIn.mockResolvedValue({
      success: false,
      error: 'Invalid login credentials',
    });

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestLoginComponent />
      </AuthProvider>
    );

    // Fill in email of user who never registered
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');

    await user.type(emailInput, 'newuser@example.com');
    await user.type(passwordInput, 'anypassword123');
    await user.click(loginButton);

    // Wait for the error message to appear
    await waitFor(() => {
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage.textContent).toBe('Invalid login credentials');
    });

    // Verify authService.signIn was called with correct params
    expect(authService.signIn).toHaveBeenCalledWith('newuser@example.com', 'anypassword123');
    expect(authService.signIn).toHaveBeenCalledTimes(1);
  });

  it('should reject login with wrong password for existing user', async () => {
    authService.signIn.mockResolvedValue({
      success: false,
      error: 'Invalid login credentials',
    });

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestLoginComponent />
      </AuthProvider>
    );

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');

    await user.type(emailInput, 'existinguser@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(loginButton);

    await waitFor(() => {
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage.textContent).toBe('Invalid login credentials');
    });
  });

  it('should reject login with invalid email format', async () => {
    authService.signIn.mockResolvedValue({
      success: false,
      error: 'Invalid login credentials',
    });

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestLoginComponent />
      </AuthProvider>
    );

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');

    await user.type(emailInput, 'bademail@test');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    await waitFor(() => {
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toBeInTheDocument();
    });

    // Verify authService was called
    expect(authService.signIn).toHaveBeenCalledWith('bademail@test', 'password123');
  });

  it('should reject login with empty credentials', async () => {
    authService.signIn.mockResolvedValue({
      success: false,
      error: 'Email and password are required',
    });

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestLoginComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByTestId('login-button');
    await user.click(loginButton);

    await waitFor(() => {
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('should handle rate limiting error for too many failed attempts', async () => {
    authService.signIn.mockResolvedValue({
      success: false,
      error: 'Too many login attempts. Please try again later.',
    });

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestLoginComponent />
      </AuthProvider>
    );

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'wrongpass');
    await user.click(loginButton);

    await waitFor(() => {
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage.textContent.toLowerCase()).toContain('too many');
    });
  });

  it('should handle network errors during login', async () => {
    authService.signIn.mockResolvedValue({
      success: false,
      error: 'Network error. Please check your connection.',
    });

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestLoginComponent />
      </AuthProvider>
    );

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    await waitFor(() => {
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage.textContent).toContain('Network error');
    });
  });

  it('should handle email not confirmed error', async () => {
    authService.signIn.mockResolvedValue({
      success: false,
      error: 'Email not confirmed. Please check your email.',
    });

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestLoginComponent />
      </AuthProvider>
    );

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');

    await user.type(emailInput, 'unconfirmed@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    await waitFor(() => {
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage.textContent).toContain('not confirmed');
    });
  });

  it('should not store user data when login fails', async () => {
    authService.signIn.mockResolvedValue({
      success: false,
      error: 'Invalid login credentials',
    });

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestLoginComponent />
      </AuthProvider>
    );

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'wrongpass');
    await user.click(loginButton);

    await waitFor(() => {
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toBeInTheDocument();
    });

    // Verify user info is not displayed
    const userInfo = screen.queryByTestId('user-info');
    expect(userInfo).not.toBeInTheDocument();
  });
});

describe('Login System - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle SQL injection attempts safely', async () => {
    authService.signIn.mockResolvedValue({
      success: false,
      error: 'Invalid login credentials',
    });

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestLoginComponent />
      </AuthProvider>
    );

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');

    // Attempt SQL injection with common patterns
    await user.type(emailInput, 'admin@test.com');
    await user.type(passwordInput, "password' OR '1'='1");
    await user.click(loginButton);

    await waitFor(() => {
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toBeInTheDocument();
    });

    // System should treat it as invalid credentials, not crash
    expect(authService.signIn).toHaveBeenCalledWith('admin@test.com', "password' OR '1'='1");
  });

  it('should handle very long input strings', async () => {
    authService.signIn.mockResolvedValue({
      success: false,
      error: 'Invalid login credentials',
    });

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestLoginComponent />
      </AuthProvider>
    );

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');

    // Very long strings
    const longEmail = 'a'.repeat(1000) + '@example.com';
    const longPassword = 'p'.repeat(1000);

    await user.type(emailInput, longEmail);
    await user.type(passwordInput, longPassword);
    await user.click(loginButton);

    await waitFor(() => {
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('should handle special characters in credentials', async () => {
    authService.signIn.mockResolvedValue({
      success: false,
      error: 'Invalid login credentials',
    });

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestLoginComponent />
      </AuthProvider>
    );

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');

    await user.type(emailInput, 'test+user@example.com');
    await user.type(passwordInput, 'p@$$w0rd!#$%');
    await user.click(loginButton);

    await waitFor(() => {
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toBeInTheDocument();
    });

    // Verify special characters were passed correctly
    expect(authService.signIn).toHaveBeenCalledWith('test+user@example.com', 'p@$$w0rd!#$%');
  });
});
