import { Tournament, TournamentParticipant, TournamentMatch, TournamentFormat, TournamentStatus, MatchStatus } from '../../types/tournament';
import progressionService, { StoryEvent } from '../progression/ProgressionService';

export interface ProgressionResult {
  success: boolean;
  message: string;
  nextMatches?: TournamentMatch[];
  tournamentStatus?: TournamentStatus;
  winner?: TournamentParticipant;
  eliminated?: TournamentParticipant[];
  updatedMatches?: TournamentMatch[];
}

export interface BracketPosition {
  round: number;
  matchNumber: number;
  bracketType?: 'winners' | 'losers' | 'grand_final' | 'grand_final_reset';
}

export class TournamentProgressionService {
  private static instance: TournamentProgressionService;
  private progressionCallbacks: Map<string, (result: ProgressionResult) => void> = new Map();

  static getInstance(): TournamentProgressionService {
    if (!TournamentProgressionService.instance) {
      TournamentProgressionService.instance = new TournamentProgressionService();
    }
    return TournamentProgressionService.instance;
  }

  /**
   * Process match completion and advance winners
   */
  async processMatchCompletion(
    tournament: Tournament,
    participants: TournamentParticipant[],
    matches: TournamentMatch[],
    completedMatch: TournamentMatch,
    winnerId: number,
    loserId: number
  ): Promise<ProgressionResult> {
    try {
      console.log(`Processing match completion: ${completedMatch.id}, Winner: ${winnerId}, Loser: ${loserId}`);

      // Update the completed match
      const updatedMatch = { ...completedMatch, winnerId: winnerId, status: MatchStatus.COMPLETED };
      
      // Get winner and loser participants
      const winner = participants.find(p => p.id === winnerId);
      const loser = participants.find(p => p.id === loserId);

      if (!winner || !loser) {
        return {
          success: false,
          message: 'Winner or loser participant not found'
        };
      }

      // Handle progression based on tournament format
      let result: ProgressionResult;
      
      switch (tournament.format) {
        case TournamentFormat.SINGLE_ELIMINATION:
          result = await this.handleSingleEliminationProgression(tournament, participants, matches, updatedMatch, winner, loser);
          break;
        case TournamentFormat.DOUBLE_ELIMINATION:
          result = await this.handleDoubleEliminationProgression(tournament, participants, matches, updatedMatch, winner, loser);
          break;
        case TournamentFormat.ROUND_ROBIN:
          result = await this.handleRoundRobinProgression(tournament, participants, matches, updatedMatch, winner, loser);
          break;
        case TournamentFormat.SWISS:
          result = await this.handleSwissProgression(tournament, participants, matches, updatedMatch, winner, loser);
          break;
        default:
          return {
            success: false,
            message: `Unsupported tournament format: ${tournament.format}`
          };
      }

      // Notify subscribers
      this.notifyProgressionUpdate(tournament.id, result);
      
      return result;
    } catch (error) {
      console.error('Error processing match completion:', error);
      return {
        success: false,
        message: `Error processing match completion: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Handle single elimination tournament progression
   */
  private async handleSingleEliminationProgression(
    tournament: Tournament,
    participants: TournamentParticipant[],
    matches: TournamentMatch[],
    completedMatch: TournamentMatch,
    winner: TournamentParticipant,
    loser: TournamentParticipant
  ): Promise<ProgressionResult> {
    const nextPosition = this.calculateNextPosition(completedMatch, 'single_elimination');
    
    if (!nextPosition) {
      // Tournament is complete
      // Emit story event for tournament victory
      const event: StoryEvent = {
        id: `tournament-victory-${tournament.id}`,
        title: `Tournament Victory!`,
        description: `You won the "${tournament.name}" tournament and earned the "Tournament Champion" title.`,
        type: 'tournament',
        timestamp: new Date().toISOString(),
        isRead: false,
        impact: {
          experience: 500,
          reputation: 100
        }
      };
      progressionService.addEvent(event);
      return {
        success: true,
        message: 'Tournament completed!',
        tournamentStatus: TournamentStatus.COMPLETED,
        winner,
        eliminated: [loser],
        updatedMatches: [completedMatch]
      };
    }

    // Create or update next match
    const nextMatch = await this.createOrUpdateNextMatch(tournament, nextPosition, winner.id);
    
    return {
      success: true,
      message: `Winner ${winner.username} advanced to Round ${nextPosition.round}`,
      nextMatches: nextMatch ? [nextMatch] : [],
      eliminated: [loser],
      updatedMatches: [completedMatch]
    };
  }

  /**
   * Handle double elimination tournament progression
   */
  private async handleDoubleEliminationProgression(
    tournament: Tournament,
    participants: TournamentParticipant[],
    matches: TournamentMatch[],
    completedMatch: TournamentMatch,
    winner: TournamentParticipant,
    loser: TournamentParticipant
  ): Promise<ProgressionResult> {
    const bracketType = completedMatch.bracket_type || 'winners';
    const eliminated: TournamentParticipant[] = [];
    const nextMatches: TournamentMatch[] = [];

    if (bracketType === 'winners') {
      // Winner advances in winners bracket
      const nextWinnerPosition = this.calculateNextPosition(completedMatch, 'winners_bracket');
      if (nextWinnerPosition) {
        const nextWinnerMatch = await this.createOrUpdateNextMatch(tournament, nextWinnerPosition, winner.id);
        if (nextWinnerMatch) nextMatches.push(nextWinnerMatch);
      }

      // Loser drops to losers bracket
      const loserPosition = this.calculateLoserBracketPosition(completedMatch);
      if (loserPosition) {
        const loserMatch = await this.createOrUpdateNextMatch(tournament, loserPosition, loser.id);
        if (loserMatch) nextMatches.push(loserMatch);
      }
    } else if (bracketType === 'losers') {
      // Winner advances in losers bracket
      const nextLoserPosition = this.calculateNextPosition(completedMatch, 'losers_bracket');
      if (nextLoserPosition) {
        const nextLoserMatch = await this.createOrUpdateNextMatch(tournament, nextLoserPosition, winner.id);
        if (nextLoserMatch) nextMatches.push(nextLoserMatch);
      } else {
        // Loser bracket final completed - advance to grand final
        const grandFinalPosition = this.calculateGrandFinalPosition(tournament);
        if (grandFinalPosition) {
          const grandFinalMatch = await this.createOrUpdateNextMatch(tournament, grandFinalPosition, winner.id);
          if (grandFinalMatch) nextMatches.push(grandFinalMatch);
        }
      }

      // Loser is eliminated
      eliminated.push(loser);
    } else if (bracketType === 'grand_final') {
      // Check if this is the first or second grand final match
      const isFirstGrandFinal = !matches.some(m => 
        m.bracketType === 'grand_final' && m.status === MatchStatus.COMPLETED
      );

      if (isFirstGrandFinal) {
        // Loser gets another chance in grand final reset
        const resetPosition = this.calculateGrandFinalResetPosition(tournament);
        if (resetPosition) {
          const resetMatch = await this.createOrUpdateNextMatch(tournament, resetPosition, loser.id);
          if (resetMatch) nextMatches.push(resetMatch);
        }
      } else {
        // Tournament is complete
        // Emit story event for tournament victory
        const event: StoryEvent = {
          id: `tournament-victory-${tournament.id}`,
          title: `Tournament Victory!`,
          description: `You won the "${tournament.name}" tournament and earned the "Tournament Champion" title.`,
          type: 'tournament',
          timestamp: new Date().toISOString(),
          isRead: false,
          impact: {
            experience: 500,
            reputation: 100
          }
        };
        progressionService.addEvent(event);
        return {
          success: true,
          message: 'Tournament completed!',
          tournamentStatus: TournamentStatus.COMPLETED,
          winner,
          eliminated: [loser],
          updatedMatches: [completedMatch]
        };
      }
    }

    return {
      success: true,
      message: `Match completed. ${winner.username} advances, ${loser.username} ${eliminated.length > 0 ? 'eliminated' : 'drops to losers bracket'}`,
      nextMatches,
      eliminated,
      updatedMatches: [completedMatch]
    };
  }

  /**
   * Handle round robin tournament progression
   */
  private async handleRoundRobinProgression(
    tournament: Tournament,
    participants: TournamentParticipant[],
    matches: TournamentMatch[],
    completedMatch: TournamentMatch,
    winner: TournamentParticipant,
    loser: TournamentParticipant
  ): Promise<ProgressionResult> {
    // In round robin, no elimination - just track results
    const allMatches = matches.filter(m => m.status === 'completed');
    const totalMatches = matches.length;
    
    if (allMatches.length === totalMatches) {
      // All matches completed, determine winner by points
      const winner = this.determineRoundRobinWinner(tournament, participants);
      return {
        success: true,
        message: 'Round robin tournament completed!',
        tournamentStatus: TournamentStatus.COMPLETED,
        winner,
        updatedMatches: [completedMatch]
      };
    }

    return {
      success: true,
      message: 'Match completed, continuing round robin',
      updatedMatches: [completedMatch]
    };
  }

  /**
   * Handle Swiss tournament progression
   */
  private async handleSwissProgression(
    tournament: Tournament,
    participants: TournamentParticipant[],
    matches: TournamentMatch[],
    completedMatch: TournamentMatch,
    winner: TournamentParticipant,
    loser: TournamentParticipant
  ): Promise<ProgressionResult> {
    // Swiss system - pair players for next round based on current standings
    const nextRound = completedMatch.round + 1;
    const maxRounds = Math.ceil(Math.log2(participants.length));
    
    if (nextRound > maxRounds) {
      // Tournament complete
      const winner = this.determineSwissWinner(tournament, participants);
      return {
        success: true,
        message: 'Swiss tournament completed!',
        tournamentStatus: TournamentStatus.COMPLETED,
        winner,
        updatedMatches: [completedMatch]
      };
    }

    // Generate next round pairings
    const nextMatches = await this.generateSwissPairings(tournament, nextRound, participants);
    
    return {
      success: true,
      message: `Round ${completedMatch.round} completed, generating round ${nextRound} pairings`,
      nextMatches,
      updatedMatches: [completedMatch]
    };
  }

  /**
   * Calculate next position for winner advancement
   */
  private calculateNextPosition(match: TournamentMatch, format: string): BracketPosition | null {
    const currentRound = match.round;
    const currentMatchNumber = match.match_number;
    
    switch (format) {
      case 'single_elimination':
        const nextRound = currentRound + 1;
        const nextMatchNumber = Math.ceil(currentMatchNumber / 2);
        return { round: nextRound, matchNumber: nextMatchNumber };
      
      case 'winners_bracket':
        const wbNextRound = currentRound + 1;
        const wbNextMatchNumber = Math.ceil(currentMatchNumber / 2);
        return { round: wbNextRound, matchNumber: wbNextMatchNumber, bracketType: 'winners' };
      
      case 'losers_bracket':
        const lbNextRound = currentRound + 1;
        const lbNextMatchNumber = Math.ceil(currentMatchNumber / 2);
        return { round: lbNextRound, matchNumber: lbNextMatchNumber, bracketType: 'losers' };
      
      default:
        return null;
    }
  }

  /**
   * Calculate loser bracket position for dropped players
   */
  private calculateLoserBracketPosition(match: TournamentMatch): BracketPosition | null {
    // Calculate where the loser should be placed in the losers bracket
    const currentRound = match.round;
    const currentMatchNumber = match.match_number;
    
    // This is a simplified calculation - in practice, this would be more complex
    const lbRound = currentRound;
    const lbMatchNumber = currentMatchNumber;
    
    return { round: lbRound, matchNumber: lbMatchNumber, bracketType: 'losers' };
  }

  /**
   * Calculate grand final position
   */
  private calculateGrandFinalPosition(tournament: Tournament): BracketPosition | null {
    const maxRound = Math.max(...tournament.matches.map(m => m.round));
    return { round: maxRound + 1, matchNumber: 1, bracketType: 'grand_final' };
  }

  /**
   * Calculate grand final reset position
   */
  private calculateGrandFinalResetPosition(tournament: Tournament): BracketPosition | null {
    const maxRound = Math.max(...tournament.matches.map(m => m.round));
    return { round: maxRound + 1, matchNumber: 1, bracketType: 'grand_final_reset' };
  }

  /**
   * Create or update next match
   */
  private async createOrUpdateNextMatch(
    tournament: Tournament,
    position: BracketPosition,
    playerId: string
  ): Promise<TournamentMatch | null> {
    // Find existing match at this position
    const nextMatch = tournament.matches.find(m => 
      m.round === position.round && 
      m.match_number === position.matchNumber &&
      m.bracket_type === position.bracketType
    );

    if (nextMatch) {
      // Update existing match
      if (!nextMatch.player1_id) {
        nextMatch.player1_id = playerId;
      } else if (!nextMatch.player2_id) {
        nextMatch.player2_id = playerId;
        nextMatch.status = 'scheduled';
      }
      return nextMatch;
    } else {
      // Create new match
      const newMatch: TournamentMatch = {
        id: `match_${Date.now()}`,
        tournament_id: tournament.id,
        round: position.round,
        match_number: position.matchNumber,
        bracket_type: position.bracketType,
        player1_id: playerId,
        player2_id: null,
        status: 'waiting',
        winner_id: null,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // In a real implementation, this would be saved to the database
      return newMatch;
    }
  }

  /**
   * Determine round robin winner
   */
  private determineRoundRobinWinner(tournament: Tournament, participants: TournamentParticipant[]): TournamentParticipant | null {
    // Calculate points for each participant
    const participantPoints = new Map<string, number>();
    
    participants.forEach(participant => {
      participantPoints.set(participant.id, 0);
    });

    tournament.matches.forEach(match => {
      if (match.status === 'completed' && match.winner_id) {
        const currentPoints = participantPoints.get(match.winner_id) || 0;
        participantPoints.set(match.winner_id, currentPoints + 1);
      }
    });

    // Find participant with highest points
    let winner: TournamentParticipant | null = null;
    let maxPoints = 0;

    participantPoints.forEach((points, participantId) => {
      if (points > maxPoints) {
        maxPoints = points;
        winner = participants.find(p => p.id === participantId) || null;
      }
    });

    return winner;
  }

  /**
   * Determine Swiss winner
   */
  private determineSwissWinner(tournament: Tournament, participants: TournamentParticipant[]): TournamentParticipant | null {
    // Similar to round robin but with tiebreakers
    return this.determineRoundRobinWinner(tournament, participants);
  }

  /**
   * Generate Swiss pairings for next round
   */
  private async generateSwissPairings(tournament: Tournament, round: number, participants: TournamentParticipant[]): Promise<TournamentMatch[]> {
    // Calculate current standings
    const standings = this.calculateSwissStandings(tournament, participants);
    
    // Generate pairings (simplified - in practice this would be more complex)
    const matches: TournamentMatch[] = [];
    
    for (let i = 0; i < standings.length; i += 2) {
      if (i + 1 < standings.length) {
        const match: TournamentMatch = {
          id: `match_${Date.now()}_${i}`,
          tournament_id: tournament.id,
          round,
          match_number: Math.floor(i / 2) + 1,
          bracket_type: 'swiss',
          player1_id: standings[i].id,
          player2_id: standings[i + 1].id,
          status: 'scheduled',
          winner_id: null,
          created_at: new Date(),
          updated_at: new Date()
        };
        matches.push(match);
      }
    }

    return matches;
  }

  /**
   * Calculate Swiss standings
   */
  private calculateSwissStandings(tournament: Tournament, participants: TournamentParticipant[]): TournamentParticipant[] {
    // Calculate points for each participant
    const participantPoints = new Map<string, number>();
    
    participants.forEach(participant => {
      participantPoints.set(participant.id, 0);
    });

    tournament.matches.forEach(match => {
      if (match.status === 'completed' && match.winner_id) {
        const currentPoints = participantPoints.get(match.winner_id) || 0;
        participantPoints.set(match.winner_id, currentPoints + 1);
      }
    });

    // Sort participants by points
    return participants
      .map(participant => ({
        ...participant,
        points: participantPoints.get(participant.id) || 0
      }))
      .sort((a, b) => (b.points || 0) - (a.points || 0));
  }

  /**
   * Subscribe to progression updates
   */
  subscribeToProgression(tournamentId: string, callback: (result: ProgressionResult) => void): string {
    const subscriptionId = `progression_${tournamentId}_${Date.now()}`;
    this.progressionCallbacks.set(subscriptionId, callback);
    return subscriptionId;
  }

  /**
   * Unsubscribe from progression updates
   */
  unsubscribeFromProgression(subscriptionId: string): void {
    this.progressionCallbacks.delete(subscriptionId);
  }

  /**
   * Notify subscribers of progression updates
   */
  private notifyProgressionUpdate(tournamentId: string, result: ProgressionResult): void {
    this.progressionCallbacks.forEach((callback, subscriptionId) => {
      if (subscriptionId.includes(tournamentId)) {
        callback(result);
      }
    });
  }

  /**
   * Get tournament progression status
   */
  getTournamentProgressionStatus(tournament: Tournament): {
    completedMatches: number;
    totalMatches: number;
    currentRound: number;
    maxRounds: number;
    remainingParticipants: number;
    isComplete: boolean;
  } {
    const completedMatches = tournament.matches.filter(m => m.status === 'completed').length;
    const totalMatches = tournament.matches.length;
    const currentRound = Math.max(...tournament.matches.map(m => m.round));
    const maxRounds = this.calculateMaxRounds(tournament);
    const remainingParticipants = tournament.participants.filter(p => p.status !== 'eliminated').length;
    const isComplete = tournament.status === TournamentStatus.COMPLETED;

    return {
      completedMatches,
      totalMatches,
      currentRound,
      maxRounds,
      remainingParticipants,
      isComplete
    };
  }

  /**
   * Calculate maximum rounds for tournament
   */
  private calculateMaxRounds(tournament: Tournament): number {
    const participantCount = tournament.participants.length;
    
    switch (tournament.format) {
      case TournamentFormat.SINGLE_ELIMINATION:
        return Math.ceil(Math.log2(participantCount));
      case TournamentFormat.DOUBLE_ELIMINATION:
        return Math.ceil(Math.log2(participantCount)) * 2 + 1; // +1 for grand final
      case TournamentFormat.ROUND_ROBIN:
        return participantCount - 1;
      case TournamentFormat.SWISS:
        return Math.ceil(Math.log2(participantCount));
      default:
        return 1;
    }
  }
} 