/**
 * Centralized API Helper Functions
 * 
 * Eliminates code duplication and provides reusable utilities for:
 * - Data transformations
 * - Error handling
 * - Request formatting
 * - Response validation
 */

import { AxiosError } from 'axios';

/**
 * Response validation utility
 */
export const validateApiResponse = <T>(response: unknown, requiredFields: (keyof T)[]): T => {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid response format');
  }

  const data = response as Record<string, unknown>;
  
  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new Error(`Missing required field: ${String(field)}`);
    }
  }

  return response as T;
};

/**
 * Generic error handler
 */
export const handleApiError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    if (error.response?.status === 401) {
      return 'Unauthorized access. Please log in again.';
    }
    
    if (error.response?.status === 403) {
      return 'Access denied. Insufficient permissions.';
    }
    
    if (error.response?.status === 404) {
      return 'Resource not found.';
    }
    
    if (error.response?.status >= 500) {
      return 'Server error. Please try again later.';
    }
    
    return error.response?.data?.message || 'Request failed';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

/**
 * Form data builder for file uploads
 */
export const buildFormData = (data: Record<string, unknown>): FormData => {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }
  });
  
  return formData;
};

/**
 * Query parameter builder with filtering
 */
export const buildQueryParams = (params: Record<string, unknown>): URLSearchParams => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  return searchParams;
};

/**
 * Pagination helper
 */
export const getPaginationInfo = (response: any): {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} => {
  const page = Number(response.page ?? 1);
  const limit = Number(response.pageSize ?? response.limit ?? 20);
  const total = Number(response.total ?? 0);
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

/**
 * Data sanitization for user inputs
 */
export const sanitizeInput = (input: unknown, type: 'string' | 'email' | 'number' = 'string'): unknown => {
  if (type === 'string') {
    return typeof input === 'string' ? input.trim() : '';
  }
  
  if (type === 'email') {
    return typeof input === 'string' ? input.trim().toLowerCase() : '';
  }
  
  if (type === 'number') {
    return typeof input === 'number' ? input : Number(String(input).replace(/[^\d.-]/g, '')) || 0;
  }
  
  return input;
};

/**
 * Date formatter utility
 */
export const formatApiDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString();
};

/**
 * Array chunk utility for batch operations
 */
export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  
  return chunks;
};

/**
 * Debounced function utility
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Retry utility for failed requests
 */
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Request failed');
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
};

/**
 * Cache utility for expensive operations
 */
export class SimpleCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private ttl: number;

  constructor(ttlMs: number = 5 * 60 * 1000) { // Default 5 minutes
    this.ttl = ttlMs;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }
}

/**
 * Environment configuration utility
 */
export const getEnvConfig = () => {
  const config = {
    apiUrl: process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, ''),
    googleMapsKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    environment: process.env.NODE_ENV,
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  };

  // Fallback for client-side when env vars are undefined
  if (typeof window !== 'undefined' && !config.apiUrl) {
    config.apiUrl = `${window.location.protocol}//${window.location.host}`;
  }

  return config;
};

export default {
  validateApiResponse,
  handleApiError,
  buildFormData,
  buildQueryParams,
  getPaginationInfo,
  sanitizeInput,
  formatApiDate,
  chunkArray,
  debounce,
  retryRequest,
  SimpleCache,
  getEnvConfig,
};
