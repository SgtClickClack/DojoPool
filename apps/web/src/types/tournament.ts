export const enum TournamentStatus {
  UPCOMING = 'UPCOMING',
  REGISTRATION = 'REGISTRATION',
  ACTIVE = 'ACTIVE',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export type TournamentStatusType = TournamentStatus; // For type usage

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  venueId?: string;
  startDate: string;
  endDate?: string;
  status: TournamentStatus;
  maxPlayers: number;
  entryFee: number;
  prizePool: number;
  participants: Array<{
    id: string;
    username: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
