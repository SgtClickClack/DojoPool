export interface SecurityConfig {
  enableXSSProtection: boolean;
  enableCSRFProtection: boolean;
  enableInputValidation: boolean;
  enableRateLimiting: boolean;
  maxRequestSize: number;
  allowedOrigins: string[];
  blockedPatterns: RegExp[];
}

export interface SecurityEvent {
  type: 'xss_attempt' | 'csrf_attempt' | 'rate_limit' | 'invalid_input' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  timestamp: number;
  ip?: string;
  userId?: string;
}

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'email' | 'url' | 'regex' | 'custom';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
  sanitize?: boolean;
}

export class SecurityService {
  private static instance: SecurityService;
  private config: SecurityConfig;
  private events: SecurityEvent[] = [];
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();
  private csrfTokens: Map<string, { token: string; expires: number }> = new Map();

  private constructor() {
    this.config = {
      enableXSSProtection: true,
      enableCSRFProtection: true,
      enableInputValidation: true,
      enableRateLimiting: true,
      maxRequestSize: 1024 * 1024, // 1MB
      allowedOrigins: ['localhost:3000', 'localhost:8080'],
      blockedPatterns: [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi
      ]
    };
  }

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  // XSS Protection
  sanitizeInput(input: string): string {
    if (!this.config.enableXSSProtection) return input;

    let sanitized = input;

    // Remove script tags and content
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    
    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    // Remove iframe tags
    sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    
    // HTML encode special characters
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');

    if (sanitized !== input) {
      this.logSecurityEvent('xss_attempt', 'medium', {
        original: input,
        sanitized,
        pattern: 'xss_pattern_detected'
      });
    }

    return sanitized;
  }

  // CSRF Protection
  generateCSRFToken(userId: string): string {
    if (!this.config.enableCSRFProtection) return '';

    const token = this.generateRandomToken();
    const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    this.csrfTokens.set(userId, { token, expires });

    return token;
  }

  validateCSRFToken(userId: string, token: string): boolean {
    if (!this.config.enableCSRFProtection) return true;

    const stored = this.csrfTokens.get(userId);
    if (!stored) {
      this.logSecurityEvent('csrf_attempt', 'high', {
        userId,
        providedToken: token,
        reason: 'no_stored_token'
      });
      return false;
    }

    if (Date.now() > stored.expires) {
      this.csrfTokens.delete(userId);
      this.logSecurityEvent('csrf_attempt', 'medium', {
        userId,
        providedToken: token,
        reason: 'token_expired'
      });
      return false;
    }

    if (stored.token !== token) {
      this.logSecurityEvent('csrf_attempt', 'high', {
        userId,
        providedToken: token,
        expectedToken: stored.token,
        reason: 'token_mismatch'
      });
      return false;
    }

    return true;
  }

  // Input Validation
  validateInput(data: any, rules: ValidationRule[]): { isValid: boolean; errors: string[] } {
    if (!this.config.enableInputValidation) return { isValid: true, errors: [] };

    const errors: string[] = [];

    for (const rule of rules) {
      const value = data[rule.field];

      // Check required
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} is required`);
        continue;
      }

      if (value === undefined || value === null) continue;

      // Type validation
      switch (rule.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`${rule.field} must be a string`);
            continue;
          }
          if (rule.minLength && value.length < rule.minLength) {
            errors.push(`${rule.field} must be at least ${rule.minLength} characters`);
          }
          if (rule.maxLength && value.length > rule.maxLength) {
            errors.push(`${rule.field} must be no more than ${rule.maxLength} characters`);
          }
          break;

        case 'number':
          if (typeof value !== 'number' || isNaN(value)) {
            errors.push(`${rule.field} must be a valid number`);
            continue;
          }
          break;

        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push(`${rule.field} must be a valid email address`);
          }
          break;

        case 'url':
          try {
            new URL(value);
          } catch {
            errors.push(`${rule.field} must be a valid URL`);
          }
          break;

        case 'regex':
          if (rule.pattern && !rule.pattern.test(value)) {
            errors.push(`${rule.field} format is invalid`);
          }
          break;

        case 'custom':
          if (rule.customValidator && !rule.customValidator(value)) {
            errors.push(`${rule.field} validation failed`);
          }
          break;
      }

      // Sanitize if requested
      if (rule.sanitize && typeof value === 'string') {
        data[rule.field] = this.sanitizeInput(value);
      }
    }

    if (errors.length > 0) {
      this.logSecurityEvent('invalid_input', 'low', {
        field: rules.map(r => r.field),
        errors,
        data: JSON.stringify(data)
      });
    }

    return { isValid: errors.length === 0, errors };
  }

  // Rate Limiting
  checkRateLimit(identifier: string, limit: number, windowMs: number): boolean {
    if (!this.config.enableRateLimiting) return true;

    const now = Date.now();
    const stored = this.rateLimitMap.get(identifier);

    if (!stored || now > stored.resetTime) {
      this.rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (stored.count >= limit) {
      this.logSecurityEvent('rate_limit', 'medium', {
        identifier,
        limit,
        windowMs,
        currentCount: stored.count
      });
      return false;
    }

    stored.count++;
    return true;
  }

  // Origin Validation
  validateOrigin(origin: string): boolean {
    return this.config.allowedOrigins.includes(origin);
  }

  // Request Size Validation
  validateRequestSize(size: number): boolean {
    return size <= this.config.maxRequestSize;
  }

  // Pattern Blocking
  checkBlockedPatterns(content: string): boolean {
    for (const pattern of this.config.blockedPatterns) {
      if (pattern.test(content)) {
        this.logSecurityEvent('suspicious_activity', 'high', {
          pattern: pattern.source,
          content: content.substring(0, 100) + '...'
        });
        return false;
      }
    }
    return true;
  }

  // Security Event Logging
  private logSecurityEvent(
    type: SecurityEvent['type'],
    severity: SecurityEvent['severity'],
    details: Record<string, any>
  ): void {
    const event: SecurityEvent = {
      type,
      severity,
      details,
      timestamp: Date.now(),
      ip: this.getClientIP(),
      userId: this.getCurrentUserId()
    };

    this.events.push(event);
    console.warn('[Security] Event logged:', event);

    // Send to analytics if critical
    if (severity === 'critical') {
      this.reportCriticalEvent(event);
    }
  }

  private getClientIP(): string | undefined {
    // In a real app, this would get the actual client IP
    return '127.0.0.1';
  }

  private getCurrentUserId(): string | undefined {
    return localStorage.getItem('userId') || undefined;
  }

  private generateRandomToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private async reportCriticalEvent(event: SecurityEvent): Promise<void> {
    try {
      await fetch('/api/security/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('[Security] Failed to report critical event:', error);
    }
  }

  // Utility Methods
  getSecurityEvents(): SecurityEvent[] {
    return [...this.events];
  }

  getSecurityConfig(): SecurityConfig {
    return { ...this.config };
  }

  updateSecurityConfig(updates: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  clearRateLimits(): void {
    this.rateLimitMap.clear();
  }

  clearCSRFTokens(): void {
    this.csrfTokens.clear();
  }

  // Middleware for Express.js
  createSecurityMiddleware() {
    return (req: any, res: any, next: any) => {
      // Origin validation
      const origin = req.headers.origin;
      if (origin && !this.validateOrigin(origin)) {
        this.logSecurityEvent('suspicious_activity', 'high', {
          origin,
          reason: 'invalid_origin'
        });
        return res.status(403).json({ error: 'Invalid origin' });
      }

      // Request size validation
      const contentLength = parseInt(req.headers['content-length'] || '0');
      if (!this.validateRequestSize(contentLength)) {
        this.logSecurityEvent('suspicious_activity', 'medium', {
          size: contentLength,
          maxSize: this.config.maxRequestSize,
          reason: 'request_too_large'
        });
        return res.status(413).json({ error: 'Request too large' });
      }

      // Rate limiting
      const clientId = req.ip || req.connection.remoteAddress;
      if (!this.checkRateLimit(clientId, 100, 60000)) { // 100 requests per minute
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      next();
    };
  }
}

// Export singleton instance
export const security = SecurityService.getInstance();

// Convenience functions
export const sanitizeInput = (input: string): string => {
  return security.sanitizeInput(input);
};

export const validateInput = (data: any, rules: ValidationRule[]): { isValid: boolean; errors: string[] } => {
  return security.validateInput(data, rules);
};

export const generateCSRFToken = (userId: string): string => {
  return security.generateCSRFToken(userId);
};

export const validateCSRFToken = (userId: string, token: string): boolean => {
  return security.validateCSRFToken(userId, token);
};

export const checkRateLimit = (identifier: string, limit: number, windowMs: number): boolean => {
  return security.checkRateLimit(identifier, limit, windowMs);
}; 