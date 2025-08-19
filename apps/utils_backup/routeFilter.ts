/**
 * Route Filter Utility
 * Temporarily disables problematic routes to create a stable development environment
 */

export const WORKING_ROUTES = [
  '/',
  '/map',
  '/world-map',
  '/simple-map',
  '/test',
  '/status',
  '/_app',
  '/_document',
  '/404',
  '/500',
  '/_error',
];

export const isRouteAllowed = (pathname: string): boolean => {
  // Always allow working routes
  if (WORKING_ROUTES.includes(pathname)) {
    return true;
  }

  // Allow API routes that are essential
  if (pathname.startsWith('/api/')) {
    return false; // Temporarily disable all API routes
  }

  // Temporarily disable all other routes
  return false;
};

export const getBlockedRouteMessage = (pathname: string): string => {
  return `Route "${pathname}" is temporarily disabled for development stability.

This route has TypeScript compilation errors that are causing server crashes.
It will be re-enabled once the errors are resolved.

Working routes: ${WORKING_ROUTES.join(', ')}`;
};
