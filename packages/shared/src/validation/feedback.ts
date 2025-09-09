import { z } from 'zod';

/**
 * Zod schema for feedback form validation
 * Used for both client-side and server-side validation
 */
export const feedbackFormSchema = z.object({
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters long')
    .max(2000, 'Message must be less than 2000 characters')
    .trim(),

  category: z.enum(
    [
      'BUG',
      'FEATURE_REQUEST',
      'GENERAL_FEEDBACK',
      'VENUE_ISSUE',
      'TECHNICAL_SUPPORT',
      'UI_UX_IMPROVEMENT',
      'PERFORMANCE_ISSUE',
      'PLAYER_REPORT',
    ],
    {
      required_error: 'Please select a category',
    }
  ),

  additionalContext: z
    .string()
    .max(500, 'Additional context must be less than 500 characters')
    .optional()
    .transform((val) => val?.trim() || undefined),

  attachments: z
    .array(z.string().url('Invalid attachment URL'))
    .max(5, 'Maximum 5 attachments allowed')
    .optional()
    .default([]),
});

/**
 * Schema for file upload validation
 */
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 10 * 1024 * 1024, // 10MB max
      'File size must be less than 10MB'
    )
    .refine((file) => {
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/webm',
        'application/pdf',
        'text/plain',
      ];
      return allowedTypes.includes(file.type);
    }, 'File type not supported. Allowed: images, videos, PDF, text files'),
});

/**
 * Schema for player report specific validation
 */
export const playerReportSchema = feedbackFormSchema
  .extend({
    category: z.literal('PLAYER_REPORT'),
    reportedPlayerId: z.string().uuid('Invalid player ID').optional(),
    reportedPlayerUsername: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must be less than 50 characters')
      .optional(),
  })
  .refine((data) => data.reportedPlayerId || data.reportedPlayerUsername, {
    message: 'Either player ID or username must be provided for player reports',
    path: ['reportedPlayerId'],
  });

/**
 * Type inference from schemas
 */
export type FeedbackFormData = z.infer<typeof feedbackFormSchema>;
export type FileUploadData = z.infer<typeof fileUploadSchema>;
export type PlayerReportData = z.infer<typeof playerReportSchema>;

/**
 * Validation helper functions
 */
export const validateFeedbackForm = (data: unknown) => {
  return feedbackFormSchema.safeParse(data);
};

export const validateFileUpload = (file: File) => {
  return fileUploadSchema.safeParse({ file });
};

export const validatePlayerReport = (data: unknown) => {
  return playerReportSchema.safeParse(data);
};
