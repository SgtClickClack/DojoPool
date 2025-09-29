/**
 * Validation Utilities
 * 
 * Centralized validation functions to eliminate duplication
 * and ensure consistent validation across the application.
 */

/**
 * Generic validator class for composable validation rules
 */
export class Validator<T> {
  private rules: Array<(value: T) => string | null> = [];
  
  addRule(rule: (value: T) => string | null): Validator<T> {
    this.rules.push(rule);
    return this;
  }
  
  validate(value: T): string | null {
    for (const rule of this.rules) {
      const error = rule(value);
      if (error) return error;
    }
    return null;
  }
  
  isValid(value: T): boolean {
    return this.validate(value) === null;
  }
}

/**
 * Email validation
 */
export const emailValidator = new Validator<string>()
  .addRule((email) => {
    if (!email) return 'Email is required';
    if (typeof email !== 'string') return 'Email must be a string';
    if (email.length > 254) return 'Email is too long';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Invalid email format';
    
    return null;
  });

/**
 * Password validation
 */
export const passwordValidator = new Validator<string>()
  .addRule((password) => {
    if (!password) return 'Password is required';
    if (typeof password !== 'string') return 'Password must be a string';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (password.length > 128) return 'Password is too long';
    
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    
    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    
    // Check for at least one number
    if (!/\d/.test(password)) {
      return 'Password must contain at least one number';
    }
    
    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      return 'Password must contain at least one special character';
    }
    
    return null;
  });

/**
 * Username validation
 */
export const usernameValidator = new Validator<string>()
  .addRule((username) => {
    if (!username) return 'Username is required';
    if (typeof username !== 'string') return 'Username must be a string';
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (username.length > 30) return 'Username is too long';
    
    // Only allow alphanumeric characters and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    
    // Must start with a letter
    if (!/^[a-zA-Z]/.test(username)) {
      return 'Username must start with a letter';
    }
    
    return null;
  });

/**
 * URL validation
 */
export const urlValidator = new Validator<string>()
  .addRule((url) => {
    if (!url) return 'URL is required';
    if (typeof url !== 'string') return 'URL must be a string';
    
    try {
      new URL(url);
      return null;
    } catch {
      return 'Invalid URL format';
    }
  });

/**
 * Phone number validation (US format)
 */
export const phoneValidator = new Validator<string>()
  .addRule((phone) => {
    if (!phone) return 'Phone number is required';
    if (typeof phone !== 'string') return 'Phone number must be a string';
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length !== 10) {
      return 'Phone number must be 10 digits';
    }
    
    return null;
  });

/**
 * Date validation
 */
export const dateValidator = new Validator<string | Date>()
  .addRule((date) => {
    if (!date) return 'Date is required';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date format';
    }
    
    return null;
  });

/**
 * Number validation
 */
export const numberValidator = (min?: number, max?: number) => {
  return new Validator<number>()
    .addRule((num) => {
      if (typeof num !== 'number') return 'Value must be a number';
      if (isNaN(num)) return 'Value must be a valid number';
      
      if (min !== undefined && num < min) {
        return `Value must be at least ${min}`;
      }
      
      if (max !== undefined && num > max) {
        return `Value must be at most ${max}`;
      }
      
      return null;
    });
};

/**
 * String length validation
 */
export const stringLengthValidator = (min: number, max: number) => {
  return new Validator<string>()
    .addRule((str) => {
      if (typeof str !== 'string') return 'Value must be a string';
      
      if (str.length < min) {
        return `String must be at least ${min} characters`;
      }
      
      if (str.length > max) {
        return `String must be at most ${max} characters`;
      }
      
      return null;
    });
};

/**
 * Array validation
 */
export const arrayValidator = (minLength?: number, maxLength?: number) => {
  return new Validator<any[]>()
    .addRule((arr) => {
      if (!Array.isArray(arr)) return 'Value must be an array';
      
      if (minLength !== undefined && arr.length < minLength) {
        return `Array must have at least ${minLength} items`;
      }
      
      if (maxLength !== undefined && arr.length > maxLength) {
        return `Array must have at most ${maxLength} items`;
      }
      
      return null;
    });
};

/**
 * Object validation
 */
export const objectValidator = (requiredFields: string[] = []) => {
  return new Validator<Record<string, any>>()
    .addRule((obj) => {
      if (typeof obj !== 'object' || obj === null) {
        return 'Value must be an object';
      }
      
      for (const field of requiredFields) {
        if (!(field in obj)) {
          return `Missing required field: ${field}`;
        }
      }
      
      return null;
    });
};

/**
 * File validation
 */
export const fileValidator = (maxSize?: number, allowedTypes?: string[]) => {
  return new Validator<File>()
    .addRule((file) => {
      if (!(file instanceof File)) return 'Value must be a file';
      
      if (maxSize && file.size > maxSize) {
        return `File size must be less than ${maxSize} bytes`;
      }
      
      if (allowedTypes && !allowedTypes.includes(file.type)) {
        return `File type must be one of: ${allowedTypes.join(', ')}`;
      }
      
      return null;
    });
};

/**
 * Geographic coordinate validation
 */
export const coordinateValidator = new Validator<{ lat: number; lng: number }>()
  .addRule((coord) => {
    if (!coord || typeof coord !== 'object') {
      return 'Coordinate must be an object';
    }
    
    if (typeof coord.lat !== 'number' || isNaN(coord.lat)) {
      return 'Latitude must be a valid number';
    }
    
    if (typeof coord.lng !== 'number' || isNaN(coord.lng)) {
      return 'Longitude must be a valid number';
    }
    
    if (coord.lat < -90 || coord.lat > 90) {
      return 'Latitude must be between -90 and 90';
    }
    
    if (coord.lng < -180 || coord.lng > 180) {
      return 'Longitude must be between -180 and 180';
    }
    
    return null;
  });

/**
 * XSS prevention validation
 */
export const xssValidator = new Validator<string>()
  .addRule((str) => {
    if (typeof str !== 'string') return 'Value must be a string';
    
    // Check for common XSS patterns
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    ];
    
    for (const pattern of xssPatterns) {
      if (pattern.test(str)) {
        return 'Content contains potentially dangerous code';
      }
    }
    
    return null;
  });

/**
 * SQL injection prevention validation
 */
export const sqlInjectionValidator = new Validator<string>()
  .addRule((str) => {
    if (typeof str !== 'string') return 'Value must be a string';
    
    // Check for common SQL injection patterns
    const sqlPatterns = [
      /[';*%+&^()[\]{}~`!@#$%^&*()+={}[\]|\\;:"'<>,.?/\s]/gi,
      /(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript|onload|onerror|onclick)/gi,
    ];
    
    for (const pattern of sqlPatterns) {
      if (pattern.test(str)) {
        return 'Content contains potentially dangerous SQL patterns';
      }
    }
    
    return null;
  });

/**
 * Form validation helper
 */
export const validateForm = <T extends Record<string, any>>(
  data: T,
  validators: Partial<Record<keyof T, Validator<any>>>
): Record<keyof T, string | null> => {
  const errors: Record<keyof T, string | null> = {} as any;
  
  for (const [field, validator] of Object.entries(validators)) {
    if (validator) {
      errors[field as keyof T] = validator.validate(data[field]);
    }
  }
  
  return errors;
};

/**
 * Check if form has any errors
 */
export const hasFormErrors = (errors: Record<string, string | null>): boolean => {
  return Object.values(errors).some(error => error !== null);
};