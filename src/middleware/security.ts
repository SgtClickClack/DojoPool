import { NextApiRequest, NextApiResponse } from 'next';
import { nanoid } from 'nanoid';

interface SecurityConfig {
  enableCSP?: boolean;
  enableHSTS?: boolean;
  enableNoSniff?: boolean;
  enableXSSProtection?: boolean;
  enableFrameGuard?: boolean;
  enableReferrerPolicy?: boolean;
  csrfProtection?: boolean;
}

const defaultConfig: SecurityConfig = {
  enableCSP: true,
  enableHSTS: true,
  enableNoSniff: true,
  enableXSSProtection: true,
  enableFrameGuard: true,
  enableReferrerPolicy: true,
  csrfProtection: true,
};

export const securityMiddleware = (config: SecurityConfig = defaultConfig) => {
  return async (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    // Content Security Policy
    if (config.enableCSP) {
      res.setHeader(
        'Content-Security-Policy',
        [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "font-src 'self' data:",
          "connect-src 'self' https:",
          "media-src 'self'",
          "object-src 'none'",
          "frame-src 'self'",
          "worker-src 'self' blob:",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'self'",
        ].join('; ')
      );
    }

    // HTTP Strict Transport Security
    if (config.enableHSTS) {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    // X-Content-Type-Options
    if (config.enableNoSniff) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }

    // X-XSS-Protection
    if (config.enableXSSProtection) {
      res.setHeader('X-XSS-Protection', '1; mode=block');
    }

    // X-Frame-Options
    if (config.enableFrameGuard) {
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    }

    // Referrer-Policy
    if (config.enableReferrerPolicy) {
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    // CSRF Protection
    if (config.csrfProtection) {
      const csrfToken = req.headers['x-csrf-token'];
      const storedToken = req.cookies['csrf-token'];

      if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
        if (!csrfToken || !storedToken || csrfToken !== storedToken) {
          return res.status(403).json({ error: 'Invalid CSRF token' });
        }
      }

      // Generate new CSRF token for subsequent requests
      const newToken = nanoid();
      res.setHeader('Set-Cookie', `csrf-token=${newToken}; Path=/; HttpOnly; Secure; SameSite=Strict`);
      res.setHeader('X-CSRF-Token', newToken);
    }

    // Remove sensitive headers
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    // Additional security headers
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    // Cache control
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-store, max-age=0');
    } else {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    next();
  };
};

// Rate limiting middleware
const rateLimit = new Map<string, { count: number; resetTime: number }>();

export const rateLimitMiddleware = (
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) => {
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const key = `${ip}:${req.method}:${req.url}`;
    const now = Date.now();

    const rateLimitInfo = rateLimit.get(key) || { count: 0, resetTime: now + windowMs };

    // Reset if window has expired
    if (now > rateLimitInfo.resetTime) {
      rateLimitInfo.count = 0;
      rateLimitInfo.resetTime = now + windowMs;
    }

    rateLimitInfo.count++;
    rateLimit.set(key, rateLimitInfo);

    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - rateLimitInfo.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitInfo.resetTime / 1000));

    if (rateLimitInfo.count > limit) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((rateLimitInfo.resetTime - now) / 1000)
      });
    }

    next();
  };
};

// Input sanitization middleware
export const sanitizeInputMiddleware = (req: NextApiRequest, _res: NextApiResponse, next: () => void) => {
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      // Remove potential XSS payloads
      return value
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/data:/gi, '')
        .replace(/vbscript:/gi, '');
    }
    if (typeof value === 'object' && value !== null) {
      return Object.keys(value).reduce((acc: any, key) => {
        acc[key] = sanitizeValue(value[key]);
        return acc;
      }, Array.isArray(value) ? [] : {});
    }
    return value;
  };

  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }

  next();
};

// Export middleware chain
export const securityMiddlewareChain = (config?: SecurityConfig) => {
  const middleware = [
    securityMiddleware(config),
    rateLimitMiddleware(),
    sanitizeInputMiddleware
  ];

  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    let currentMiddlewareIndex = 0;

    const executeMiddleware = () => {
      if (currentMiddlewareIndex < middleware.length) {
        middleware[currentMiddlewareIndex](req, res, () => {
          currentMiddlewareIndex++;
          executeMiddleware();
        });
      } else {
        next();
      }
    };

    executeMiddleware();
  };
}; 