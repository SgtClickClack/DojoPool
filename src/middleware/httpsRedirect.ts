import { Request, Response, NextFunction } from 'express';

export const httpsRedirect = (req: Request, res: Response, next: NextFunction) => {
  // Skip HTTPS redirect for health check endpoints
  if (req.path === '/health' || req.path === '/healthz') {
    return next();
  }

  // Skip HTTPS redirect in development
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  // Check if request is already HTTPS or is using the HTTPS forwarding header
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';

  if (!isSecure) {
    // Construct HTTPS URL
    const httpsUrl = `https://${req.headers.host}${req.url}`;
    
    // 301 Permanent Redirect for GET requests
    // 307 Temporary Redirect for other methods to preserve the HTTP method
    const statusCode = req.method === 'GET' ? 301 : 307;
    
    // Redirect to HTTPS
    return res.redirect(statusCode, httpsUrl);
  }

  return next();
}; 