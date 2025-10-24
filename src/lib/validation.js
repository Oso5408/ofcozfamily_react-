/**
 * Input validation and sanitization utilities
 * Provides security and data quality checks for user inputs
 */

/**
 * Sanitize string input by trimming whitespace and limiting length
 * @param {string} input - The input string to sanitize
 * @param {number} maxLength - Maximum allowed length (default: 255)
 * @returns {string} Sanitized string
 */
export const sanitizeString = (input, maxLength = 255) => {
  if (typeof input !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
};

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // RFC 5322 simplified email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with isValid and errors
 */
export const validatePassword = (password) => {
  const errors = [];

  if (!password || typeof password !== 'string') {
    return { isValid: false, errors: ['Password is required'] };
  }

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (password.length > 255) {
    errors.push('Password is too long (max 255 characters)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Check if string contains potentially malicious SQL patterns
 * Note: Supabase uses parameterized queries which prevent SQL injection,
 * but this provides an extra layer of detection for logging/monitoring
 * @param {string} input - Input to check
 * @returns {boolean} True if suspicious patterns found
 */
export const containsSuspiciousPatterns = (input) => {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const suspiciousPatterns = [
    /(\bOR\b.*=.*)/i,          // OR 1=1
    /(\bAND\b.*=.*)/i,         // AND 1=1
    /(--)/,                     // SQL comment
    /(;.*DROP)/i,              // DROP statements
    /(;.*DELETE)/i,            // DELETE statements
    /(;.*UPDATE)/i,            // UPDATE statements
    /(;.*INSERT)/i,            // INSERT statements
    /(<script>)/i,             // XSS script tags
    /(javascript:)/i,          // XSS javascript protocol
    /(onerror=)/i,             // XSS event handlers
  ];

  return suspiciousPatterns.some(pattern => pattern.test(input));
};

/**
 * Sanitize and validate email input
 * @param {string} email - Email to sanitize and validate
 * @returns {object} Result with sanitized email and validation status
 */
export const sanitizeAndValidateEmail = (email) => {
  const sanitized = sanitizeString(email, 255);
  const isValid = isValidEmail(sanitized);
  const hasSuspiciousContent = containsSuspiciousPatterns(sanitized);

  return {
    sanitized,
    isValid,
    hasSuspiciousContent,
    error: !isValid
      ? 'Invalid email format'
      : hasSuspiciousContent
      ? 'Email contains invalid characters'
      : null
  };
};

/**
 * Sanitize and validate password input
 * @param {string} password - Password to sanitize and validate
 * @returns {object} Result with sanitized password and validation status
 */
export const sanitizeAndValidatePassword = (password) => {
  const sanitized = sanitizeString(password, 255);
  const validation = validatePassword(sanitized);
  const hasSuspiciousContent = containsSuspiciousPatterns(sanitized);

  return {
    sanitized,
    isValid: validation.isValid && !hasSuspiciousContent,
    hasSuspiciousContent,
    error: validation.errors[0] || (hasSuspiciousContent ? 'Password contains invalid characters' : null)
  };
};

/**
 * Rate limiting tracker (client-side)
 * Helps detect and prevent abuse before hitting server
 */
class RateLimiter {
  constructor() {
    this.attempts = new Map();
  }

  /**
   * Record a failed login attempt
   * @param {string} identifier - User identifier (email)
   * @returns {object} Rate limit status
   */
  recordFailedAttempt(identifier) {
    const now = Date.now();
    const key = identifier.toLowerCase();

    if (!this.attempts.has(key)) {
      this.attempts.set(key, []);
    }

    const attempts = this.attempts.get(key);

    // Remove attempts older than 15 minutes
    const recentAttempts = attempts.filter(time => now - time < 15 * 60 * 1000);
    recentAttempts.push(now);

    this.attempts.set(key, recentAttempts);

    return {
      count: recentAttempts.length,
      isLimited: recentAttempts.length >= 5,
      nextAllowedTime: recentAttempts.length >= 5
        ? new Date(recentAttempts[0] + 15 * 60 * 1000)
        : null
    };
  }

  /**
   * Clear attempts for an identifier (e.g., after successful login)
   * @param {string} identifier - User identifier
   */
  clearAttempts(identifier) {
    this.attempts.delete(identifier.toLowerCase());
  }

  /**
   * Check if identifier is rate limited
   * @param {string} identifier - User identifier
   * @returns {boolean} True if rate limited
   */
  isRateLimited(identifier) {
    const now = Date.now();
    const key = identifier.toLowerCase();

    if (!this.attempts.has(key)) {
      return false;
    }

    const attempts = this.attempts.get(key);
    const recentAttempts = attempts.filter(time => now - time < 15 * 60 * 1000);

    return recentAttempts.length >= 5;
  }
}

export const loginRateLimiter = new RateLimiter();
