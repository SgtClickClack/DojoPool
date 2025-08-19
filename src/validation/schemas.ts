import { z } from 'zod';

// Profile update schema
export const profileUpdateSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  skillLevel: z.number().min(0).max(100).optional(),
  preferredGame: z.string().max(50).optional(),
});

// Avatar upload schema
export const avatarUploadSchema = z.object({
  avatarUrl: z.string().url(),
});

// User registration schema
export const userRegistrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  displayName: z.string().min(2).max(50),
});

// User login schema
export const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

// Password reset schema
export const passwordResetSchema = z.object({
  email: z.string().email(),
});

// Password update schema
export const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
});
