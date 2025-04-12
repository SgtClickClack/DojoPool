import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { NextApiRequest, NextApiResponse } from 'next';
import { verify } from 'jsonwebtoken';
import { Redis } from 'ioredis';
import { doubleCsrf } from 'csrf-csrf';
import { Request, Response, NextFunction } from 'express';

// Initialize Redis client for rate limiting and session storage
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Security configuration
export const securityConfig = {
  // CORS settings
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['https://dojopool.com'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'X-CSRF-Token',
      'X-Requested-With',
      'Accept',
      'Accept-Version',
      'Content-Length',
      'Content-MD5',
      'Content-Type',
      'Date',
      'X-Api-Version',
      'Authorization',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
  },

  // CSP settings
  csp: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'cdn.dojopool.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'cdn.dojopool.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'cdn.dojopool.com'],
      connectSrc: ["'self'", 'api.dojopool.com', 'ws.dojopool.com'],
      fontSrc: ["'self'", 'cdn.dojopool.com'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      sandbox: ['allow-forms', 'allow-scripts', 'allow-same-origin'],
      childSrc: ["'none'"],
      workerSrc: ["'self'", 'blob:'],
    },
    reportUri: '/api/csp-report',
  },

  // Rate limiting settings
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    store: new (require('rate-limit-redis'))({
      client: redis,
      prefix: 'rate-limit:',
    }),
  },

  // Session settings
  session: {
    name: 'dojopool.sid',
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    store: new (require('connect-redis'))(require('express-session'))({
      client: redis,
      prefix: 'session:',
    }),
  },

  // JWT settings
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret',
    expiresIn: '1d',
    refreshExpiresIn: '7d',
    algorithm: 'HS256',
  },

  // Password settings
  password: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    saltRounds: 12,
  },

  // 2FA settings
  twoFactor: {
    enabled: true,
    issuer: 'DojoPool',
    window: 1,
  },
};

// Rate limiting middleware
export const rateLimitMiddleware = rateLimit(securityConfig.rateLimit);

// Helmet middleware configuration
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: securityConfig.csp.directives,
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: true,
  referrerPolicy: true,
  xssFilter: true,
});

// Authentication middleware
export const authMiddleware = async (
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verify(token, securityConfig.jwt.secret);
    req.user = decoded;

    // Check if token is blacklisted (logged out)
    const isBlacklisted = await redis.get(`token:blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token is no longer valid' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// CSRF Protection middleware
export const csrfProtection = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'default-secret',
  cookieName: '_csrf',
  cookieOptions: {
    sameSite: 'strict',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req: Request) => req.headers['x-csrf-token'] as string
});

// Password validation
export const validatePassword = (password: string): boolean => {
  const { minLength, requireUppercase, requireLowercase, requireNumbers, requireSpecialChars } =
    securityConfig.password;

  if (password.length < minLength) return false;
  if (requireUppercase && !/[A-Z]/.test(password)) return false;
  if (requireLowercase && !/[a-z]/.test(password)) return false;
  if (requireNumbers && !/\d/.test(password)) return false;
  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;

  return true;
};

// Security headers middleware
export const securityHeaders = {
  'X-DNS-Prefetch-Control': 'off',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

// Initialize security (call this when your app starts)
export const initializeSecurity = async () => {
  try {
    // Test Redis connection
    await redis.ping();
    console.log('Security Redis connection established');

    // Clear expired tokens from blacklist
    const keys = await redis.keys('token:blacklist:*');
    for (const key of keys) {
      const ttl = await redis.ttl(key);
      if (ttl <= 0) {
        await redis.del(key);
      }
    }

    console.log('Security initialization completed');
  } catch (error) {
    console.error('Security initialization failed:', error);
    throw error;
  }
}; 