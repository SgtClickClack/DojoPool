/**
 * CANONICAL Tournament Type Definitions for DojoPool Web App
 *
 * This file consolidates all tournament-related types into a single, consistent
 * definition to eliminate the 635+ TypeScript errors caused by conflicting types.
 *
 * All other tournament type files should import from this file instead of
 * defining their own conflicting interfaces.
 */

// ============================================================================
// CORE TOURNAMENT TYPES
// ============================================================================

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  venueId: string;
  organizerId: string;
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  maxParticipants: number;
  entryFee: number;
  prizePool: number;
  status: TournamentStatus;
  format: TournamentFormat;
  rules?: string[];
  createdAt: Date;
  updatedAt: Date;
  participantCount: number;
  venue?: Venue;
  organizer?: User;
}

export interface TournamentParticipant {
  id: string;
  tournamentId: string;
  userId: string;
  username: string;
  seed?: number;
  status: ParticipantStatus;
  registrationDate: Date;
  checkInTime?: Date;
  eliminationRound?: number;
  finalPlacement?: number;
  user?: User;
}

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  round: number;
  matchNumber: number;
  player1Id?: string;
  player2Id?: string;
  participant1?: TournamentParticipant;
  participant2?: TournamentParticipant;
  player1Score?: number;
  player2Score?: number;
  score?: string;
  winnerId?: string;
  winner?: TournamentParticipant;
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
  id: string;
  tournamentId: string;
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
  tournamentId: string;
  type: TournamentFormat;
  status: TournamentStatus;
  rounds: TournamentRound[];
  participants: TournamentParticipant[];
  participantCount?: number;
  currentRound: number;
  totalRounds: number;
  totalMatches: number;
  completedMatches: number;
  startDate: Date;
  endDate?: Date;
}

// ============================================================================
// STATUS ENUMS (CONSOLIDATED)
// ============================================================================

export type TournamentStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'REGISTRATION_CLOSED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED';

export type TournamentFormat =
  | 'SINGLE_ELIMINATION'
  | 'DOUBLE_ELIMINATION'
  | 'ROUND_ROBIN'
  | 'SWISS'
  | 'CUSTOM';

export type MatchStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'BYE'
  | 'FORFEIT';

export type ParticipantStatus =
  | 'REGISTERED'
  | 'CHECKED_IN'
  | 'ELIMINATED'
  | 'WITHDRAWN';

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface TournamentFilters {
  status?: TournamentStatus;
  venueId?: string;
  startDate?: Date;
  endDate?: Date;
  format?: TournamentFormat;
  minPrizePool?: number;
  maxPrizePool?: number;
}

export interface CreateTournamentData {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  maxParticipants: number;
  venueId: string;
  entryFee: number;
  prizePool: number;
  rules?: string[];
  format: TournamentFormat;
}

export interface UpdateTournamentData extends Partial<CreateTournamentData> {
  id: string;
}

export interface TournamentRegistrationData {
  tournamentId: string;
  userId: string;
}

export interface TournamentMatchUpdateData {
  matchId: string;
  player1Score?: number;
  player2Score?: number;
  status?: MatchStatus;
  winner?: string;
  tableId?: string;
}

export interface TournamentStats {
  totalParticipants: number;
  totalMatches: number;
  completedMatches: number;
  averageMatchDuration: number;
  topPlayers: {
    id: string;
    name: string;
    wins: number;
  }[];
}
