/**
 * Validation utilities for form inputs
 */

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);

  return {
    isValid:
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumber &&
      hasSpecialChar,
    errors: {
      minLength: password.length < minLength,
      hasUpperCase: !hasUpperCase,
      hasLowerCase: !hasLowerCase,
      hasNumber: !hasNumber,
      hasSpecialChar: !hasSpecialChar,
    },
  };
};

/**
 * Get password strength level (0-4)
 * 0 = very weak, 4 = very strong
 */
export const getPasswordStrength = (password) => {
  let strength = 0;

  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[@$!%*?&]/.test(password)) strength++;

  return Math.min(strength, 4);
};

/**
 * Get password strength label
 */
export const getPasswordStrengthLabel = (strength, language = 'en') => {
  const labels = {
    en: ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'],
    zh: ['非常弱', '弱', '一般', '強', '非常強'],
  };

  return labels[language][strength] || labels.en[strength];
};

/**
 * Get password strength color
 */
export const getPasswordStrengthColor = (strength) => {
  const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
  return colors[strength] || colors[0];
};

/**
 * Validate name (not empty, reasonable length)
 */
export const validateName = (name) => {
  return name.trim().length > 0 && name.trim().length <= 100;
};

/**
 * Get validation error messages
 */
export const getValidationMessages = (language = 'en') => {
  return {
    en: {
      emailInvalid: 'Please enter a valid email address',
      emailRequired: 'Email is required',
      nameRequired: 'Name is required',
      nameTooLong: 'Name must be less than 100 characters',
      passwordRequired: 'Password is required',
      passwordMinLength: 'Password must be at least 8 characters',
      passwordUpperCase: 'Password must contain at least one uppercase letter',
      passwordLowerCase: 'Password must contain at least one lowercase letter',
      passwordNumber: 'Password must contain at least one number',
      passwordSpecialChar: 'Password must contain at least one special character (@$!%*?&)',
      passwordMismatch: 'Passwords do not match',
      confirmPasswordRequired: 'Please confirm your password',
    },
    zh: {
      emailInvalid: '請輸入有效的電郵地址',
      emailRequired: '電郵地址為必填',
      nameRequired: '姓名為必填',
      nameTooLong: '姓名不得超過100個字元',
      passwordRequired: '密碼為必填',
      passwordMinLength: '密碼至少需要8個字元',
      passwordUpperCase: '密碼必須包含至少一個大寫字母',
      passwordLowerCase: '密碼必須包含至少一個小寫字母',
      passwordNumber: '密碼必須包含至少一個數字',
      passwordSpecialChar: '密碼必須包含至少一個特殊字符 (@$!%*?&)',
      passwordMismatch: '密碼不匹配',
      confirmPasswordRequired: '請確認您的密碼',
    },
  };
};
