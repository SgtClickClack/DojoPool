import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '@nestjs/common';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: (req) => req.ip || 'unknown',
      ...config,
    };

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  use(req: Request, res: Response, next: NextFunction) {
    const key = this.config.keyGenerator!(req);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Clean up old entries for this key
    if (this.store[key] && this.store[key].resetTime < now) {
      delete this.store[key];
    }

    // Initialize or get current count
    if (!this.store[key]) {
      this.store[key] = {
        count: 0,
        resetTime: now + this.config.windowMs,
      };
    }

    const current = this.store[key];

    // Check if limit exceeded
    if (current.count >= this.config.maxRequests) {
      const retryAfter = Math.ceil((current.resetTime - now) / 1000);
      
      this.logger.warn(
        `Rate limit exceeded for ${key} on ${req.method} ${req.path}`,
        {
          key,
          count: current.count,
          maxRequests: this.config.maxRequests,
          retryAfter,
        }
      );

      res.setHeader('Retry-After', retryAfter.toString());
      res.setHeader('X-RateLimit-Limit', this.config.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', new Date(current.resetTime).toISOString());

      throw new HttpException(
        {
          message: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // Increment counter
    current.count++;

    // Set response headers
    res.setHeader('X-RateLimit-Limit', this.config.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (this.config.maxRequests - current.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(current.resetTime).toISOString());

    // Track response status for conditional counting
    const originalSend = res.send;
    res.send = function(body) {
      const statusCode = res.statusCode;
      
      // Only count successful requests if configured
      if (this.config.skipSuccessfulRequests && statusCode < 400) {
        current.count--;
      }
      
      // Only count failed requests if configured
      if (this.config.skipFailedRequests && statusCode >= 400) {
        current.count--;
      }

      return originalSend.call(this, body);
    }.bind(this);

    next();
  }

  private cleanup() {
    const now = Date.now();
    const keys = Object.keys(this.store);
    
    for (const key of keys) {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    }
  }

  // Method to reset rate limit for a specific key (useful for testing)
  reset(key: string) {
    delete this.store[key];
  }

  // Method to get current rate limit status for a key
  getStatus(key: string) {
    const current = this.store[key];
    if (!current) {
      return {
        count: 0,
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs,
      };
    }

    return {
      count: current.count,
      remaining: Math.max(0, this.config.maxRequests - current.count),
      resetTime: current.resetTime,
    };
  }
}
