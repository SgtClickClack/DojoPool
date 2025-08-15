export enum MatchType {
  SINGLES = "SINGLES",
  DOUBLES = "DOUBLES",
  TEAM = "TEAM",
  PRACTICE = "PRACTICE",
}

export enum MatchState {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface Match {
  id: string;
  tournamentId: string;
  player1Id: string;
  player2Id: string;
  type: MatchType;
  startTime: Date;
  tableId: string;
  state: MatchState;
  player1Score?: number;
  player2Score?: number;
  winnerId?: string;
  createdAt: Date;
  updatedAt: Date;
  endedAt?: Date;
}
