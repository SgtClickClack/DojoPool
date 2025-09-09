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

export enum FeedbackStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
}

export enum FeedbackPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface Feedback {
  id: string;
  userId: string;
  message: string;
  category: FeedbackCategory;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  adminNotes?: string;
  moderatorNotes?: string;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  resolver?: {
    id: string;
    username: string;
  };
}

export interface CreateFeedbackRequest {
  message: string;
  category: FeedbackCategory;
  additionalContext?: string;
  attachments?: string[];
}

export interface UpdateFeedbackRequest {
  status?: FeedbackStatus;
  priority?: FeedbackPriority;
  adminNotes?: string;
}

export interface FeedbackFilter {
  status?: FeedbackStatus;
  category?: FeedbackCategory;
  priority?: FeedbackPriority;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface FeedbackListResponse {
  feedback: Feedback[];
  totalCount: number;
  pendingCount?: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface FeedbackStats {
  total: number;
  pending: number;
  inReview: number;
  resolved: number;
  closed: number;
  rejected: number;
  averageResolutionTime: number | null;
}

export interface UserFeedbackListResponse {
  feedback: Omit<Feedback, 'user' | 'resolver'>[];
  totalCount: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
