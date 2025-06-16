/**
 * Validation middleware for API requests
 */

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'email' | 'boolean' | 'array';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export class ValidationMiddleware {
  private rules: ValidationRule[];

  constructor(rules: ValidationRule[] = []) {
    this.rules = rules;
  }

  /**
   * Validate request data against defined rules
   */
  validate(data: any): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const rule of this.rules) {
      const value = data[rule.field];
      
      // Check if required
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: rule.field,
          message: `${rule.field} is required`,
          value
        });
        continue;
      }

      // Skip validation if value is not provided and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Type validation
      if (!this.validateType(value, rule.type)) {
        errors.push({
          field: rule.field,
          message: `${rule.field} must be of type ${rule.type}`,
          value
        });
        continue;
      }

      // String validations
      if (rule.type === 'string' && typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push({
            field: rule.field,
            message: `${rule.field} must be at least ${rule.minLength} characters`,
            value
          });
        }
        
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push({
            field: rule.field,
            message: `${rule.field} must be at most ${rule.maxLength} characters`,
            value
          });
        }

        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push({
            field: rule.field,
            message: `${rule.field} format is invalid`,
            value
          });
        }
      }

      // Number validations
      if (rule.type === 'number' && typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push({
            field: rule.field,
            message: `${rule.field} must be at least ${rule.min}`,
            value
          });
        }
        
        if (rule.max !== undefined && value > rule.max) {
          errors.push({
            field: rule.field,
            message: `${rule.field} must be at most ${rule.max}`,
            value
          });
        }
      }

      // Array validations
      if (rule.type === 'array' && Array.isArray(value)) {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push({
            field: rule.field,
            message: `${rule.field} must have at least ${rule.minLength} items`,
            value
          });
        }
        
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push({
            field: rule.field,
            message: `${rule.field} must have at most ${rule.maxLength} items`,
            value
          });
        }
      }

      // Custom validation
      if (rule.custom && !rule.custom(value)) {
        errors.push({
          field: rule.field,
          message: `${rule.field} failed custom validation`,
          value
        });
      }
    }

    return errors;
  }

  private validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'email':
        return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      default:
        return true;
    }
  }
}

/**
 * Common validation rules
 */
export const commonRules = {
  email: {
    field: 'email',
    type: 'email' as const,
    required: true
  },
  password: {
    field: 'password',
    type: 'string' as const,
    required: true,
    minLength: 8
  },
  username: {
    field: 'username',
    type: 'string' as const,
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_-]+$/
  }
};

/**
 * Create validation middleware for specific endpoints
 */
export function createValidationMiddleware(rules: ValidationRule[]) {
  const validator = new ValidationMiddleware(rules);
  
  return (req: any, res: any, next: any) => {
    const errors = validator.validate(req.body);
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    next();
  };
} 