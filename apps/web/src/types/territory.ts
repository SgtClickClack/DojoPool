export interface TerritoryOwner {
  id: string;
  username: string;
}

export interface TerritoryClan {
  id: string;
  name: string;
  tag: string;
  color: string;
}

export interface TerritoryData {
  id: string;
  name: string;
  venueId: string;
  venue?: {
    id: string;
    name: string;
    lat: number;
    lng: number;
  };
  owner?: TerritoryOwner | null;
  clan?: TerritoryClan | null;
  level: number;
  defenseScore: number;
  strategicValue: number;
  resources?: Record<string, number>;
  coordinates?: {
    lat: number;
    lng: number;
  };
  status: 'UNCLAIMED' | 'CLAIMED' | 'CONTESTED' | 'DEFENDED';
  lastActivity?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TerritoryClaimRequest {
  territoryId: string;
  playerId: string;
  clanId?: string;
}

export interface TerritoryChallengeRequest {
  territoryId: string;
  challengerId: string;
  challengerClanId?: string;
  stake?: number; // DojoCoins staked
}

export interface TerritoryScoutRequest {
  playerId: string;
}

export interface TerritoryClaimResponse {
  success: boolean;
  territory?: TerritoryData;
  message: string;
  battleId?: string; // If contested claim leads to battle
}

export interface TerritoryChallengeResponse {
  success: boolean;
  challengeId: string;
  message: string;
  battleScheduled?: string;
}

export interface TerritoryScoutResponse {
  success: boolean;
  territory: TerritoryData;
  intelligence: {
    owner?: TerritoryOwner;
    clan?: TerritoryClan;
    defenseScore: number;
    recentActivity: string[];
    vulnerabilities: string[];
  };
  message: string;
}

export interface TerritoryMapData {
  territories: TerritoryData[];
  totalTerritories: number;
  contestedTerritories: number;
  userTerritories: number;
  clanTerritories: number;
  lastUpdate: string;
}
