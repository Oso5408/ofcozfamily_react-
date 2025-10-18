import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Config Check:');
console.log('URL:', supabaseUrl ? `${supabaseUrl.slice(0, 30)}...` : 'MISSING');
console.log('Key:', supabaseAnonKey ? `${supabaseAnonKey.slice(0, 20)}...` : 'MISSING');

// Create a dummy client if env vars are missing (prevents app crash)
// The app will show a configuration error instead of blank page
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables!');
    console.error('Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.');

    // Return a mock client that throws helpful errors
    return {
      auth: {
        getSession: async () => {
          throw new Error('Supabase not configured: Missing environment variables');
        },
        signInWithPassword: async () => {
          throw new Error('Supabase not configured: Missing environment variables');
        },
        signUp: async () => {
          throw new Error('Supabase not configured: Missing environment variables');
        },
        signOut: async () => {
          throw new Error('Supabase not configured: Missing environment variables');
        },
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: () => {} } }
        })
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => {
              throw new Error('Supabase not configured: Missing environment variables');
            }
          })
        })
      })
    };
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: localStorage,
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: { 'x-application-name': 'cat-cafe-booking' },
    },
  });
};

export const supabase = createSupabaseClient();
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Helper function to handle Supabase errors with bilingual support
export const handleSupabaseError = (error, language = 'en') => {
  if (!error) return null;

  console.error('Supabase error:', error);

  // Map common error codes to user-friendly messages
  const errorMessages = {
    en: {
      '23505': 'This record already exists',
      '23503': 'Cannot delete record - it is referenced by other records',
      '23502': 'Required field is missing',
      '42501': 'Permission denied',
      'auth/email-already-in-use': 'This email is already registered. Please login or use a different email.',
      'auth/invalid-email': 'Invalid email address format',
      'auth/weak-password': 'Password is too weak. Please use a stronger password.',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
    },
    zh: {
      '23505': '此記錄已存在',
      '23503': '無法刪除記錄 - 它被其他記錄引用',
      '23502': '缺少必填字段',
      '42501': '權限被拒絕',
      'auth/email-already-in-use': '此電郵已被註冊。請登入或使用其他電郵地址。',
      'auth/invalid-email': '電郵地址格式無效',
      'auth/weak-password': '密碼過弱。請使用更強的密碼。',
      'auth/user-not-found': '找不到此電郵的帳戶',
      'auth/wrong-password': '密碼錯誤',
      'auth/too-many-requests': '嘗試次數過多。請稍後再試。',
      'auth/network-request-failed': '網絡錯誤。請檢查您的連接。',
    },
  };

  const messages = errorMessages[language] || errorMessages.en;

  // Check for specific Supabase auth error messages
  if (error.message) {
    const errorMsg = error.message.toLowerCase();

    // User already registered
    if (errorMsg.includes('user already registered') || errorMsg.includes('duplicate')) {
      return language === 'zh'
        ? '此電郵已被註冊。請登入或使用其他電郵地址。'
        : 'This email is already registered. Please login or use a different email.';
    }

    // Invalid credentials
    if (errorMsg.includes('invalid login credentials') || errorMsg.includes('invalid credentials')) {
      return language === 'zh'
        ? '電郵或密碼錯誤'
        : 'Invalid email or password';
    }

    // Email not confirmed
    if (errorMsg.includes('email not confirmed')) {
      return language === 'zh'
        ? '請先確認您的電郵地址。請檢查您的收件箱。'
        : 'Please confirm your email address. Check your inbox.';
    }

    // Password requirements
    if (errorMsg.includes('password')) {
      return language === 'zh'
        ? '密碼必須至少6個字符'
        : 'Password must be at least 6 characters';
    }
  }

  return messages[error.code] || error.message || (language === 'zh' ? '發生錯誤' : 'An error occurred');
};

// Helper function for real-time subscriptions
export const subscribeToChannel = (channelName, config) => {
  return supabase
    .channel(channelName)
    .on('postgres_changes', config, (payload) => {
      config.callback?.(payload);
    })
    .subscribe();
};
