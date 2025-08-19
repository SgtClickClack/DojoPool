/**
 * Tournament Type Definitions for DojoPool Web App
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
  round: number;
  matchNumber: number;
  player1Id?: number;
  player2Id?: number;
  participant1?: TournamentParticipant;
  participant2?: TournamentParticipant;
  player1Score?: number;
  player2Score?: number;
  score?: string;
  winnerId?: number;
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
  participants: TournamentParticipant[];
  participantCount?: number;
  currentRound: number;
  totalRounds: number;
  totalMatches: number;
  completedMatches: number;
  startDate: Date;
  endDate?: Date;
}

export type TournamentStatus =
  | 'draft'
  | 'open'
  | 'registration_closed'
  | 'active'
  | 'completed'
  | 'cancelled';

export type TournamentFormat =
  | 'single_elimination'
  | 'double_elimination'
  | 'round_robin'
  | 'swiss'
  | 'custom';

export type MatchStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'bye'
  | 'forfeit';

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Venue {
  id: number;
  name: string;
  address: string;
}
