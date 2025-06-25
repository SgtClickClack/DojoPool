import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Basic auth middleware - for now just pass through
  // TODO: Implement proper authentication
  next();
}; 