export interface ClanMember {
  id: string;
  clanId: string;
  userId: string;
  role: 'MEMBER' | 'OFFICER' | 'LEADER';
  joinedAt: string;
}

export interface ClanTerritory {
  id: string;
  venueId: string;
  name: string;
  ownerId?: string;
  clanId: string;
  level: number;
  defenseScore: number;
  resources: string;
  strategicValue: number;
  resourceRate: string;
  lastTickAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClanLeader {
  id: string;
  email: string;
  username: string;
  // Add other user properties as needed
}

export interface Clan {
  id: string;
  name: string;
  description?: string;
  motto?: string;
  logo?: string;
  banner?: string;
  tag: string;
  leaderId: string;
  leader?: ClanLeader;
  maxMembers: number;
  dojoCoinBalance?: number;
  seasonalPoints?: number;
  level: number;
  experience: number;
  experienceToNext: number;
  reputation: number;
  isActive: boolean;
  location: string;
  warWins: number;
  warLosses: number;
  territoryCount: number;
  members: ClanMember[];
  territories: ClanTerritory[];
  createdAt: string;
  updatedAt: string;
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
