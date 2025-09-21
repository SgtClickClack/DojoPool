export interface JournalEntry {
  id: string;
  type: JournalEntryType;
  message: string;
  metadata?: Record<string, any>;
  createdAt: string;
  userId: string;
}

export enum JournalEntryType {
  MATCH_PLAYED = 'MATCH_PLAYED',
  TOURNAMENT_JOINED = 'TOURNAMENT_JOINED',
  TOURNAMENT_WON = 'TOURNAMENT_WON',
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  FRIEND_ADDED = 'FRIEND_ADDED',
  TERRITORY_CAPTURED = 'TERRITORY_CAPTURED',
  CLAN_JOINED = 'CLAN_JOINED',
  VENUE_CHECKIN = 'VENUE_CHECKIN',
  CHALLENGE_ISSUED = 'CHALLENGE_ISSUED',
  CHALLENGE_ACCEPTED = 'CHALLENGE_ACCEPTED',
  SKILL_LEVEL_UP = 'SKILL_LEVEL_UP',
  DOJO_COINS_EARNED = 'DOJO_COINS_EARNED',
  NFT_ACQUIRED = 'NFT_ACQUIRED',
  SYSTEM_EVENT = 'SYSTEM_EVENT',
}

// Export individual enum values for use in other files
export const {
  MATCH_PLAYED,
  TOURNAMENT_JOINED,
  TOURNAMENT_WON,
  ACHIEVEMENT_UNLOCKED,
  FRIEND_ADDED,
  TERRITORY_CAPTURED,
  CLAN_JOINED,
  VENUE_CHECKIN,
  CHALLENGE_ISSUED,
  CHALLENGE_ACCEPTED,
  SKILL_LEVEL_UP,
  DOJO_COINS_EARNED,
  NFT_ACQUIRED,
  SYSTEM_EVENT,
} = JournalEntryType;

export interface JournalResponse {
  entries: JournalEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface JournalEntryIconProps {
  type: JournalEntryType;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}
