/**
 * Rate Limiting Middleware
 * 
 * Implements progressive rate limiting with:
 * - IP-based limiting
 * - API endpoint categorization
 * - Progressive backoff
 * - Redis/memory store support
 */

import type { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
  skip?: (req: NextRequest) => boolean;
  handler?: (req: NextRequest) => NextResponse;
}

interface RateLimitStore {
  get: (key: string) => Promise<{ count: number; resetTime: number } | null>;
  set: (key: string, value: { count: number; resetTime: number }) => Promise<void>;
  increment: (key: string) => Promise<number>;
}

/**
 * In-memory rate limit store for development
 */
class MemoryStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  async get(key: string) {
    const value = this.store.get(key);
    if (!value) return null;
    
    if (Date.now() > value.resetTime) {
      this.store.delete(key);
      return null;
    }
    
    return value;
  }

  async set(key: string, value: { count: number; resetTime: number }) {
    this.store.set(key, value);
  }

  async increment(key: string) {
    const existing = await this.get(key);
    
    if (!existing) {
      const newValue = { count: 1, resetTime: Date.now() + 60000 }; // 1 minute window
      await this.set(key, newValue);
      return 1;
    }
    
    const updatedValue = { ...existing, count: existing.count + 1 };
    await this.set(key, updatedValue);
    return updatedValue.count;
  }
}

/**
 * Default rate limit configurations for different API endpoints
 */
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Authentication endpoints - stricter limits
  '/api/auth/login': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },
  '/api/auth/register': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
  },
  '/api/auth/refresh': {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10,
  },
  
  // API endpoints - moderate limits
  '/api/v1/games': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },
  '/api/v1/clans': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  },
  '/api/v1/territories': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  },
  '/api/v1/users/me': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  },
  
  // Content uploads - stricter limits
  '/api/v1/content': {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10,
  },
  
  // General API fallback
  '/api/v1': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  
  // General fallback
  '/api': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200,
  },
};

/**
 * Generate rate limit key based on IP and endpoint
 */
const generateKey = (req: NextRequest): string => {
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  const endpoint = req.nextUrl.pathname;
  return `rate_limit:${ip}:${endpoint}`;
};

/**
 * Get rate limit config for endpoint
 */
const getConfigForEndpoint = (pathname: string): RateLimitConfig => {
  // Find most specific match
  for (const [pattern, config] of Object.entries(RATE_LIMIT_CONFIGS)) {
    if (pathname.startsWith(pattern)) {
      return config;
    }
  }
  
  // Default fallback
  return {
    windowMs: 60 * 1000,
    maxRequests: 100,
  };
};

/**
 * Rate limiter class
 */
class RateLimiter {
  private store: RateLimitStore;
  
  constructor(store: RateLimitStore = new MemoryStore()) {
    this.store = store;
  }
  
  /**
   * Check rate limit for request
   */
  async checkLimit(req: NextRequest): Promise<{
    allowed: boolean;
    resetSeconds: number;
    remaining: number;
    limit: number;
  }> {
    const key = generateKey(req);
    const config = getConfigForConfig(req.nextUrl.pathname);
    
    // Skip if configured to skip
    if (config.skip?.(req)) {
      return {
        allowed: true,
        resetSeconds: 0,
        remaining: config.maxRequests,
        limit: config.maxRequests,
      };
    }
    
    const current = await this.store.get(key);
    const now = Date.now();
    
    if (!current || now > current.resetTime) {
      // First request or window expired
      await this.store.set(key, { count: 1, resetTime: now + config.windowMs });
      return {
        allowed: true,
        resetSeconds: Math.ceil(config.windowMs / 1000),
        remaining: config.maxRequests - 1,
        limit: config.maxRequests,
      };
    }
    
    if (current.count >= config.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        resetSeconds: Math.ceil((current.resetTime - now) / 1000),
        remaining: 0,
        limit: config.maxRequests,
      };
    }
    
    // Increment counter
    const newCount = await this.store.increment(key);
    
    return {
      allowed: true,
      resetSeconds: Math.ceil((current.resetTime - now) / 1000),
      remaining: config.maxRequests - newCount,
      limit: config.maxRequests,
    };
  }
  
  /**
   * Apply rate limit to Next.js middleware
   */
  async middleware(req: NextRequest): Promise<NextResponse | undefined> {
    const result = await this.checkLimit(req);
    
    const response = config.handler?.(req) || NextResponse.next();
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', (Date.now() + result.resetSeconds * 1000).toString());
    
    if (!result.allowed) {
      response.headers.set('Retry-After', result.resetSeconds.toString());
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: result.resetSeconds },
        { status: 429 }
      );
    }
    
    return response;
  }
}

/**
 * Global rate limiter instance
 */
const rateLimiter = new RateLimiter();

/**
 * Middleware function for use in Next.js
 */
export async function rateLimitMiddleware(req: NextRequest): Promise<NextResponse | undefined> {
  // Only apply to API routes
  if (!req.nextUrl.pathname.startsWith('/api/')) {
    return undefined;
  }
  
  return rateLimiter.middleware(req);
}

/**
 * Helper for applying rate limits to individual API endpoints
 */
export function withRateLimit(config: Partial<RateLimitConfig>) {
  return async function apiHandler(req: NextRequest): Promise<NextResponse | undefined> {
    const result = await rateLimiter.checkLimit(req);
    
    if (!result.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests', 
          message: `Rate limit exceeded. Retry after ${result.resetSeconds} seconds.`,
          retryAfter: result.resetSeconds 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': result.resetSeconds.toString(),
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': (Date.now() + result.resetSeconds * 1000).toString(),
          }
        }
      );
    }
    
    return undefined; // Allow request to continue
  };
}

export { RateLimiter, type RateLimitConfig };
export default rateLimitMiddleware;
