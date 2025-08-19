/**
 * Validates an email address.
 * @param email - The email address to validate.
 * @returns True if the email is valid, false otherwise.
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates a password.
 * Requirements:
 * - At least 8 characters long
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one number
 * - Contains at least one special character
 * @param password - The password to validate.
 * @returns True if the password meets all requirements, false otherwise.
 */
export const validatePassword = (password: string): boolean => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChar
  );
};

/**
 * Validates a username.
 * Requirements:
 * - Between 3 and 20 characters long
 * - Contains only alphanumeric characters, underscores, and hyphens
 * - Starts with a letter
 * @param username - The username to validate.
 * @returns True if the username meets all requirements, false otherwise.
 */
export const validateUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_-]{2,19}$/;
  return usernameRegex.test(username);
};
