import { z } from 'zod';

/**
 * Feedback category enum
 */
export enum FeedbackCategory {
  BUG = 'BUG',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
  GENERAL_FEEDBACK = 'GENERAL_FEEDBACK',
  VENUE_ISSUE = 'VENUE_ISSUE',
  TECHNICAL_SUPPORT = 'TECHNICAL_SUPPORT',
  UI_UX_IMPROVEMENT = 'UI_UX_IMPROVEMENT',
  PERFORMANCE_ISSUE = 'PERFORMANCE_ISSUE',
  PLAYER_REPORT = 'PLAYER_REPORT',
}

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
 * Validation helper function
 */
export const validateFeedbackForm = (data: unknown) => {
  return feedbackFormSchema.safeParse(data);
};

/**
 * Type inference from schema
 */
export type FeedbackFormData = z.infer<typeof feedbackFormSchema>;
