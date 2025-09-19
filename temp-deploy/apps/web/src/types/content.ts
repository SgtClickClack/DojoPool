export enum ContentType {
  // User-generated content
  MATCH_REPLAY = 'MATCH_REPLAY',
  CUSTOM_ITEM = 'CUSTOM_ITEM',
  HIGH_SCORE = 'HIGH_SCORE',
  ACHIEVEMENT = 'ACHIEVEMENT',
  TOURNAMENT_HIGHLIGHT = 'TOURNAMENT_HIGHLIGHT',
  VENUE_REVIEW = 'VENUE_REVIEW',
  GENERAL = 'GENERAL',

  // CMS-managed content
  EVENT = 'EVENT',
  NEWS_ARTICLE = 'NEWS_ARTICLE',
  SYSTEM_MESSAGE = 'SYSTEM_MESSAGE',
}

export enum ContentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

export enum ContentVisibility {
  PUBLIC = 'PUBLIC',
  FRIENDS_ONLY = 'FRIENDS_ONLY',
  PRIVATE = 'PRIVATE',
}

export interface Content {
  id: string;
  userId: string;
  title: string;
  description?: string;
  contentType: ContentType;
  fileUrl?: string;
  thumbnailUrl?: string;
  status: ContentStatus;
  visibility: ContentVisibility;
  metadata: Record<string, any>;
  tags: string[];
  likes: number;
  shares: number;
  views: number;
  moderatedBy?: string;
  moderatedAt?: string;
  moderationNotes?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  moderator?: {
    id: string;
    username: string;
  };
  _count?: {
    likes: number;
    shares: number;
  };
  userLiked?: boolean;
  userShared?: boolean;
}

export interface CreateContentRequest {
  title: string;
  description?: string;
  contentType: ContentType;
  visibility?: ContentVisibility;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateContentRequest {
  title?: string;
  description?: string;
  visibility?: ContentVisibility;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface ContentFilter {
  status?: ContentStatus;
  contentType?: ContentType;
  visibility?: ContentVisibility;
  userId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ContentListResponse {
  content: Content[];
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

export interface ContentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalLikes: number;
  totalShares: number;
  totalViews: number;
}

export interface ModerateContentRequest {
  status: ContentStatus;
  moderationNotes?: string;
}

export interface ContentLikeResponse {
  liked: boolean;
}

export interface ContentShareRequest {
  sharedWithIds: string[];
}

export interface UserContentListResponse {
  content: Content[];
  totalCount: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ContentUploadData {
  file?: File;
  title: string;
  description?: string;
  contentType: ContentType;
  visibility?: ContentVisibility;
  tags?: string[];
  metadata?: Record<string, any>;
}
