/**
 * Common TypeScript interfaces to replace 'any' types throughout the DojoPool codebase
 */

// Cache-related types
export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  expiresAt?: number;
  tags?: string[];
}

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize?: number;
  strategy?: 'lru' | 'fifo' | 'ttl';
}

// Event context types
export interface GameEventContext {
  gameId: string;
  matchId?: string;
  tournamentId?: string;
  timestamp: Date;
  gameState: 'waiting' | 'active' | 'paused' | 'completed';
  currentPlayer?: string;
  score?: Record<string, number>;
  turn?: number;
  shotCount?: number;
}

export interface ShotEventContext extends GameEventContext {
  shotType: 'break' | 'straight' | 'bank' | 'combo' | 'safety' | 'eight_ball';
  ballsRemaining: number;
  power: number;
  accuracy: number;
  success: boolean;
  difficulty: number;
  ballsHit: string[];
  ballsPocketed: string[];
  fouls: string[];
}

export interface CommentaryEventContext extends GameEventContext {
  eventType: 'shot' | 'foul' | 'score' | 'turnover' | 'timeout' | 'highlight' | 'analysis';
  playerId?: string;
  playerName?: string;
  description: string;
  excitementLevel: number;
  importance: number;
}

// Narrative event types
export interface NarrativeEventValue {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  value: string | number | boolean | Record<string, unknown> | unknown[];
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface NarrativeConditionValue {
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists';
  value: string | number | boolean | Record<string, unknown> | unknown[];
  strict?: boolean;
}

// Tournament types
export interface TournamentBracket {
  type: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  rounds: TournamentRound[];
  participants: TournamentParticipant[];
  settings: TournamentBracketSettings;
  metadata: TournamentBracketMetadata;
}

export interface TournamentRound {
  id: string;
  roundNumber: number;
  matches: TournamentMatch[];
  status: 'pending' | 'in_progress' | 'completed';
  startTime?: Date;
  endTime?: Date;
}

export interface TournamentMatch {
  id: string;
  roundId: string;
  participant1Id: string;
  participant2Id: string;
  winnerId?: string;
  score?: TournamentMatchScore;
  status: 'scheduled' | 'in_progress' | 'completed' | 'forfeit';
  scheduledTime?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
}

export interface TournamentParticipant {
  id: string;
  userId: string;
  userName: string;
  seedPosition?: number;
  status: 'active' | 'eliminated' | 'bye';
  stats: TournamentParticipantStats;
}

export interface TournamentBracketSettings {
  allowByes: boolean;
  randomizeSeeds: boolean;
  advancementRules: 'wins' | 'points' | 'games';
  tiebreakers: string[];
  maxParticipants?: number;
  minParticipants?: number;
}

export interface TournamentBracketMetadata {
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  version: string;
  format: string;
  rules: string[];
}

export interface TournamentMatchScore {
  participant1Score: number;
  participant2Score: number;
  gameScores?: Array<{
    participant1: number;
    participant2: number;
    gameNumber: number;
  }>;
  totalGames: number;
  format: 'race_to' | 'best_of' | 'sets';
}

export interface TournamentParticipantStats {
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  gamesWon: number;
  gamesLost: number;
  winPercentage: number;
  averageGameDuration: number;
  totalPlayTime: number;
}

// Mobile service types
export interface MobileServiceRequest {
  userId: string;
  deviceId: string;
  platform: 'ios' | 'android';
  appVersion: string;
  requestId: string;
  timestamp: Date;
}

export interface MobileServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  requestId: string;
  timestamp: Date;
  cacheInfo?: {
    cached: boolean;
    expiresAt?: Date;
  };
}

export interface MobileUserProfile {
  userId: string;
  userName: string;
  avatar?: string;
  level: number;
  experience: number;
  ranking: number;
  preferences: MobileUserPreferences;
  achievements: string[];
  stats: MobileUserStats;
}

export interface MobileUserPreferences {
  notifications: boolean;
  sound: boolean;
  vibration: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  autoJoinMatches: boolean;
  shareProgress: boolean;
}

export interface MobileUserStats {
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  averageMatchDuration: number;
  favoriteGameType: string;
  totalPlayTime: number;
  lastActive: Date;
}

export interface MobileUserSettings {
  deviceSettings: {
    pushNotifications: boolean;
    locationServices: boolean;
    cameraAccess: boolean;
    microphoneAccess: boolean;
  };
  gameSettings: {
    difficulty: 'easy' | 'normal' | 'hard' | 'expert';
    autoAim: boolean;
    hapticFeedback: boolean;
    commentaryEnabled: boolean;
  };
  privacySettings: {
    profileVisibility: 'public' | 'friends' | 'private';
    shareStats: boolean;
    allowFriendRequests: boolean;
  };
}

// Security types
export interface SecurityEventDetails {
  eventType: 'login' | 'logout' | 'failed_login' | 'permission_denied' | 'suspicious_activity';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata: Record<string, unknown>;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

// Avatar progression types
export interface AvatarEventData {
  eventType: 'match_won' | 'tournament_won' | 'achievement_unlocked' | 'level_up' | 'skill_improved';
  playerId: string;
  metadata: {
    matchType?: string;
    tournamentType?: string;
    achievementId?: string;
    newLevel?: number;
    skillType?: string;
    skillValue?: number;
    experienceGained?: number;
  };
  timestamp: Date;
}

// Blockchain types
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
  properties: Record<string, unknown>;
  external_url?: string;
  animation_url?: string;
  background_color?: string;
}

// AI Commentary types
export interface AICommentaryContext extends CommentaryEventContext {
  previousEvents: CommentaryEventContext[];
  playerStats: Record<string, unknown>;
  matchHistory: unknown[];
  gameRules: Record<string, unknown>;
  venueInfo?: Record<string, unknown>;
}

// Wallet connection types
export interface EthereumProvider {
  isMetaMask?: boolean;
  isConnected(): boolean;
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on(event: string, handler: (...args: unknown[]) => void): void;
  removeListener(event: string, handler: (...args: unknown[]) => void): void;
}

// Error logging types
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  url?: string;
  component?: string;
  action?: string;
  timestamp: Date;
  environment: 'development' | 'staging' | 'production';
  version: string;
  [key: string]: unknown;
}

// Generic API response types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    requestId: string;
    timestamp: Date;
    version: string;
  };
}

// Validation types
export interface ValidationRule {
  type: 'required' | 'string' | 'number' | 'email' | 'url' | 'date' | 'array' | 'object';
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean | string;
  message?: string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule | ValidationRule[];
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    value?: unknown;
  }>;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Timestamp = number; // Unix timestamp in milliseconds

export type ID = string; // Unique identifier type

export type Color = string; // Hex color code or CSS color name

export type URL = string; // Valid URL string