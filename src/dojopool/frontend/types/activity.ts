export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  title: string;
  description: string;
  userId: string;
  username: string;
  userAvatar?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  isPublic: boolean;
}

export enum ActivityEventType {
  GAME_COMPLETED = 'game_completed',
  TOURNAMENT_JOINED = 'tournament_joined',
  TOURNAMENT_WON = 'tournament_won',
  ACHIEVEMENT_EARNED = 'achievement_earned',
  FRIEND_ADDED = 'friend_added',
  PROFILE_UPDATED = 'profile_updated',
  SHOT_ANALYZED = 'shot_analyzed',
  VENUE_VISITED = 'venue_visited',
  TERRITORY_CAPTURED = 'territory_captured',
  CLAN_JOINED = 'clan_joined',
  CLAN_LEFT = 'clan_left',
  CHALLENGE_SENT = 'challenge_sent',
  CHALLENGE_ACCEPTED = 'challenge_accepted',
  CHALLENGE_DECLINED = 'challenge_declined',
}

export interface ActivityFeedResponse {
  entries: ActivityEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ActivityFeedFilters {
  filter: 'global' | 'friends';
  page?: number;
  limit?: number;
}
