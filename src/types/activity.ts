export interface ActivityFeedResponse {
  activities: ActivityEvent[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ActivityEvent {
  id: string;
  type: string;
  message: string;
  userId?: string;
  venueId?: string;
  tournamentId?: string;
  matchId?: string;
  clanId?: string;
  metadata?: string;
  createdAt: string;
}

export interface ActivityFeedFilters {
  filter?: 'global' | 'friends';
  page?: number;
  limit?: number;
}
