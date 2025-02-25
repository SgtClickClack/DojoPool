export enum TournamentStatus {
    REGISTRATION = 'REGISTRATION',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export enum TournamentFormat {
    SINGLE_ELIMINATION = 'SINGLE_ELIMINATION',
    DOUBLE_ELIMINATION = 'DOUBLE_ELIMINATION',
    ROUND_ROBIN = 'ROUND_ROBIN',
    SWISS = 'SWISS'
}

export interface TournamentPlayer {
    id: string;
    name: string;
    rank: number;
    seed?: number;
    status: 'ACTIVE' | 'ELIMINATED' | 'WITHDRAWN';
    wins: number;
    losses: number;
    matchesPlayed: number;
}

export interface TournamentMatch {
    id: string;
    roundNumber: number;
    matchNumber: number;
    player1Id?: string;
    player2Id?: string;
    winnerId?: string;
    loserId?: string;
    score?: {
        player1: number;
        player2: number;
    };
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    startTime?: Date;
    endTime?: Date;
    tableNumber?: number;
}

export interface TournamentRound {
    roundNumber: number;
    matches: TournamentMatch[];
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    startTime?: Date;
    endTime?: Date;
}

export interface Tournament {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    status: 'upcoming' | 'in_progress' | 'completed';
    maxParticipants: number;
    currentParticipants: number;
    venue: {
        id: string;
        name: string;
    };
    entryFee: number;
    prizePools: {
        rank: number;
        amount: number;
    }[];
    rules: string[];
    format: 'single_elimination' | 'double_elimination' | 'round_robin';
    createdAt: string;
    updatedAt: string;
}

export interface TournamentParticipant {
    id: string;
    userId: string;
    tournamentId: string;
    name: string;
    rank: number;
    status: 'registered' | 'checked_in' | 'eliminated' | 'winner';
    joinedAt: string;
    stats: {
        matchesPlayed: number;
        matchesWon: number;
        matchesLost: number;
    };
}

export interface TournamentMatch {
    id: string;
    tournamentId: string;
    round: number;
    player1: {
        id: string;
        name: string;
        score: number;
    };
    player2: {
        id: string;
        name: string;
        score: number;
    };
    status: 'scheduled' | 'in_progress' | 'completed';
    winner?: string;
    startTime?: string;
    endTime?: string;
    table?: {
        id: string;
        name: string;
    };
}

export interface TournamentFilters {
    status?: 'upcoming' | 'in_progress' | 'completed';
    venueId?: string;
    startDate?: string;
    endDate?: string;
    format?: 'single_elimination' | 'double_elimination' | 'round_robin';
    minPrizePool?: number;
    maxPrizePool?: number;
}

export interface CreateTournamentData {
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    maxParticipants: number;
    venueId: string;
    entryFee: number;
    prizePools: {
        rank: number;
        amount: number;
    }[];
    rules: string[];
    format: 'single_elimination' | 'double_elimination' | 'round_robin';
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
    status?: 'scheduled' | 'in_progress' | 'completed';
    winner?: string;
    tableId?: string;
}

export interface TournamentBracket {
    rounds: {
        round: number;
        matches: TournamentMatch[];
    }[];
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