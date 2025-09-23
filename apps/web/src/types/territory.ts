// Territory-related type definitions for DojoPool platform
export interface Territory {
  id: string;
  name: string;
  venueId: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  owner?: {
    id: string;
    username: string;
    avatarUrl?: string;
  } | null;
  clan?: {
    id: string;
    name: string;
    logo?: string;
  } | null;
  level: number;
  defenseScore: number;
  strategicValue: number;
  resources: Record<string, number>;
  lastCaptured?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TerritoryFilters {
  bbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  ownerId?: string;
  clanId?: string;
  level?: number;
  minDefense?: number;
  maxDefense?: number;
}

export interface TerritoryManageAction {
  action: 'upgrade_defense' | 'allocate_resources' | 'transfer_ownership';
  payload?: Record<string, unknown>;
}

export interface TerritoryScoutResult {
  success: boolean;
  eventId?: string;
  territory?: Territory;
  error?: string;
}

export interface TerritoryManageResult {
  success: boolean;
  territory?: Territory;
  error?: string;
  cost?: number;
}
