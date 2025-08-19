import { z } from 'zod';

// Basic validation schemas
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must be less than 255 characters');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be less than 72 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character'
  );

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens'
  );

// Alert validation schemas
export const alertSchema = z.object({
  id: z.string().uuid('Invalid alert ID'),
  type: z.enum(['ERROR', 'WARNING', 'INFO', 'SUCCESS'], {
    errorMap: () => ({ message: 'Invalid alert type' }),
  }),
  status: z.enum(['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'], {
    errorMap: () => ({ message: 'Invalid alert status' }),
  }),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(500, 'Message is too long'),
  timestamp: z.string().datetime('Invalid timestamp'),
  source: z.string().min(1, 'Source is required'),
  impactScore: z.number().min(0).max(100),
});

// API request validation
export const apiRequestSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  path: z.string().min(1),
  query: z.record(z.string()).optional(),
  body: z.unknown().optional(),
  headers: z.record(z.string()).optional(),
});

// Custom validators
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateDateRange = (startDate: Date, endDate: Date): boolean => {
  return startDate <= endDate;
};

export const validateFileSize = (size: number, maxSize: number): boolean => {
  return size <= maxSize;
};

export const validateFileType = (
  type: string,
  allowedTypes: string[]
): boolean => {
  return allowedTypes.includes(type);
};

// Validation helper functions
export const validateInput = async <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const validatedData = await schema.parseAsync(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((err) => err.message).join(', '),
      };
    }
    return {
      success: false,
      error: 'Validation failed',
    };
  }
};

export const validateForm = async <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  onSuccess?: (data: T) => void,
  onError?: (error: string) => void
): Promise<boolean> => {
  const result = await validateInput(schema, data);

  if (result.success && result.data) {
    onSuccess?.(result.data);
    return true;
  }

  if (result.error) {
    onError?.(result.error);
  }

  return false;
};

// Security validation
export const validateToken = (token: string): boolean => {
  // JWT format validation
  const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
  return jwtRegex.test(token);
};

export const validateCSRFToken = (
  token: string,
  expectedToken: string
): boolean => {
  return token === expectedToken;
};

// Rate limiting validation
export const createRateLimiter = (limit: number, windowMs: number) => {
  const requests = new Map<string, number[]>();

  return (key: string): boolean => {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests and filter out old ones
    const existing = requests.get(key) || [];
    const recent = existing.filter((time) => time > windowStart);

    // Update requests
    requests.set(key, recent);

    // Check if limit is exceeded
    if (recent.length >= limit) {
      return false;
    }

    // Add new request
    recent.push(now);
    requests.set(key, recent);

    return true;
  };
};

// Export validation types
export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type ValidationFunction<T> = (
  data: unknown
) => Promise<ValidationResult<T>>;
