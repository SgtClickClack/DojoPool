/**
 * Main Middleware
 * 
 * Combines all middleware functions for the Dojo Pool application
 * including rate limiting, security, and request processing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from './rateLimiter';
import { applySecurity } from './security';

/**
 * Main middleware function
 */
export function middleware(req: NextRequest): NextResponse | null {
  // Apply security middleware first
  const securityResponse = applySecurity(req);
  if (securityResponse) {
    return securityResponse;
  }

  // Apply rate limiting
  const rateLimitResponse = applyRateLimit(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Continue with request processing
  return NextResponse.next();
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
