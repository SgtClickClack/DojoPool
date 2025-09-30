import type { Request as ExpressRequest } from 'express';

/**
 * Authenticated user information from JWT token
 */
export interface AuthenticatedUser {
  userId: string;
  sub: string;
  id: string;
  email: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Extended Express Request with authenticated user
 */
export interface AuthenticatedRequest extends ExpressRequest {
  user: AuthenticatedUser;
}

/**
 * Request with optional user (for endpoints that may or may not require auth)
 */
export interface OptionalAuthRequest extends ExpressRequest {
  user?: AuthenticatedUser;
}

/**
 * File upload request with user context
 */
export interface FileUploadRequest extends AuthenticatedRequest {
  files?: Express.Multer.File[];
  file?: Express.Multer.File;
}

/**
 * Pagination query parameters
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Search query parameters
 */
export interface SearchQuery extends PaginationQuery {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filter query parameters
 */
export interface FilterQuery extends SearchQuery {
  category?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}
