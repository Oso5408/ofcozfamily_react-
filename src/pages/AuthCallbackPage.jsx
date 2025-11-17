import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * AuthCallbackPage - Handles Supabase auth callbacks (OAuth, password reset, etc.)
 *
 * This page solves the HashRouter + Supabase URL collision problem:
 * - Supabase sends tokens in URL hash: http://site.com/#access_token=xxx&type=recovery
 * - HashRouter also uses hash for routing: http://site.com/#/reset-password
 * - These conflict! Solution: Use a separate callback URL that extracts tokens first
 *
 * Flow:
 * 1. User clicks password reset link in email
 * 2. Supabase redirects to: http://site.com/auth/callback#access_token=xxx&type=recovery
 * 3. This page extracts tokens from URL hash
 * 4. Sets session using supabase.auth.setSession()
 * 5. Redirects to appropriate page based on auth type (recovery, signup, etc.)
 */
export const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 AuthCallback: Processing auth callback...');
        console.log('Full URL:', window.location.href);
        console.log('Hash:', window.location.hash);

        // Extract tokens from URL hash
        // URL format: /auth/callback#access_token=xxx&refresh_token=yyy&type=recovery
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        const errorParam = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        console.log('Extracted params:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          type,
          error: errorParam
        });

        // Handle error from Supabase
        if (errorParam) {
          console.error('❌ Auth callback error:', errorDescription || errorParam);
          setError(errorDescription || errorParam);

          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login');
          }, 3000);
          return;
        }

        // Handle different auth types
        if (type === 'recovery' && accessToken) {
          // Password reset flow
          console.log('🔑 Password reset detected, setting session...');

          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });

          if (error) {
            console.error('❌ Failed to set recovery session:', error);
            setError(error.message);
            setTimeout(() => navigate('/forgot-password'), 3000);
            return;
          }

          if (data.session) {
            console.log('✅ Recovery session created, redirecting to reset password page...');
            // Redirect to reset password page with clean URL (no tokens in hash)
            navigate('/reset-password', { replace: true });
          }
        } else if (type === 'signup' && accessToken) {
          // Email confirmation flow
          console.log('📧 Email confirmation detected, setting session...');

          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });

          if (error) {
            console.error('❌ Failed to set signup session:', error);
            setError(error.message);
            setTimeout(() => navigate('/login'), 3000);
            return;
          }

          if (data.session) {
            console.log('✅ Email confirmed, redirecting to dashboard...');
            navigate('/dashboard', { replace: true });
          }
        } else if (accessToken) {
          // Generic OAuth or other auth type
          console.log('🔐 Generic auth detected, setting session...');

          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });

          if (error) {
            console.error('❌ Failed to set session:', error);
            setError(error.message);
            setTimeout(() => navigate('/login'), 3000);
            return;
          }

          if (data.session) {
            console.log('✅ Session created, redirecting to dashboard...');
            navigate('/dashboard', { replace: true });
          }
        } else {
          // No tokens found, redirect to login
          console.log('⚠️ No auth tokens found in URL, redirecting to login...');
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error('❌ Error in auth callback:', err);
        setError(err.message);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  // Show loading state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-amber-800 mb-4">
            {language === 'zh' ? '驗證失敗' : 'Authentication Failed'}
          </h2>
          <p className="text-amber-600 mb-4">{error}</p>
          <p className="text-sm text-amber-500">
            {language === 'zh' ? '正在重定向...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-600 mx-auto mb-6"></div>
        <h2 className="text-2xl font-bold text-amber-800 mb-2">
          {language === 'zh' ? '驗證中...' : 'Authenticating...'}
        </h2>
        <p className="text-amber-600">
          {language === 'zh' ? '請稍候，正在處理您的請求' : 'Please wait while we process your request'}
        </p>
      </div>
    </div>
  );
};
