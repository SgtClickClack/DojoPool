import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

export const createRateLimiter = (options: any) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100, // limit each IP to 100 requests per windowMs
    message: options.message || "Too many requests, please try again later.",
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req: Request, res: Response, next: NextFunction) => {
      res.status(429).json({
        error: options.message || "Too many requests, please try again later.",
        retryAfter: Math.ceil(options.windowMs / 1000),
      });
    },
  });
};

// Specific rate limiters for different routes
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: "Too many login attempts, please try again later.",
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many API requests, please try again later.",
});

export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 uploads per hour
  message: "Too many file uploads, please try again later.",
});
