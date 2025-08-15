/**
 * Tournament Type Definitions
 * 
 * Comprehensive type definitions for the unified tournament system
 */

export interface Tournament {
  id: number;
  name: string;
  description?: string;
  venueId: number;
  organizerId: number;
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  maxParticipants: number;
  entryFee: number;
  prizePool: number;
  status: TournamentStatus;
  format: TournamentFormat;
  rules?: string;
  createdAt: Date;
  updatedAt: Date;
  participantCount: number;
  venue?: Venue;
  organizer?: User;
}

export interface TournamentParticipant {
  id: number;
  tournamentId: number;
  userId: number;
  username: string;
  seed?: number;
  status: 'registered' | 'checked_in' | 'eliminated' | 'withdrawn';
  registrationDate: Date;
  checkInTime?: Date;
  eliminationRound?: number;
  finalPlacement?: number;
  user?: User;
}

export interface TournamentMatch {
  id: string;
  tournamentId: number;
  roundNumber: number;
  matchNumber: number;
  player1Id?: number;
  player2Id?: number;
  player1Name?: string;
  player2Name?: string;
  player1Score?: number;
  player2Score?: number;
  winnerId?: number;
  status: MatchStatus;
  bracketType: 'winners' | 'losers' | 'consolation';
  isBye?: boolean;
  isForfeit?: boolean;
  startTime?: Date;
  endTime?: Date;
  nextMatchId?: string;
  previousMatchIds?: string[];
}

export interface TournamentRound {
  id: number;
  tournamentId: number;
  roundNumber: number;
  name: string;
  matches: TournamentMatch[];
  isActive: boolean;
  isCompleted: boolean;
  startTime?: Date;
  endTime?: Date;
}

export interface TournamentBracket {
  id: string;
  tournamentId: number;
  type: TournamentFormat;
  status: TournamentStatus;
  rounds: TournamentRound[];
  nodes: BracketNode[];
  participants: TournamentParticipant[];
  currentRound: number;
  totalRounds: number;
  totalMatches: number;
  completedMatches: number;
  startDate: Date;
  endDate?: Date;
  seedingMethod: SeedingMethod;
  consolationRounds: boolean;
}

export interface BracketNode {
  id: string;
  matchId?: number;
  player1Id?: number;
  player2Id?: number;
  player1Name?: string;
  player2Name?: string;
  player1Score?: number;
  player2Score?: number;
  winnerId?: number;
  status: MatchStatus;
  round: number;
  matchNumber: number;
  bracketType: 'winners' | 'losers' | 'consolation';
  nextMatchId?: string;
  previousMatchIds?: string[];
  isBye?: boolean;
  isForfeit?: boolean;
}

export interface TournamentConfig {
  id?: number;
  name: string;
  description?: string;
  venueId: number;
  organizerId: number;
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  maxParticipants: number;
  entryFee: number;
  prizePool: number;
  format: TournamentFormat;
  rules?: string;
  seedingMethod?: SeedingMethod;
  autoStart?: boolean;
  checkInRequired?: boolean;
  consolationRounds?: boolean;
}

export const TournamentFormat = {
  SINGLE_ELIMINATION: 'single_elimination',
  DOUBLE_ELIMINATION: 'double_elimination',
  ROUND_ROBIN: 'round_robin',
  SWISS: 'swiss',
  CONSOLATION: 'consolation'
} as const;

export type TournamentFormat = typeof TournamentFormat[keyof typeof TournamentFormat];

export const TournamentStatus = {
  DRAFT: 'draft',
  REGISTRATION: 'registration',
  CHECK_IN: 'check_in',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export type TournamentStatus = typeof TournamentStatus[keyof typeof TournamentStatus];

export const SeedingMethod = {
  RANDOM: 'random',
  RATING: 'rating',
  RANKING: 'ranking',
  MANUAL: 'manual',
  TOURNAMENT_HISTORY: 'tournament_history'
} as const;

export type SeedingMethod = typeof SeedingMethod[keyof typeof SeedingMethod];

export const MatchStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  BYE: 'bye',
  FORFEIT: 'forfeit'
} as const;

export type MatchStatus = typeof MatchStatus[keyof typeof MatchStatus];

// Import types that are referenced
export interface User {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string;
  rating?: number;
  ranking?: number;
}

export interface Venue {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
}
