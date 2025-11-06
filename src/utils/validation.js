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
 * - At least 6 characters (simplified requirement)
 */
export const validatePassword = (password) => {
  const minLength = 6;

  return {
    isValid: password.length >= minLength,
    errors: {
      minLength: password.length < minLength,
      hasUpperCase: false,
      hasLowerCase: false,
      hasNumber: false,
      hasSpecialChar: false,
    },
  };
};

/**
 * Get password strength level (0-4)
 * 0 = very weak, 4 = very strong
 */
export const getPasswordStrength = (password) => {
  let strength = 0;

  if (password.length >= 6) strength++;
  if (password.length >= 8) strength++;
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
 * Validate phone number (required field)
 * Allows common phone formats with digits, spaces, dashes, parentheses, and + sign
 */
export const validatePhone = (phone) => {
  // Phone is now required - empty is invalid
  if (!phone || phone.trim().length === 0) {
    return false;
  }

  // Check format
  // Allows: digits, spaces, dashes, parentheses, and + sign
  // Examples: +852 1234 5678, (123) 456-7890, 123-456-7890
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  const trimmedPhone = phone.trim();

  // Must be valid format and reasonable length (5-20 characters)
  return phoneRegex.test(trimmedPhone) && trimmedPhone.length >= 5 && trimmedPhone.length <= 20;
};

/**
 * Validate title/salutation
 */
export const validateTitle = (title) => {
  const validTitles = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', '先生', '女士', '太太', '博士'];
  return title && validTitles.includes(title);
};

/**
 * Validate first name
 */
export const validateFirstName = (firstName) => {
  return firstName && firstName.trim().length > 0 && firstName.trim().length <= 50;
};

/**
 * Validate last name
 */
export const validateLastName = (lastName) => {
  return lastName && lastName.trim().length > 0 && lastName.trim().length <= 50;
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
      titleRequired: 'Title is required',
      firstNameRequired: 'First name is required',
      firstNameTooLong: 'First name must be less than 50 characters',
      lastNameRequired: 'Last name is required',
      lastNameTooLong: 'Last name must be less than 50 characters',
      passwordRequired: 'Password is required',
      passwordMinLength: 'Password must be at least 6 characters',
      passwordUpperCase: 'Password must contain at least one uppercase letter',
      passwordLowerCase: 'Password must contain at least one lowercase letter',
      passwordNumber: 'Password must contain at least one number',
      passwordSpecialChar: 'Password must contain at least one special character (@$!%*?&)',
      passwordMismatch: 'Passwords do not match',
      confirmPasswordRequired: 'Please confirm your password',
      phoneInvalid: 'Please enter a valid phone number',
      phoneRequired: 'Phone number is required',
    },
    zh: {
      emailInvalid: '請輸入有效的電郵地址',
      emailRequired: '電郵地址為必填',
      nameRequired: '姓名為必填',
      nameTooLong: '姓名不得超過100個字元',
      titleRequired: '稱謂為必填',
      firstNameRequired: '名稱為必填',
      firstNameTooLong: '名稱不得超過50個字元',
      lastNameRequired: '姓氏為必填',
      lastNameTooLong: '姓氏不得超過50個字元',
      passwordRequired: '密碼為必填',
      passwordMinLength: '密碼至少需要6個字元',
      passwordUpperCase: '密碼必須包含至少一個大寫字母',
      passwordLowerCase: '密碼必須包含至少一個小寫字母',
      passwordNumber: '密碼必須包含至少一個數字',
      passwordSpecialChar: '密碼必須包含至少一個特殊字符 (@$!%*?&)',
      passwordMismatch: '密碼不匹配',
      confirmPasswordRequired: '請確認您的密碼',
      phoneInvalid: '請輸入有效的電話號碼',
      phoneRequired: '電話號碼為必填',
    },
  };
};
