import { Request, Response, NextFunction } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: any;
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Basic auth middleware - for now just pass through
  // TODO: Implement proper authentication
  next();
};

export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  // Phase 1: Basic authentication placeholder
  // In production, this would validate JWT tokens, API keys, etc.
  
  // For now, just check if user exists in request
  if (!req.body.userId && !req.query.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Add user info to request for downstream handlers
  req.user = {
    id: req.body.userId || req.query.userId,
    // TODO: Add proper user data from token validation
  };
  
  next();
}; 