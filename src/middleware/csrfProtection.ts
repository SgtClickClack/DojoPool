import { Request, Response, NextFunction } from 'express';
import { doubleCsrf } from 'csrf-csrf';

const {
  generateToken,
  doubleCsrfProtection
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'your-secret-key',
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    secure: process.env.NODE_ENV === 'production'
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req: Request) => 
    typeof req.headers['x-csrf-token'] === 'string' ? req.headers['x-csrf-token'] : undefined,
});

export function csrfProtection(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Generate CSRF token for GET requests
  if (req.method === 'GET') {
    const token = generateToken(req, res);
    res.setHeader('x-csrf-token', token);
    return next();
  }

  // Validate CSRF token for other methods
  try {
    doubleCsrfProtection(req, res, next);
  } catch (error) {
    return res.status(403).json({
      error: 'Invalid CSRF token'
    });
  }
}

export { generateToken }; 