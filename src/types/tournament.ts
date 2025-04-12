export enum TournamentState {
  REGISTRATION = 'REGISTRATION',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum TournamentType {
  SINGLES = 'SINGLES',
  DOUBLES = 'DOUBLES',
  TEAM = 'TEAM',
  HANDICAP = 'HANDICAP'
}

export interface Tournament {
  id: string;
  name: string;
  type: TournamentType;
  startDate: Date;
  endDate: Date;
  venueId: string;
  organizerId: string;
  maxParticipants: number;
  entryFee: number;
  state: TournamentState;
  winnerId?: string;
  runnerUpId?: string;
  createdAt: Date;
  updatedAt: Date;
  endedAt?: Date;
} 