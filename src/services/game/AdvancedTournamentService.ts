import { BrowserEventEmitter } from '../../utils/BrowserEventEmitter';

export interface TournamentChallenge {
  id: string;
  type: 'tournament';
  challengerId: string;
  dojoId: string;
  status: 'pending' | 'accepted' | 'declined' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  tournamentId: string;
  tournamentName: string;
  entryFee?: number;
  maxParticipants?: number;
  currentParticipants?: number;
  startDate?: Date;
  endDate?: Date;
  rules?: string[];
  requirements?: {
    minLevel?: number;
    minReputation?: number;
    clanMembership?: boolean;
    territoryControl?: boolean;
  };
  bracketType: 'single_elimination' | 'double_elimination' | 'round_robin';
  currentRound: number;
  totalRounds: number;
  participants: TournamentParticipant[];
  matches: TournamentMatch[];
}

export interface TournamentParticipant {
  playerId: string;
  playerName: string;
  clanId?: string;
  clanName?: string;
  seed?: number;
  status: 'active' | 'eliminated' | 'winner';
  wins: number;
  losses: number;
}

export interface TournamentMatch {
  matchId: string;
  round: number;
  player1Id: string;
  player2Id: string;
  winnerId?: string;
  status: 'pending' | 'active' | 'completed';
  score?: {
    player1: number;
    player2: number;
  };
}

export interface CreateTournamentData {
  name: string;
  dojoId: string;
  entryFee: number;
  maxParticipants: number;
  bracketType: 'single_elimination' | 'double_elimination' | 'round_robin';
  startDate: Date;
  endDate: Date;
  rules: string[];
  requirements: {
    minLevel?: number;
    minReputation?: number;
    clanMembership?: boolean;
  };
}

/**
 * Focused service for managing advanced tournament functionality
 * Handles tournament creation, bracket generation, and participant management
 */
export class AdvancedTournamentService extends BrowserEventEmitter {
  private tournaments: Map<string, TournamentChallenge> = new Map();
  private idCounter: number = 0; // Add counter to prevent ID collisions

  constructor() {
    super();
  }

  /**
   * Generate unique ID with timestamp and counter to prevent collisions
   */
  private generateUniqueId(prefix: string): string {
    const timestamp = Date.now();
    const counter = ++this.idCounter;
    return `${prefix}-${timestamp}-${counter}`;
  }

  /**
   * Create a new tournament challenge
   */
  async createTournamentChallenge(tournamentData: CreateTournamentData): Promise<TournamentChallenge> {
    try {
      // Generate single unique ID and use it for both challenge and tournament
      const uniqueId = this.generateUniqueId('tournament');
      
      const tournamentChallenge: TournamentChallenge = {
        id: uniqueId,
        type: 'tournament',
        challengerId: 'current-player', // Get from game state
        dojoId: tournamentData.dojoId,
        status: 'pending',
        createdAt: new Date(),
        tournamentId: uniqueId, // Use same ID for internal consistency
        tournamentName: tournamentData.name,
        entryFee: tournamentData.entryFee,
        maxParticipants: tournamentData.maxParticipants,
        currentParticipants: 0,
        startDate: tournamentData.startDate,
        endDate: tournamentData.endDate,
        rules: tournamentData.rules,
        requirements: tournamentData.requirements,
        bracketType: tournamentData.bracketType,
        currentRound: 0,
        totalRounds: this.calculateTotalRounds(tournamentData.maxParticipants, tournamentData.bracketType),
        participants: [],
        matches: []
      };

      this.tournaments.set(tournamentChallenge.id, tournamentChallenge);
      this.emit('tournamentChallengeCreated', tournamentChallenge);

      return tournamentChallenge;
    } catch (error) {
      console.error('Error creating tournament challenge:', error);
      throw error;
    }
  }

  /**
   * Join a tournament
   */
  async joinTournament(tournamentId: string, playerId: string, playerName: string, clanId?: string): Promise<boolean> {
    try {
      const tournament = this.tournaments.get(tournamentId);

      if (!tournament) {
        throw new Error('Tournament not found');
      }

      if ((tournament.currentParticipants || 0) >= (tournament.maxParticipants || 0)) {
        throw new Error('Tournament is full');
      }

      const participant: TournamentParticipant = {
        playerId,
        playerName,
        clanId,
        clanName: 'Clan Name', // Get from clan service
        status: 'active',
        wins: 0,
        losses: 0
      };

      tournament.participants.push(participant);
      tournament.currentParticipants = (tournament.currentParticipants || 0) + 1;

      this.tournaments.set(tournamentId, tournament);
      this.emit('tournamentJoined', { tournamentId, participant });

      return true;
    } catch (error) {
      console.error('Error joining tournament:', error);
      throw error;
    }
  }

  /**
   * Generate tournament bracket
   */
  generateBracket(tournamentId: string): TournamentMatch[] {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const matches: TournamentMatch[] = [];
    const participants = [...tournament.participants];

    // Shuffle participants for fair matchups
    this.shuffleArray(participants);

    // Generate first round matches
    for (let i = 0; i < participants.length; i += 2) {
      if (i + 1 < participants.length) {
        const match: TournamentMatch = {
          matchId: `match-${tournamentId}-${Date.now()}-${i}`,
          round: 1,
          player1Id: participants[i].playerId,
          player2Id: participants[i + 1].playerId,
          status: 'pending'
        };
        matches.push(match);
      }
    }

    tournament.matches = matches;
    this.tournaments.set(tournamentId, tournament);

    return matches;
  }

  /**
   * Advance tournament to next round
   */
  advanceToNextRound(tournamentId: string): void {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const currentRoundMatches = tournament.matches.filter(
      match => match.round === tournament.currentRound + 1 && match.status === 'completed'
    );

    if (currentRoundMatches.length === 0) {
      throw new Error('No completed matches in current round');
    }

    // Generate next round matches from winners
    const winners = currentRoundMatches
      .filter(match => match.winnerId)
      .map(match => match.winnerId!);

    if (winners.length <= 1) {
      // Tournament is complete
      tournament.status = 'completed';
      this.emit('tournamentCompleted', { tournamentId, winnerId: winners[0] });
      return;
    }

    const nextRoundMatches: TournamentMatch[] = [];
    for (let i = 0; i < winners.length; i += 2) {
      if (i + 1 < winners.length) {
        const match: TournamentMatch = {
          matchId: `match-${tournamentId}-${Date.now()}-${i}`,
          round: tournament.currentRound + 2,
          player1Id: winners[i],
          player2Id: winners[i + 1],
          status: 'pending'
        };
        nextRoundMatches.push(match);
      }
    }

    tournament.matches.push(...nextRoundMatches);
    tournament.currentRound++;
    this.tournaments.set(tournamentId, tournament);

    this.emit('tournamentRoundAdvanced', { tournamentId, round: tournament.currentRound });
  }

  /**
   * Record match result
   */
  recordMatchResult(tournamentId: string, matchId: string, winnerId: string, score?: { player1: number; player2: number }): void {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const match = tournament.matches.find(m => m.matchId === matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    match.winnerId = winnerId;
    match.status = 'completed';
    if (score) {
      match.score = score;
    }

    // Update participant stats
    const winner = tournament.participants.find(p => p.playerId === winnerId);
    const loser = tournament.participants.find(p => 
      p.playerId === (match.player1Id === winnerId ? match.player2Id : match.player1Id)
    );

    if (winner) winner.wins++;
    if (loser) loser.losses++;

    this.tournaments.set(tournamentId, tournament);
    this.emit('matchResultRecorded', { tournamentId, matchId, winnerId });
  }

  /**
   * Get tournament details
   */
  getTournament(tournamentId: string): TournamentChallenge | undefined {
    return this.tournaments.get(tournamentId);
  }

  /**
   * Get all tournaments
   */
  getAllTournaments(): TournamentChallenge[] {
    return Array.from(this.tournaments.values());
  }

  /**
   * Get active tournaments
   */
  getActiveTournaments(): TournamentChallenge[] {
    return Array.from(this.tournaments.values()).filter(
      tournament => tournament.status === 'active' || tournament.status === 'pending'
    );
  }

  /**
   * Calculate total rounds needed for tournament
   */
  private calculateTotalRounds(participants: number, bracketType: string): number {
    switch (bracketType) {
      case 'single_elimination':
        return Math.ceil(Math.log2(participants));
      case 'double_elimination':
        return Math.ceil(Math.log2(participants)) * 2;
      case 'round_robin':
        return participants - 1;
      default:
        return Math.ceil(Math.log2(participants));
    }
  }

  /**
   * Shuffle array for fair participant distribution
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Check if tournament is ready to start
   */
  isTournamentReady(tournamentId: string): boolean {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return false;

    return (tournament.currentParticipants || 0) >= 2 && 
           !!tournament.startDate && 
           new Date() >= tournament.startDate;
  }

  /**
   * Start tournament
   */
  startTournament(tournamentId: string): void {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (!this.isTournamentReady(tournamentId)) {
      throw new Error('Tournament is not ready to start');
    }

    tournament.status = 'active';
    tournament.currentRound = 1;
    
    // Generate initial bracket
    this.generateBracket(tournamentId);
    
    this.tournaments.set(tournamentId, tournament);
    this.emit('tournamentStarted', { tournamentId });
  }
}

export default new AdvancedTournamentService();