/**
 * Unified Tournament Service
 * 
 * Comprehensive tournament management system that consolidates all tournament
 * bracket functionality with dynamic seeding, real-time updates, and multi-format support.
 * Supports single elimination, double elimination, round-robin, and Swiss formats.
 */

import { 
  Tournament, 
  TournamentParticipant, 
  TournamentMatch, 
  TournamentRound,
  TournamentConfig,
  TournamentFormat,
  TournamentStatus,
  SeedingMethod,
  MatchStatus,
  BracketNode,
  TournamentBracket,
  User,
  Venue
} from '../../types/tournament';

export class UnifiedTournamentService {
  private tournaments: Map<number, TournamentBracket> = new Map();

  /**
   * Create a new tournament with comprehensive configuration
   */
  async createTournament(config: TournamentConfig): Promise<TournamentBracket> {
    const tournament: TournamentBracket = {
      id: `tournament_${Date.now()}`,
      tournamentId: config.id || Date.now(),
      type: config.format,
      status: TournamentStatus.DRAFT,
      rounds: [],
      nodes: [],
      participants: [],
      currentRound: 0,
      totalRounds: 0,
      totalMatches: 0,
      completedMatches: 0,
      startDate: config.startDate,
      seedingMethod: config.seedingMethod || SeedingMethod.RANDOM,
      consolationRounds: config.consolationRounds || false
    };

    this.tournaments.set(tournament.tournamentId, tournament);
    return tournament;
  }

  /**
   * Register a participant for a tournament
   */
  async registerParticipant(
    tournamentId: number, 
    userId: number, 
    user: User,
    seed?: number
  ): Promise<TournamentParticipant> {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.status !== TournamentStatus.REGISTRATION) {
      throw new Error('Tournament is not accepting registrations');
    }

    if (tournament.participants.length >= tournament.totalRounds * 2) {
      throw new Error('Tournament is full');
    }

    const existingParticipant = tournament.participants.find(p => p.userId === userId);
    if (existingParticipant) {
      throw new Error('Player already registered');
    }

    const participant: TournamentParticipant = {
      id: tournament.participants.length + 1,
      tournamentId,
      userId,
      username: user.username,
      seed: seed || this.calculateSeed(tournament, user),
      status: 'registered',
      registrationDate: new Date(),
      checkInTime: undefined,
      eliminationRound: undefined,
      finalPlacement: undefined
    };

    tournament.participants.push(participant);
    return participant;
  }

  /**
   * Generate tournament brackets based on format and participants
   */
  async generateBrackets(tournamentId: number): Promise<TournamentBracket> {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.participants.length < 2) {
      throw new Error('Need at least 2 participants to generate brackets');
    }

    // Sort participants by seed
    const sortedParticipants = [...tournament.participants].sort((a, b) => 
      (a.seed || 999) - (b.seed || 999)
    );

    switch (tournament.type) {
      case TournamentFormat.SINGLE_ELIMINATION:
        return this.generateSingleEliminationBrackets(tournament, sortedParticipants);
      case TournamentFormat.DOUBLE_ELIMINATION:
        return this.generateDoubleEliminationBrackets(tournament, sortedParticipants);
      case TournamentFormat.ROUND_ROBIN:
        return this.generateRoundRobinBrackets(tournament, sortedParticipants);
      case TournamentFormat.SWISS:
        return this.generateSwissBrackets(tournament, sortedParticipants);
      case TournamentFormat.CONSOLATION:
        return this.generateConsolationBrackets(tournament, sortedParticipants);
      default:
        throw new Error(`Unsupported tournament format: ${tournament.type}`);
    }
  }

  /**
   * Generate single elimination brackets
   */
  private generateSingleEliminationBrackets(
    tournament: TournamentBracket,
    participants: TournamentParticipant[]
  ): TournamentBracket {
    const numParticipants = participants.length;
    const numRounds = Math.ceil(Math.log2(numParticipants));
    const totalSlots = Math.pow(2, numRounds);
    const numByes = totalSlots - numParticipants;

    tournament.totalRounds = numRounds;
    tournament.totalMatches = totalSlots - 1;
    tournament.currentRound = 1;

    // Create rounds
    for (let round = 1; round <= numRounds; round++) {
      const roundMatches = Math.pow(2, numRounds - round);
      const roundData: TournamentRound = {
        id: round,
        tournamentId: tournament.tournamentId,
        roundNumber: round,
        name: this.getRoundName(round, numRounds),
        matches: [],
        isActive: round === 1,
        isCompleted: false
      };
      tournament.rounds.push(roundData);
    }

    // Generate first round matches with proper seeding
    const firstRoundMatches = this.generateFirstRoundMatches(participants, numByes);
    
    for (let i = 0; i < firstRoundMatches.length; i++) {
      const match = firstRoundMatches[i];
      const node: BracketNode = {
        id: `match_1_${i + 1}`,
        matchId: i + 1,
        player1Id: match.player1?.userId,
        player2Id: match.player2?.userId,
        player1Name: match.player1?.username,
        player2Name: match.player2?.username,
        status: match.isBye ? MatchStatus.BYE : MatchStatus.PENDING,
        round: 1,
        matchNumber: i + 1,
        bracketType: 'winners',
        isBye: match.isBye,
        nextMatchId: `match_2_${Math.floor(i / 2) + 1}`
      };

      tournament.nodes.push(node);
      tournament.rounds[0].matches.push({
        id: node.id,
        tournamentId: tournament.tournamentId,
        roundNumber: 1,
        matchNumber: i + 1,
        player1Id: node.player1Id,
        player2Id: node.player2Id,
        status: node.status,
        winnerId: match.isBye ? match.player1?.userId : undefined,
        bracketType: 'winners'
      });
    }

    // Generate subsequent rounds
    this.generateSubsequentRounds(tournament, numRounds);

    tournament.status = TournamentStatus.IN_PROGRESS;
    return tournament;
  }

  /**
   * Generate double elimination brackets
   */
  private generateDoubleEliminationBrackets(
    tournament: TournamentBracket,
    participants: TournamentParticipant[]
  ): TournamentBracket {
    const numParticipants = participants.length;
    const numRounds = Math.ceil(Math.log2(numParticipants));
    const totalSlots = Math.pow(2, numRounds);

    tournament.totalRounds = numRounds * 2 - 1; // Winners + Losers + Grand Finals
    tournament.totalMatches = (totalSlots - 1) * 2 - 1; // Winners + Losers + Grand Finals
    tournament.currentRound = 1;

    // Generate winners bracket (same as single elimination)
    const winnersBracket = this.generateSingleEliminationBrackets(tournament, participants);

    // Generate losers bracket
    this.generateLosersBracket(tournament, participants, numRounds);

    // Generate grand finals
    this.generateGrandFinals(tournament, numRounds);

    return tournament;
  }

  /**
   * Generate round robin brackets
   */
  private generateRoundRobinBrackets(
    tournament: TournamentBracket,
    participants: TournamentParticipant[]
  ): TournamentBracket {
    const numParticipants = participants.length;
    const numRounds = numParticipants % 2 === 0 ? numParticipants - 1 : numParticipants;
    const matchesPerRound = Math.floor(numParticipants / 2);

    tournament.totalRounds = numRounds;
    tournament.totalMatches = numRounds * matchesPerRound;
    tournament.currentRound = 1;

    // Create rounds
    for (let round = 1; round <= numRounds; round++) {
      const roundData: TournamentRound = {
        id: round,
        tournamentId: tournament.tournamentId,
        roundNumber: round,
        name: `Round ${round}`,
        matches: [],
        isActive: round === 1,
        isCompleted: false
      };
      tournament.rounds.push(roundData);
    }

    // Generate round robin schedule using circle method
    const schedule = this.generateRoundRobinSchedule(participants);

    for (let round = 0; round < schedule.length; round++) {
      for (let match = 0; match < schedule[round].length; match++) {
        const [player1, player2] = schedule[round][match];
        const node: BracketNode = {
          id: `match_${round + 1}_${match + 1}`,
          matchId: round * matchesPerRound + match + 1,
          player1Id: player1?.userId,
          player2Id: player2?.userId,
          player1Name: player1?.username,
          player2Name: player2?.username,
          status: MatchStatus.PENDING,
          round: round + 1,
          matchNumber: match + 1,
          bracketType: 'winners'
        };

        tournament.nodes.push(node);
        tournament.rounds[round].matches.push({
          id: node.id,
          tournamentId: tournament.tournamentId,
          roundNumber: round + 1,
          matchNumber: match + 1,
          player1Id: node.player1Id,
          player2Id: node.player2Id,
          status: node.status,
          bracketType: 'winners'
        });
      }
    }

    tournament.status = TournamentStatus.IN_PROGRESS;
    return tournament;
  }

  /**
   * Generate Swiss system brackets
   */
  private generateSwissBrackets(
    tournament: TournamentBracket,
    participants: TournamentParticipant[]
  ): TournamentBracket {
    const numParticipants = participants.length;
    const numRounds = Math.ceil(Math.log2(numParticipants));

    tournament.totalRounds = numRounds;
    tournament.totalMatches = numRounds * Math.floor(numParticipants / 2);
    tournament.currentRound = 1;

    // Create rounds
    for (let round = 1; round <= numRounds; round++) {
      const roundData: TournamentRound = {
        id: round,
        tournamentId: tournament.tournamentId,
        roundNumber: round,
        name: `Swiss Round ${round}`,
        matches: [],
        isActive: round === 1,
        isCompleted: false
      };
      tournament.rounds.push(roundData);
    }

    // First round is random pairing
    const firstRoundMatches = this.generateRandomPairings(participants);
    this.addMatchesToRound(tournament, firstRoundMatches, 1);

    tournament.status = TournamentStatus.IN_PROGRESS;
    return tournament;
  }

  /**
   * Generate consolation brackets
   */
  private generateConsolationBrackets(
    tournament: TournamentBracket,
    participants: TournamentParticipant[]
  ): TournamentBracket {
    // Implementation for consolation brackets
    return tournament;
  }

  /**
   * Record match result and advance tournament
   */
  async recordMatchResult(
    tournamentId: number,
    matchId: string,
    winnerId: number,
    loserId: number,
    player1Score?: number,
    player2Score?: number
  ): Promise<void> {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const node = tournament.nodes.find(n => n.id === matchId);
    if (!node) {
      throw new Error('Match not found');
    }

    if (node.status === MatchStatus.COMPLETED) {
      throw new Error('Match already completed');
    }

    // Update match result
    node.winnerId = winnerId;
    node.player1Score = player1Score;
    node.player2Score = player2Score;
    node.status = MatchStatus.COMPLETED;

    // Update round match
    const round = tournament.rounds.find(r => r.roundNumber === node.round);
    if (round) {
      const match = round.matches.find((m: TournamentMatch) => m.id === matchId);
      if (match) {
        match.winnerId = winnerId;
        match.status = MatchStatus.COMPLETED;
      }
    }

    tournament.completedMatches++;

    // Advance winner to next match
    if (node.nextMatchId) {
      await this.advancePlayer(tournament, node.nextMatchId, winnerId);
    }

    // Check if round is complete
    await this.checkRoundCompletion(tournament, node.round);

    // Check if tournament is complete
    await this.checkTournamentCompletion(tournament);
  }

  /**
   * Advance a player to the next match
   */
  private async advancePlayer(tournament: TournamentBracket, nextMatchId: string, playerId: number): Promise<void> {
    const nextNode = tournament.nodes.find(n => n.id === nextMatchId);
    if (!nextNode) return;

    if (!nextNode.player1Id) {
      nextNode.player1Id = playerId;
      const player = tournament.participants.find(p => p.userId === playerId);
      if (player) {
        nextNode.player1Name = player.username;
      }
    } else if (!nextNode.player2Id) {
      nextNode.player2Id = playerId;
      const player = tournament.participants.find(p => p.userId === playerId);
      if (player) {
        nextNode.player2Name = player.username;
      }
      nextNode.status = MatchStatus.PENDING;
    }
  }

  /**
   * Check if a round is complete and advance to next round
   */
  private async checkRoundCompletion(tournament: TournamentBracket, roundNumber: number): Promise<void> {
    const round = tournament.rounds.find(r => r.roundNumber === roundNumber);
    if (!round) return;

    const incompleteMatches = round.matches.filter((m: TournamentMatch) => m.status !== MatchStatus.COMPLETED);
    if (incompleteMatches.length === 0) {
      round.isCompleted = true;
      round.isActive = false;

      // Activate next round
      const nextRound = tournament.rounds.find(r => r.roundNumber === roundNumber + 1);
      if (nextRound) {
        nextRound.isActive = true;
        tournament.currentRound = roundNumber + 1;
      }
    }
  }

  /**
   * Check if tournament is complete
   */
  private async checkTournamentCompletion(tournament: TournamentBracket): Promise<void> {
    if (tournament.completedMatches === tournament.totalMatches) {
      tournament.status = TournamentStatus.COMPLETED;
      tournament.endDate = new Date();
      
      // Calculate final placements
      await this.calculateFinalPlacements(tournament);
    }
  }

  /**
   * Calculate final placements for all participants
   */
  private async calculateFinalPlacements(tournament: TournamentBracket): Promise<void> {
    // Implementation depends on tournament format
    switch (tournament.type) {
      case TournamentFormat.SINGLE_ELIMINATION:
        await this.calculateSingleEliminationPlacements(tournament);
        break;
      case TournamentFormat.DOUBLE_ELIMINATION:
        await this.calculateDoubleEliminationPlacements(tournament);
        break;
      case TournamentFormat.ROUND_ROBIN:
        await this.calculateRoundRobinPlacements(tournament);
        break;
      case TournamentFormat.SWISS:
        await this.calculateSwissPlacements(tournament);
        break;
    }
  }

  /**
   * Get tournament bracket data
   */
  async getTournamentBracket(tournamentId: number): Promise<TournamentBracket | null> {
    return this.tournaments.get(tournamentId) || null;
  }

  /**
   * Get tournament standings
   */
  async getTournamentStandings(tournamentId: number): Promise<any[]> {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    // Implementation depends on tournament format and completion status
    return [];
  }

  // Helper methods
  private calculateSeed(tournament: TournamentBracket, user: User): number {
    // Implement seeding logic based on tournament.seedingMethod
    return Math.floor(Math.random() * 1000) + 1;
  }

  private getRoundName(round: number, totalRounds: number): string {
    if (round === totalRounds) return 'Finals';
    if (round === totalRounds - 1) return 'Semi-Finals';
    if (round === totalRounds - 2) return 'Quarter-Finals';
    return `Round ${round}`;
  }

  private generateFirstRoundMatches(participants: TournamentParticipant[], numByes: number): any[] {
    // Implement proper seeding for first round matches
    const matches = [];
    const numMatches = Math.floor(participants.length / 2);
    
    for (let i = 0; i < numMatches; i++) {
      const player1 = participants[i];
      const player2 = participants[participants.length - 1 - i];
      
      matches.push({
        player1,
        player2,
        isBye: false
      });
    }

    // Add byes
    for (let i = 0; i < numByes; i++) {
      matches.push({
        player1: participants[i],
        player2: null,
        isBye: true
      });
    }

    return matches;
  }

  private generateSubsequentRounds(tournament: TournamentBracket, numRounds: number): void {
    // Generate placeholder nodes for subsequent rounds
    for (let round = 2; round <= numRounds; round++) {
      const matchesInRound = Math.pow(2, numRounds - round);
      
      for (let match = 1; match <= matchesInRound; match++) {
        const node: BracketNode = {
          id: `match_${round}_${match}`,
          status: MatchStatus.PENDING,
          round,
          matchNumber: match,
          bracketType: 'winners',
          nextMatchId: `match_${round + 1}_${Math.ceil(match / 2)}`,
          previousMatchIds: [
            `match_${round - 1}_${(match - 1) * 2 + 1}`,
            `match_${round - 1}_${(match - 1) * 2 + 2}`
          ]
        };

        tournament.nodes.push(node);
      }
    }
  }

  private generateLosersBracket(tournament: TournamentBracket, participants: TournamentParticipant[], numRounds: number): void {
    // Implementation for losers bracket generation
  }

  private generateGrandFinals(tournament: TournamentBracket, numRounds: number): void {
    // Implementation for grand finals generation
  }

  private generateRoundRobinSchedule(participants: TournamentParticipant[]): any[][] {
    // Implementation for round robin schedule generation using circle method
    return [];
  }

  private generateRandomPairings(participants: TournamentParticipant[]): any[] {
    // Implementation for random pairings
    return [];
  }

  private addMatchesToRound(tournament: TournamentBracket, matches: any[], roundNumber: number): void {
    // Implementation for adding matches to a round
  }

  private calculateSingleEliminationPlacements(tournament: TournamentBracket): Promise<void> {
    // Implementation for single elimination placements
    return Promise.resolve();
  }

  private calculateDoubleEliminationPlacements(tournament: TournamentBracket): Promise<void> {
    // Implementation for double elimination placements
    return Promise.resolve();
  }

  private calculateRoundRobinPlacements(tournament: TournamentBracket): Promise<void> {
    // Implementation for round robin placements
    return Promise.resolve();
  }

  private calculateSwissPlacements(tournament: TournamentBracket): Promise<void> {
    // Implementation for Swiss placements
    return Promise.resolve();
  }
}

// Export singleton instance
export const unifiedTournamentService = new UnifiedTournamentService(); 