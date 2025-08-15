import { Request, Response, NextFunction, Application } from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { csrfProtection } from "./csrfProtection";

// Rate limiting configuration
const rateLimitConfig = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "Too many requests from this IP, please try again later.",
});

// Security headers configuration
const securityConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: true,
  xssFilter: true,
};

// Apply all security middleware
export const applySecurityMiddleware = (app: Application): void => {
  // Apply helmet with configuration
  app.use(helmet(securityConfig));

  // Apply rate limiting
  app.use(rateLimitConfig);

  // Apply CSRF protection
  app.use(csrfProtection);

  // Apply input sanitization
  app.use(sanitizeInputMiddleware);
};

// Input validation middleware
export function validateInput(schema: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      return res.status(400).json({ error: "Invalid input data" });
    }
  };
}

// Input sanitization middleware
export const sanitizeInputMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const sanitizeValue = (value: any): any => {
    if (typeof value === "string") {
      return value
        .replace(/[<>]/g, "")
        .replace(/javascript:/gi, "")
        .replace(/data:/gi, "")
        .replace(/vbscript:/gi, "");
    }
    if (typeof value === "object" && value !== null) {
      return Object.keys(value).reduce(
        (acc: any, key) => {
          acc[key] = sanitizeValue(value[key]);
          return acc;
        },
        Array.isArray(value) ? [] : {},
      );
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

// CSRF Protection middleware
export const csrfMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    csrfProtection.validateRequest(req, res);
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid CSRF token" });
  }
};

// Generate CSRF token middleware
export const generateCsrfToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = csrfProtection.generateToken(req);
  res.locals.csrfToken = token;
  next();
};
