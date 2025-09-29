/**
 * Security Middleware
 * 
 * Implements security-specific middleware for:
 * - Request sanitization
 * - CSRF protection
 * - Content Security Policy
 * - Input validation
 */

import type { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Security headers configuration
 */
const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

/**
 * Content Security Policy
 */
const CSP_HEADER = "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' maps.googleapis.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: maps.googleapis.com maps.gstatic.com; connect-src 'self' ws: wss: maps.googleapis.com; frame-src 'self' maps.googleapis.com;";

/**
 * Sanitize request headers
 */
const sanitizeHeaders = (req: NextRequest): void => {
  // Remove potentially harmful headers
  const headersToRemove = [
    'x-forwarded-host',
    'x-real-ip',
    'x-cluster-client-ip',
    'x-forwarded',
    'forwarded-for',
    'forwarded',
  ];
  
  headersToRemove.forEach(header => {
    req.headers.delete(header);
  });
};

/**
 * Validate request origin
 */
const validateOrigin = (req: NextRequest): boolean => {
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  
  // Allow same-origin requests
  if (!origin) return true;
  
  // Validate origin matches host for same-origin requests
  if (origin.includes('://') && host) {
    const originHost = origin.split('://')[1];
    return originHost === host;
  }
  
  // Allow trusted domains (add your domain here)
  const trustedDomains = [
    process.env.NEXT_PUBLIC_WEB_URL,
    'localhost:3000',
    '127.0.0.1:3000',
  ].filter(Boolean);
  
  return trustedDomains.some(domain => 
    origin.includes(domain)
  );
};

/**
 * Generate CSRF token
 */
const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Validate CSRF token
 */
const validateCSRFToken = (req: NextRequest, providedToken?: string): boolean => {
  // Skip CSRF validation for GET requests with safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return true;
  }
  
  // Get token from header or cookie
  const headerToken = req.headers.get('x-csrf-token');
  const cookieToken = req.cookies.get('csrf-token')?.value;
  const token = providedToken || headerToken || cookieToken;
  
  if (!token) return false;
  
  // For development, accept any token
  if (process.env.NODE_ENV === 'development') {
    return token.length >= 10;
  }
  
  // TODO: Implement proper CSRF token validation
  // This would involve comparing against stored token in session/database
  return token.length === 64; // Basic format validation
};

/**
 * Sanitize request body for potentially harmful content
 */
const sanitizeRequestBody = async (req: NextRequest): Promise<any> => {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return undefined;
  }
  
  try {
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const body = await req.json();
      
      // Deep sanitization of JSON objects
      const sanitized = deepSanitizeObject(body);
      
      return sanitized;
    }
    
    if (contentType.includes('multipart/form-data')) {
      // For file uploads, we can't easily sanitize the entire request
      // but we can validate file names and types
      return undefined; // Let Next.js handle it, validate at endpoint level
    }
    
    return undefined;
  } catch (error) {
    console.error('Error sanitizing request body:', error);
    throw new Error('Invalid request format');
  }
};

/**
 * Deep sanitize object to remove potentially harmful values
 */
const deepSanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(deepSanitizeObject);
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeString(key)] = deepSanitizeObject(value);
      }
    return sanitized;
  }
  
  return obj;
};

/**
 * Sanitize string to remove potentially harmful content
 */
const sanitizeString = (str: string): string => {
  // Remove null bytes
  str = str.replace(/\0/g, '');
  
  // Replace multiple spaces with single space
  str = str.replace(/\s+/g, ' ');
  
  // Trim string
  str = str.trim();
  
  // Remove potentially harmful patterns (basic XSS prevention)
  str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  str = str.replace(/javascript:/gi, '');
  str = str.replace(/on\w+\s*=/gi, '');
  
  return str;
};

/**
 * Security middleware main function
 */
export async function securityMiddleware(req: NextRequest): Promise<NextResponse | undefined> {
  // Apply security headers to all responses
  const response = NextResponse.next();
  
  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Add CSP header
  response.headers.set('Content-Security-Policy', CSP_HEADER);
  
  // Validate origin
  if (!validateOrigin(req)) {
    return NextResponse.json(
      { error: 'Invalid origin' },
      { status: 403 }
    );
  }
  
  // Sanitize headers
  sanitizeHeaders(req);
  
  // Validate CSRF token for state-changing requests
  if (!validateCSRFToken(req)) {
    return NextResponse.json(
      { 
        error: 'CSRF token validation failed',
        message: 'Please refresh the page and try again',
      },
      { status: 403 }
    );
  }
  
  try {
    // Sanitize request body
    await sanitizeRequestBody(req);
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    );
  }
  
  return undefined;
}

/**
 * Helper to add security validation to API routes
 */
export function withSecurity(req: NextRequest, res?: NextResponse) {
  const response = res || NextResponse.next();
  
  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  response.headers.set('Content-Security-Policy', CSP_HEADER);
  
  return response;
}

/**
 * CORS helper for API routes
 */
export function corsHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_WEB_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ].filter(Boolean);
  
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
    'Access-Control-Max-Age': '86400',
  };
  
  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  } else if (process.env.NODE_ENV === 'development') {
    headers['Access-Control-Allow-Origin'] = origin || '*';
    headers['Access-Control-Allow-Credentials'] = 'false';
  }
  
  return headers;
}

export { generateCSRFToken };
export default securityMiddleware;
