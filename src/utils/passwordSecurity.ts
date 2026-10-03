export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 to 5
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  errors: string[];
}

export const MIN_PASSWORD_LENGTH = 8;
export const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?/~`]/;

export function validatePasswordStrength(password: string): PasswordValidationResult {
  const p = typeof password === 'string' ? password : '';
  const hasMinLength = p.length >= MIN_PASSWORD_LENGTH;
  const hasUppercase = /[A-Z]/.test(p);
  const hasLowercase = /[a-z]/.test(p);
  const hasNumber = /[0-9]/.test(p);
  const hasSpecialChar = SPECIAL_CHAR_REGEX.test(p);

  const errors: string[] = [];
  if (!hasMinLength) errors.push(`At least ${MIN_PASSWORD_LENGTH} characters`);
  if (!hasUppercase) errors.push('At least one uppercase letter (A-Z)');
  if (!hasLowercase) errors.push('At least one lowercase letter (a-z)');
  if (!hasNumber) errors.push('At least one number (0-9)');
  if (!hasSpecialChar) errors.push('At least one special character (!@#$%^&*...)');

  let score = 0;
  if (hasMinLength) score++;
  if (hasUppercase) score++;
  if (hasLowercase) score++;
  if (hasNumber) score++;
  if (hasSpecialChar) score++;

  return {
    isValid: errors.length === 0,
    score,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
    errors,
  };
}

export function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: 'Username is required' };
  }
  const clean = username.trim();
  if (clean.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' };
  }
  if (clean.length > 24) {
    return { isValid: false, error: 'Username cannot exceed 24 characters' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(clean)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }
  return { isValid: true };
}
