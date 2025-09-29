/**
 * Centralized Validation Utilities
 * 
 * Provides consistent validation across the application:
 * - Input sanitization
 * - Schema validation
 * - Business rule validation
 * - Security validation
 */

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Password strength validation
 */
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

/**
 * Username validation regex (alphanumeric + underscore, dash)
 */
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

/**
 * URL validation regex
 */
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Generic validator class
 */
export class Validator<T> {
  private rules: Array<(value: T) => string | null> = [];

  addRule(rule: (value: T) => string | null): this {
    this.rules.push(rule);
    return this;
  }

  validate(value: T): ValidationResult {
    const errors: string[] = [];

    for (const rule of this.rules) {
      const error = rule(value);
      if (error) {
        errors.push(error);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Basic validation functions
 */
export const isRequired = <T>(value: T): string | null => {
  if (value === null || value === undefined || value === '') {
    return 'This field is required';
  }
  return null;
};

export const isString = <T>(value: T): string | null => {
  if (value !== null && value !== undefined && typeof value !== 'string') {
    return 'Value must be a string';
  }
  return null;
};

export const isNumber = <T>(value: T): string | null => {
  if (value !== null && value !== undefined && typeof value !== 'number') {
    return 'Value must be a number';
  }
  return null;
};

export const isBoolean = <T>(value: T): string | null => {
  if (value !== null && value !== undefined && typeof value !== 'boolean') {
    return 'Value must be a boolean';
  }
  return null;
};

/**
 * String validation functions
 */
export const minLength = (min: number) => <T>(value: T): string | null => {
  if (typeof value === 'string' && value.length < min) {
    return `Must be at least ${min} characters long`;
  }
  return null;
};

export const maxLength = (max: number) => <T>(value: T): string | null => {
  if (typeof value === 'string' && value.length > max) {
    return `Must be no more than ${max} characters long`;
  }
  return null;
};

export const emailFormat = <T>(value: T): string | null => {
  if (typeof value === 'string' && value.length > 0 && !EMAIL_REGEX.test(value)) {
    return 'Please enter a valid email address';
  }
  return null;
};

export const strongPassword = <T>(value: T): string | null => {
  if (typeof value !== 'string') return null;

  const { minLength, maxLength, requireUppercase, requireLowercase, requireNumbers, requireSpecialChars } = PASSWORD_REQUIREMENTS;

  if (value.length < minLength) {
    return `Password must be at least ${minLength} characters long`;
  }

  if (value.length > maxLength) {
    return `Password must be no more than ${maxLength} characters long`;
  }

  if (requireUppercase && !/[A-Z]/.test(value)) {
    return 'Password must contain at least one uppercase letter';
  }

  if (requireLowercase && !/[a-z]/.test(value)) {
    return 'Password must contain at least one lowercase letter';
  }

  if (requireNumbers && !/\d/.test(value)) {
    return 'Password must contain at least one number';
  }

  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
    return 'Password must contain at least one special character';
  }

  return null;
};

export const validUsername = <T>(value: T): string | null => {
  if (typeof value === 'string' && value.length > 0 && !USERNAME_REGEX.test(value)) {
    return 'Username must be 3-30 characters and contain only letters, numbers, underscores, and dashes';
  }
  return null;
};

export const validUrl = <T>(value: T): string | null => {
  if (typeof value === 'string' && value.length > 0 && !URL_REGEX.test(value)) {
    return 'Please enter a valid URL';
  }
  return null;
};

/**
 * Number validation functions
 */
export const minValue = (min: number) => <T>(value: T): string | null => {
  if (typeof value === 'number' && value < min) {
    return `Value must be at least ${min}`;
  }
  return null;
};

export const maxValue = (max: number) => <T>(value: T): string | null => {
  if (typeof value === 'number' && value > max) {
    return `Value must be no more than ${max}`;
  }
  return null;
};

/**
 * Array validation functions

export const minItems = (min: number) => <T>(value: T): string | null => {
  if (Array.isArray(value) && value.length < min) {
    return `Must have at least ${min} items`;
  }
  return null;
};

export const maxItems = (max: number) => <T>(value: T): string | null => {
  if (Array.isArray(value) && value.length > max) {
    return `Must have no more than ${max} items`;
  }
  return null;
};

/**
 * Pattern validation functions
 */
export const matchesPattern = (pattern: RegExp, message: string) => <T>(value: T): string | null => {
  if (typeof value === 'string' && value.length > 0 && !pattern.test(value)) {
    return message;
  }
  return null;
};

/**
 * Geographic validation functions
 */
export const isValidLatitude = <T>(value: T): string | null => {
  if (typeof value === 'number' && (value < -90 || value > 90)) {
    return 'Latitude must be between -90 and 90 degrees';
  }
  return null;
};

export const isValidLongitude = <T>(value: T): string | null => {
  if (typeof value === 'number' && (value < -180 || value > 180)) {
    return 'Longitude must be between -180 and 180 degrees';
  }
  return null;
};

/**
 * Security validation functions
 */
export const hasNoScriptTags = <T>(value: T): string | null => {
  if (typeof value === 'string' && /<script/i.test(value)) {
    return 'Input contains invalid content';
  }
  return null;
};

export const hasNoSqlInjection = <T>(value: T): string | null => {
  if (typeof value === 'string' && /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i.test(value)) {
    return 'Input contains potentially harmful content';
  }  
  return null;
};

/**
 * Pre-built validators for common use cases
 */
export const emailValidator = new Validator<string>()
  .addRule(isRequired)
  .addRule(emailFormat);

export const passwordValidator = new Validator<string>()
  .addRule(isRequired)
  .addRule(strongPassword);

export const usernameValidator = new Validator<string>()
  .addRule(isRequired)
  .addRule(validUsername);

export const urlValidator = new Validator<string>()
  .addRule(isRequired)
  .addRule(validUrl);

export const latitudeValidator = new Validator<number>()
  .addRule(isRequired)
  .addRule(isNumber)
  .addRule(isValidLatitude);

export const longitudeValidator = new Validator<number>()
  .addRule(isRequired)
  .addRule(isNumber)
  .addRule(isValidLongitude);

export const feedbackContentValidator = new Validator<string>()
  .addRule(isRequired)
  .addRule(minLength(10))
  .addRule(maxLength(1000))
  .addRule(hasNoScriptTags);

/**
 * Validation helper for form submissions
 */
export const validateForm = <T extends Record<string, unknown>>(
  data: T,
  validators: Partial<Record<keyof T, Validator<any>>>
): ValidationResult & { fieldErrors: Record<string, string[]> } => {
  const fieldErrors: Record<string, string[]> = {};
  const globalErrors: string[] = [];

  for (const [field, validator] of Object.entries(validators)) {
    if (validator && data[field] !== undefined) {
      const result = validator.validate(data[field]);
      if (!result.isValid) {
        fieldErrors[field] = result.errors;
      }
    }
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    errors: globalErrors,
    fieldErrors,
  };
};

export default {
  Validator,
  emailValidator,
  passwordValidator,
  usernameValidator,
  urlValidator,
  latitudeValidator,
  longitudeValidator,
  feedbackContentValidator,
  validateForm,
};
