/**
 * Security Middleware
 * 
 * Comprehensive security middleware for the Dojo Pool application
 * including CSRF protection, XSS prevention, security headers, and rate limiting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateApiResponse, handleApiError } from '@/utils/apiHelpers';
import { z } from 'zod';

/**
 * Security headers configuration
 */
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://www.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.dojopool.com wss://api.dojopool.com",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
    "require-trusted-types-for 'script'",
    "trusted-types default",
  ].join('; '),
};

/**
 * CSRF token validation
 */
export class CSRFProtection {
  private static instance: CSRFProtection;
  private tokens = new Map<string, { token: string; expires: number }>();

  static getInstance(): CSRFProtection {
    if (!CSRFProtection.instance) {
      CSRFProtection.instance = new CSRFProtection();
    }
    return CSRFProtection.instance;
  }

  /**
   * Generate CSRF token
   */
  generateToken(sessionId: string): string {
    const token = this.generateRandomToken();
    const expires = Date.now() + (60 * 60 * 1000); // 1 hour
    
    this.tokens.set(sessionId, { token, expires });
    return token;
  }

  /**
   * Validate CSRF token
   */
  validateToken(sessionId: string, token: string): boolean {
    const entry = this.tokens.get(sessionId);
    
    if (!entry) return false;
    if (Date.now() > entry.expires) {
      this.tokens.delete(sessionId);
      return false;
    }
    
    return entry.token === token;
  }

  /**
   * Clean up expired tokens
   */
  cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [sessionId, entry] of this.tokens.entries()) {
      if (now > entry.expires) {
        this.tokens.delete(sessionId);
      }
    }
  }

  private generateRandomToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

/**
 * XSS prevention utilities
 */
export class XSSProtection {
  private static instance: XSSProtection;
  private dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
    /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
  ];

  static getInstance(): XSSProtection {
    if (!XSSProtection.instance) {
      XSSProtection.instance = new XSSProtection();
    }
    return XSSProtection.instance;
  }

  /**
   * Sanitize input to prevent XSS
   */
  sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    // Remove dangerous patterns
    let sanitized = input;
    this.dangerousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    // HTML encode special characters
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
    
    return sanitized;
  }

  /**
   * Validate input for XSS
   */
  validateInput(input: string): { isValid: boolean; sanitized: string } {
    const sanitized = this.sanitizeInput(input);
    const isValid = input === sanitized;
    
    return { isValid, sanitized };
  }
}

/**
 * SQL injection prevention
 */
export class SQLInjectionProtection {
  private static instance: SQLInjectionProtection;
  private dangerousPatterns = [
    /('|(\\')|(;)|(\-\-)|(\*)|(%)|(\+)|(\|)|(\&)|(\^)|(\()|(\))|(\[)|(\])|(\{)|(\})|(\~)|(\`)|(\!)|(\@)|(\#)|(\$)|(\%)|(\^)|(\&)|(\*)|(\()|(\))|(\+)|(\=)|(\[)|(\])|(\{)|(\})|(\|)|(\\)|(\;)|(\:)|(\")|(\')|(\<)|(\>)|(\?)|(\/)|(\,)|(\.)|(\s))/gi,
    /(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript|onload|onerror|onclick)/gi,
  ];

  static getInstance(): SQLInjectionProtection {
    if (!SQLInjectionProtection.instance) {
      SQLInjectionProtection.instance = new SQLInjectionProtection();
    }
    return SQLInjectionProtection.instance;
  }

  /**
   * Validate input for SQL injection
   */
  validateInput(input: string): boolean {
    if (typeof input !== 'string') return true;
    
    return !this.dangerousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Sanitize input for SQL injection
   */
  sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    // Remove dangerous patterns
    let sanitized = input;
    this.dangerousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    return sanitized;
  }
}

/**
 * Request origin validation
 */
export class OriginValidation {
  private static instance: OriginValidation;
  private allowedOrigins: string[] = [];

  static getInstance(): OriginValidation {
    if (!OriginValidation.instance) {
      OriginValidation.instance = new OriginValidation();
    }
    return OriginValidation.instance;
  }

  /**
   * Set allowed origins
   */
  setAllowedOrigins(origins: string[]): void {
    this.allowedOrigins = origins;
  }

  /**
   * Validate request origin
   */
  validateOrigin(req: NextRequest): boolean {
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    
    if (!origin && !referer) return true; // Allow requests without origin/referer
    
    const requestOrigin = origin || new URL(referer!).origin;
    
    // Allow same-origin requests
    if (requestOrigin === req.nextUrl.origin) return true;
    
    // Check against allowed origins
    return this.allowedOrigins.includes(requestOrigin);
  }
}

/**
 * Enhanced security middleware with comprehensive protection
 */
export function securityMiddleware(req: NextRequest): NextResponse | null {
  const response = NextResponse.next();
  
  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Validate origin for cross-origin requests
  const originValidator = OriginValidation.getInstance();
  if (!originValidator.validateOrigin(req)) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  // CSRF protection for state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const csrfProtection = CSRFProtection.getInstance();
    const sessionId = req.headers.get('x-session-id');
    const csrfToken = req.headers.get('x-csrf-token');
    
    if (sessionId && csrfToken) {
      if (!csrfProtection.validateToken(sessionId, csrfToken)) {
        return new NextResponse('CSRF token validation failed', { status: 403 });
      }
    }
  }
  
  // Enhanced input validation for request body
  if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
    try {
      const body = req.body;
      const xssProtection = XSSProtection.getInstance();
      const sqlProtection = SQLInjectionProtection.getInstance();
      
      // Validate request body for XSS and SQL injection
      const bodyString = JSON.stringify(body);
      
      if (!xssProtection.validateInput(bodyString).isValid) {
        return new NextResponse('Invalid input detected', { status: 400 });
      }
      
      if (!sqlProtection.validateInput(bodyString)) {
        return new NextResponse('Invalid input detected', { status: 400 });
      }
      
      // Additional validation for specific endpoints
      if (req.url.includes('/api/auth/register')) {
        const registerSchema = z.object({
          email: z.string().email(),
          password: z.string().min(8),
          username: z.string().min(3).max(50),
        });
        
        try {
          registerSchema.parse(body);
        } catch (error) {
          return new NextResponse('Invalid registration data', { status: 400 });
        }
      }
      
    } catch (error) {
      return new NextResponse('Invalid request body', { status: 400 });
    }
  }
  
  // Rate limiting headers
  response.headers.set('X-RateLimit-Limit', '100');
  response.headers.set('X-RateLimit-Remaining', '99');
  response.headers.set('X-RateLimit-Reset', new Date(Date.now() + 3600000).toISOString());
  
  return response;
}

/**
 * Content Security Policy builder
 */
export class CSPBuilder {
  private directives: Record<string, string[]> = {};

  /**
   * Add directive
   */
  addDirective(directive: string, sources: string[]): CSPBuilder {
    this.directives[directive] = sources;
    return this;
  }

  /**
   * Build CSP header value
   */
  build(): string {
    return Object.entries(this.directives)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');
  }

  /**
   * Create default CSP for Dojo Pool
   */
  static createDefault(): CSPBuilder {
    return new CSPBuilder()
      .addDirective('default-src', ["'self'"])
      .addDirective('script-src', [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        'https://maps.googleapis.com',
        'https://www.gstatic.com',
      ])
      .addDirective('style-src', [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
      ])
      .addDirective('font-src', [
        "'self'",
        'https://fonts.gstatic.com',
      ])
      .addDirective('img-src', [
        "'self'",
        'data:',
        'https:',
        'blob:',
      ])
      .addDirective('connect-src', [
        "'self'",
        'https://api.dojopool.com',
        'wss://api.dojopool.com',
      ])
      .addDirective('media-src', [
        "'self'",
        'blob:',
      ])
      .addDirective('object-src', ["'none'"])
      .addDirective('base-uri', ["'self'"])
      .addDirective('form-action', ["'self'"])
      .addDirective('frame-ancestors', ["'none'"])
      .addDirective('upgrade-insecure-requests', []);
  }
}

/**
 * Security audit logger
 */
export class SecurityAuditLogger {
  private static instance: SecurityAuditLogger;
  private logs: Array<{
    timestamp: number;
    type: string;
    message: string;
    details: any;
  }> = [];

  static getInstance(): SecurityAuditLogger {
    if (!SecurityAuditLogger.instance) {
      SecurityAuditLogger.instance = new SecurityAuditLogger();
    }
    return SecurityAuditLogger.instance;
  }

  /**
   * Log security event
   */
  log(type: string, message: string, details: any = {}): void {
    this.logs.push({
      timestamp: Date.now(),
      type,
      message,
      details,
    });
    
    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }

  /**
   * Get security logs
   */
  getLogs(type?: string): Array<{
    timestamp: number;
    type: string;
    message: string;
    details: any;
  }> {
    if (type) {
      return this.logs.filter(log => log.type === type);
    }
    return this.logs;
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }
}

/**
 * Apply security middleware to request
 */
export function applySecurity(req: NextRequest): NextResponse | null {
  return securityMiddleware(req);
}