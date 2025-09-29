/**
 * Validation Schemas
 * 
 * Centralized Zod validation schemas to ensure consistency across the application.
 * These schemas provide type safety and runtime validation for all data inputs.
 */

import { z } from 'zod';

// User related schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username too long'),
  name: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']),
  clanId: z.string().uuid().optional(),
  clanRole: z.enum(['member', 'leader']).optional(),
  avatarUrl: z.string().url().optional(),
  isAdmin: z.boolean(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username too long'),
});

// Notification schemas
export const notificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  isRead: z.boolean(),
  createdAt: z.string().datetime(),
});

export const notificationResponseSchema = z.object({
  notifications: z.array(notificationSchema),
  unreadCount: z.number().min(0),
  totalCount: z.number().min(0),
});

// Inventory schemas
export const inventoryItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  rarity: z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary']),
  quantity: z.number().min(0),
  equipped: z.boolean(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export const loadoutSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  items: z.array(inventoryItemSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Game session schemas
export const gameSessionSchema = z.object({
  id: z.string().uuid(),
  playerId: z.string().uuid(),
  opponentId: z.string().uuid().optional(),
  status: z.enum(['active', 'completed', 'cancelled']),
  score: z.number().min(0),
  opponentScore: z.number().min(0).optional(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  venueId: z.string().uuid().optional(),
});

// Venue schemas
export const venueSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Venue name is required'),
  description: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  rating: z.number().min(0).max(5).optional(),
  imageUrl: z.string().url().optional(),
});

// Tournament schemas
export const tournamentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Tournament name is required'),
  description: z.string().optional(),
  status: z.enum(['upcoming', 'active', 'completed', 'cancelled']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  maxParticipants: z.number().min(2),
  currentParticipants: z.number().min(0),
  entryFee: z.number().min(0),
  prizePool: z.number().min(0),
  venueId: z.string().uuid().optional(),
});

// Clan schemas
export const clanSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Clan name is required'),
  tag: z.string().min(2).max(6),
  description: z.string().optional(),
  memberCount: z.number().min(0),
  maxMembers: z.number().min(1),
  leaderId: z.string().uuid(),
  createdAt: z.string().datetime(),
});

// API response schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  error: z.string().optional(),
});

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().min(0),
    page: z.number().min(1),
    limit: z.number().min(1),
    totalPages: z.number().min(0),
  });

// Form validation schemas
export const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export const feedbackFormSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1, 'Comment is required'),
  category: z.enum(['bug', 'feature', 'general', 'performance']),
  userId: z.string().uuid().optional(),
});

// Search and filter schemas
export const searchParamsSchema = z.object({
  query: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const venueFiltersSchema = z.object({
  search: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  distance: z.number().min(0).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// WebSocket event schemas
export const websocketEventSchema = z.object({
  type: z.string(),
  data: z.any(),
  timestamp: z.string().datetime(),
  userId: z.string().uuid().optional(),
});

// Error schemas
export const errorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.any().optional(),
  timestamp: z.string().datetime(),
});

// Performance monitoring schemas
export const performanceMetricSchema = z.object({
  name: z.string(),
  value: z.number(),
  unit: z.string(),
  timestamp: z.string().datetime(),
  metadata: z.record(z.any()).optional(),
});

// Export all schemas as a single object for easy importing
export const schemas = {
  user: userSchema,
  login: loginSchema,
  register: registerSchema,
  notification: notificationSchema,
  notificationResponse: notificationResponseSchema,
  inventoryItem: inventoryItemSchema,
  loadout: loadoutSchema,
  gameSession: gameSessionSchema,
  venue: venueSchema,
  tournament: tournamentSchema,
  clan: clanSchema,
  apiResponse: apiResponseSchema,
  contactForm: contactFormSchema,
  feedbackForm: feedbackFormSchema,
  searchParams: searchParamsSchema,
  venueFilters: venueFiltersSchema,
  websocketEvent: websocketEventSchema,
  error: errorSchema,
  performanceMetric: performanceMetricSchema,
} as const;
