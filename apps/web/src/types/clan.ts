export interface Clan {
  id: string;
  name: string;
  description?: string;
  motto?: string;
  logo?: string;
  banner?: string;
  leaderId: string;
  leader?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  memberCount: number;
  maxMembers: number;
  level: number;
  experience: number;
  dojoCoins: number;
  dojoCoinBalance?: number;
  reputation: number;
  territoriesControlled: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClanMember {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  role: ClanRole;
  joinedAt: string;
  lastActive: string;
  contributionScore: number;
}

export enum ClanRole {
  LEADER = 'leader',
  OFFICER = 'officer',
  MEMBER = 'member',
}

// Export individual enum values for use in other files
export const { LEADER, OFFICER, MEMBER } = ClanRole;

export interface ClanJoinRequest {
  clanId: string;
  message?: string;
}

export interface ClanUpdateData {
  name?: string;
  description?: string;
  motto?: string;
  logo?: string;
  banner?: string;
}

export interface ClanFilters {
  search?: string;
  level?: number;
  minMembers?: number;
  maxMembers?: number;
  sortBy?: 'name' | 'level' | 'members' | 'reputation' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ClanListResponse {
  clans: Clan[];
  total: number;
  page: number;
  totalPages: number;
}
