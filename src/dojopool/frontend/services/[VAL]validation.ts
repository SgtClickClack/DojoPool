import analyticsService from './analytics';

interface ValidationRule {
  type: string;
  message?: string;
  params?: any;
}

interface ValidationSchema {
  [field: string]: ValidationRule[];
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

type ValidationFunction = (value: any, params?: any) => boolean | Promise<boolean>;

class ValidationService {
  private rules: Map<string, ValidationFunction> = new Map();
  private customMessages: Map<string, string> = new Map();

  constructor() {
    this.registerDefaultRules();
  }

  private registerDefaultRules(): void {
    // Required validation
    this.registerRule(
      'required',
      (value) => {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        return true;
      },
      'This field is required'
    );

    // Email validation
    this.registerRule(
      'email',
      (value) => {
        if (!value) return true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      },
      'Please enter a valid email address'
    );

    // Minimum length validation
    this.registerRule(
      'minLength',
      (value, min) => {
        if (!value) return true;
        return String(value).length >= min;
      },
      'This field must be at least {0} characters long'
    );

    // Maximum length validation
    this.registerRule(
      'maxLength',
      (value, max) => {
        if (!value) return true;
        return String(value).length <= max;
      },
      'This field must not exceed {0} characters'
    );

    // Pattern validation
    this.registerRule(
      'pattern',
      (value, pattern) => {
        if (!value) return true;
        const regex = new RegExp(pattern);
        return regex.test(value);
      },
      'This field is invalid'
    );

    // Numeric validation
    this.registerRule(
      'numeric',
      (value) => {
        if (!value) return true;
        return !isNaN(Number(value));
      },
      'Please enter a valid number'
    );

    // Integer validation
    this.registerRule(
      'integer',
      (value) => {
        if (!value) return true;
        return Number.isInteger(Number(value));
      },
      'Please enter a valid integer'
    );

    // Minimum value validation
    this.registerRule(
      'min',
      (value, min) => {
        if (!value) return true;
        return Number(value) >= min;
      },
      'This field must be at least {0}'
    );

    // Maximum value validation
    this.registerRule(
      'max',
      (value, max) => {
        if (!value) return true;
        return Number(value) <= max;
      },
      'This field must not exceed {0}'
    );

    // URL validation
    this.registerRule(
      'url',
      (value) => {
        if (!value) return true;
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      'Please enter a valid URL'
    );

    // Date validation
    this.registerRule(
      'date',
      (value) => {
        if (!value) return true;
        const date = new Date(value);
        return !isNaN(date.getTime());
      },
      'Please enter a valid date'
    );

    // Future date validation
    this.registerRule(
      'futureDate',
      (value) => {
        if (!value) return true;
        const date = new Date(value);
        return date > new Date();
      },
      'Please enter a future date'
    );

    // Past date validation
    this.registerRule(
      'pastDate',
      (value) => {
        if (!value) return true;
        const date = new Date(value);
        return date < new Date();
      },
      'Please enter a past date'
    );

    // Array minimum length validation
    this.registerRule(
      'minItems',
      (value, min) => {
        if (!Array.isArray(value)) return true;
        return value.length >= min;
      },
      'Please select at least {0} items'
    );

    // Array maximum length validation
    this.registerRule(
      'maxItems',
      (value, max) => {
        if (!Array.isArray(value)) return true;
        return value.length <= max;
      },
      'Please select no more than {0} items'
    );

    // Equal to validation
    this.registerRule(
      'equalTo',
      (value, targetValue) => {
        return value === targetValue;
      },
      'This field must match {0}'
    );

    // Not equal to validation
    this.registerRule(
      'notEqualTo',
      (value, targetValue) => {
        return value !== targetValue;
      },
      'This field must not match {0}'
    );

    // Contains validation
    this.registerRule(
      'contains',
      (value, substring) => {
        if (!value) return true;
        return String(value).includes(substring);
      },
      'This field must contain {0}'
    );

    // Does not contain validation
    this.registerRule(
      'notContains',
      (value, substring) => {
        if (!value) return true;
        return !String(value).includes(substring);
      },
      'This field must not contain {0}'
    );
  }

  public registerRule(type: string, validator: ValidationFunction, defaultMessage: string): void {
    this.rules.set(type, validator);
    this.customMessages.set(type, defaultMessage);

    // Track rule registration in analytics
    analyticsService.trackUserEvent({
      type: 'validation_rule_registered',
      userId: 'system',
      details: {
        ruleType: type,
        timestamp: new Date().toISOString(),
      },
    });
  }

  public setCustomMessage(type: string, message: string): void {
    this.customMessages.set(type, message);
  }

  private formatMessage(message: string, params?: any): string {
    if (!params) return message;
    return message.replace(/\{(\d+)\}/g, (match, index) => {
      return params[index] !== undefined ? params[index] : match;
    });
  }

  public async validate(
    schema: ValidationSchema,
    data: Record<string, any>
  ): Promise<ValidationResult> {
    const errors: Record<string, string[]> = {};
    let isValid = true;

    try {
      // Track validation start
      analyticsService.trackUserEvent({
        type: 'validation_started',
        userId: 'system',
        details: {
          timestamp: new Date().toISOString(),
        },
      });

      for (const [field, rules] of Object.entries(schema)) {
        const fieldErrors = await this.validateField(field, rules, data[field], data);
        if (fieldErrors.length > 0) {
          errors[field] = fieldErrors;
          isValid = false;
        }
      }

      // Track validation completion
      analyticsService.trackUserEvent({
        type: 'validation_completed',
        userId: 'system',
        details: {
          isValid,
          errorCount: Object.keys(errors).length,
          timestamp: new Date().toISOString(),
        },
      });

      return { isValid, errors };
    } catch (error) {
      // Track validation error
      analyticsService.trackUserEvent({
        type: 'validation_error',
        userId: 'system',
        details: {
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      });

      throw error;
    }
  }

  public async validateField(
    field: string,
    rules: ValidationRule[],
    value: any,
    data?: Record<string, any>
  ): Promise<string[]> {
    const errors: string[] = [];

    for (const rule of rules) {
      const validator = this.rules.get(rule.type);
      if (!validator) {
        console.warn(`Validation rule '${rule.type}' not found`);
        continue;
      }

      try {
        const isValid = await validator(value, rule.params);
        if (!isValid) {
          const message = rule.message || this.customMessages.get(rule.type) || 'Invalid value';
          errors.push(this.formatMessage(message, rule.params));
        }
      } catch (error) {
        console.error(`Validation error for field ${field}:`, error);
        errors.push('Validation failed');
      }
    }

    return errors;
  }

  public async validateAsync(
    schema: ValidationSchema,
    data: Record<string, any>,
    onProgress?: (progress: number) => void
  ): Promise<ValidationResult> {
    const fields = Object.keys(schema);
    const totalFields = fields.length;
    const errors: Record<string, string[]> = {};
    let validatedFields = 0;

    try {
      // Track async validation start
      analyticsService.trackUserEvent({
        type: 'async_validation_started',
        userId: 'system',
        details: {
          fieldCount: totalFields,
          timestamp: new Date().toISOString(),
        },
      });

      await Promise.all(
        fields.map(async (field) => {
          const fieldErrors = await this.validateField(field, schema[field], data[field], data);
          if (fieldErrors.length > 0) {
            errors[field] = fieldErrors;
          }
          validatedFields++;
          onProgress?.(validatedFields / totalFields);
        })
      );

      const isValid = Object.keys(errors).length === 0;

      // Track async validation completion
      analyticsService.trackUserEvent({
        type: 'async_validation_completed',
        userId: 'system',
        details: {
          isValid,
          errorCount: Object.keys(errors).length,
          timestamp: new Date().toISOString(),
        },
      });

      return { isValid, errors };
    } catch (error) {
      // Track async validation error
      analyticsService.trackUserEvent({
        type: 'async_validation_error',
        userId: 'system',
        details: {
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      });

      throw error;
    }
  }

  public createSchema(schema: ValidationSchema): ValidationSchema {
    // Validate schema structure
    for (const [field, rules] of Object.entries(schema)) {
      for (const rule of rules) {
        if (!this.rules.has(rule.type)) {
          throw new Error(
            `Unknown validation rule type '${rule.type}' in schema for field '${field}'`
          );
        }
      }
    }
    return schema;
  }
}

// Create a singleton instance
const validationService = new ValidationService();

export default validationService;
