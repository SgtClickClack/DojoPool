/**
 * Rate Limiting Middleware
 *
 * Comprehensive rate limiting implementation for API endpoints
 * with different limits based on endpoint type and user role.
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configurations for different endpoints
const rateLimitConfigs: Record<string, RateLimitConfig> = {
  // Authentication endpoints - strict limits
  '/api/auth/login': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyGenerator: (req) =>
      `auth:${req.headers.get('x-forwarded-for') ?? req.ip}`,
  },
  '/api/auth/register': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    keyGenerator: (req) =>
      `register:${req.headers.get('x-forwarded-for') ?? req.ip}`,
  },
  '/api/auth/refresh': {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10,
    keyGenerator: (req) =>
      `refresh:${req.headers.get('x-forwarded-for') ?? req.ip}`,
  },

  // API endpoints - moderate limits
  '/api/v1/clans': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    keyGenerator: (req) =>
      `clans:${req.headers.get('x-forwarded-for') ?? req.ip}`,
  },
  '/api/v1/venues': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
    keyGenerator: (req) =>
      `venues:${req.headers.get('x-forwarded-for') ?? req.ip}`,
  },
  '/api/v1/matches': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 40,
    keyGenerator: (req) =>
      `matches:${req.headers.get('x-forwarded-for') ?? req.ip}`,
  },

  // Content endpoints - stricter limits
  '/api/v1/content': {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10,
    keyGenerator: (req) =>
      `content:${req.headers.get('x-forwarded-for') ?? req.ip}`,
  },
  '/api/v1/upload': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    keyGenerator: (req) =>
      `upload:${req.headers.get('x-forwarded-for') ?? req.ip}`,
  },

  // WebSocket endpoints - higher limits
  '/api/ws': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyGenerator: (req) => `ws:${req.headers.get('x-forwarded-for') ?? req.ip}`,
  },

  // Default configuration
  default: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyGenerator: (req) =>
      `default:${req.headers.get('x-forwarded-for') ?? req.ip}`,
  },
};

/**
 * Get rate limit configuration for a given path
 */
function getRateLimitConfig(pathname: string): RateLimitConfig {
  // Check for exact match first
  if (rateLimitConfigs[pathname]) {
    return rateLimitConfigs[pathname];
  }

  // Check for pattern matches
  for (const [pattern, config] of Object.entries(rateLimitConfigs)) {
    if (pattern !== 'default' && pathname.startsWith(pattern)) {
      return config;
    }
  }

  // Return default configuration
  return rateLimitConfigs.default;
}

/**
 * Generate rate limit key for a request
 */
function generateKey(req: NextRequest, config: RateLimitConfig): string {
  if (config.keyGenerator) {
    return config.keyGenerator(req);
  }

  // Default key generation
  const ip = req.headers.get('x-forwarded-for') ?? req.ip ?? 'unknown';
  return `rate:${ip}:${req.nextUrl.pathname}`;
}

/**
 * Check if request is within rate limit
 */
function checkRateLimit(
  key: string,
  config: RateLimitConfig
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired entry
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate limiting middleware
 */
export function rateLimitMiddleware(req: NextRequest): NextResponse | null {
  const pathname = req.nextUrl.pathname;
  const config = getRateLimitConfig(pathname);
  const key = generateKey(req, config);

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    // 1% chance
    cleanupExpiredEntries();
  }

  const result = checkRateLimit(key, config);

  // Add rate limit headers
  const response = result.allowed
    ? null
    : new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': Math.ceil(
              (result.resetTime - Date.now()) / 1000
            ).toString(),
          },
        }
      );

  return response;
}

/**
 * Rate limit for specific user actions
 */
export class UserActionRateLimit {
  private static instance: UserActionRateLimit;
  private userActions = new Map<string, Map<string, RateLimitEntry>>();

  static getInstance(): UserActionRateLimit {
    if (!UserActionRateLimit.instance) {
      UserActionRateLimit.instance = new UserActionRateLimit();
    }
    return UserActionRateLimit.instance;
  }

  /**
   * Check if user can perform an action
   */
  canPerformAction(
    userId: string,
    action: string,
    maxActions: number,
    windowMs: number
  ): boolean {
    const now = Date.now();
    const userActions = this.userActions.get(userId) || new Map();
    const actionEntry = userActions.get(action);

    if (!actionEntry || now > actionEntry.resetTime) {
      // Create new entry or reset expired entry
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + windowMs,
      };
      userActions.set(action, newEntry);
      this.userActions.set(userId, userActions);
      return true;
    }

    if (actionEntry.count >= maxActions) {
      return false;
    }

    // Increment count
    actionEntry.count++;
    userActions.set(action, actionEntry);
    this.userActions.set(userId, userActions);
    return true;
  }

  /**
   * Get remaining actions for a user
   */
  getRemainingActions(
    userId: string,
    action: string,
    maxActions: number
  ): number {
    const userActions = this.userActions.get(userId);
    if (!userActions) return maxActions;

    const actionEntry = userActions.get(action);
    if (!actionEntry) return maxActions;

    return Math.max(0, maxActions - actionEntry.count);
  }

  /**
   * Clear user actions
   */
  clearUserActions(userId: string): void {
    this.userActions.delete(userId);
  }

  /**
   * Clear all actions
   */
  clearAllActions(): void {
    this.userActions.clear();
  }
}

/**
 * Rate limit for API endpoints with user context
 */
export function createUserRateLimit(maxRequests: number, windowMs: number) {
  return (req: NextRequest, userId: string): boolean => {
    const rateLimit = UserActionRateLimit.getInstance();
    return rateLimit.canPerformAction(
      userId,
      req.nextUrl.pathname,
      maxRequests,
      windowMs
    );
  };
}

/**
 * Rate limit for specific actions
 */
export const actionRateLimits = {
  // Clan actions
  createClan: createUserRateLimit(1, 24 * 60 * 60 * 1000), // 1 per day
  joinClan: createUserRateLimit(5, 60 * 60 * 1000), // 5 per hour
  leaveClan: createUserRateLimit(3, 60 * 60 * 1000), // 3 per hour

  // Match actions
  createMatch: createUserRateLimit(10, 60 * 60 * 1000), // 10 per hour
  joinMatch: createUserRateLimit(20, 60 * 60 * 1000), // 20 per hour

  // Content actions
  createPost: createUserRateLimit(5, 60 * 60 * 1000), // 5 per hour
  createComment: createUserRateLimit(20, 60 * 60 * 1000), // 20 per hour

  // Upload actions
  uploadImage: createUserRateLimit(10, 60 * 60 * 1000), // 10 per hour
  uploadVideo: createUserRateLimit(2, 60 * 60 * 1000), // 2 per hour
};

/**
 * Middleware to apply rate limiting
 */
export function applyRateLimit(req: NextRequest): NextResponse | null {
  return rateLimitMiddleware(req);
}
