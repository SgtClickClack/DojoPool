export interface PlayerMapPin {
  id: string;
  username: string;
  avatarUrl: string;
  coordinates: [number, number]; // [longitude, latitude]
  status: 'online' | 'offline' | 'in-match';
  clan?: string;
  level?: number;
}

export interface DojoMapPin {
  id: string;
  name: string;
  controllingClan?: string;
  clanLogoUrl?: string;
  coordinates: [number, number]; // [longitude, latitude]
  address: string;
  level: number;
  isActive: boolean;
  // Territory control information
  controllingPlayerId?: string;
  controllingPlayerName?: string;
  controllingPlayerAvatar?: string;
  isControlled: boolean;
}

export interface DojoVenue {
  id: string;
  name: string;
  coordinates: [number, number];
  address: string;
  currentController?: string;
  clan?: string;
  level: number;
  isActive: boolean;
}

export interface ActiveMatch {
  id: string;
  player1: string;
  player2: string;
  venue: string;
  coordinates: [number, number];
  status: 'in-progress' | 'waiting' | 'completed';
  startTime: string;
  estimatedDuration: number;
}

export interface TerritoryControl {
  id: string;
  name: string;
  coordinates: [number, number];
  controllingClan: string;
  controlLevel: number;
  lastContested: string;
  isUnderAttack: boolean;
}
