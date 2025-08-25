export interface Clan {
  id: string;
  name: string;
  tag: string;
  description: string;
  avatar?: string;
  banner?: string;
  memberCount: number;
  maxMembers: number;
  rating: number;
  territories: number;
  createdAt: string;
  updatedAt: string;
  leaderId: string;
  isPublic: boolean;
  requirements?: ClanRequirements;
  stats: ClanStats;
}

export interface ClanMember {
  id: string;
  userId: string;
  clanId: string;
  role: ClanRole;
  joinedAt: string;
  contribution: number;
  user: {
    id: string;
    username: string;
    avatar?: string;
    rating: number;
  };
}

export interface ClanRequirements {
  minRating?: number;
  minLevel?: number;
  invitationOnly?: boolean;
  approvalRequired?: boolean;
}

export interface ClanStats {
  totalWins: number;
  totalLosses: number;
  winRate: number;
  totalMatches: number;
  clanWarsWon: number;
  clanWarsLost: number;
  averageRating: number;
}

export enum ClanRole {
  LEADER = 'LEADER',
  OFFICER = 'OFFICER',
  MEMBER = 'MEMBER',
  RECRUIT = 'RECRUIT',
}

export interface CreateClanRequest {
  name: string;
  tag: string;
  description: string;
  isPublic: boolean;
  requirements?: ClanRequirements;
}

export interface JoinClanRequest {
  clanId: string;
  message?: string;
}

export interface ClanSearchFilters {
  search?: string;
  minRating?: number;
  maxMembers?: number;
  isPublic?: boolean;
  sortBy?: 'rating' | 'memberCount' | 'createdAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}
