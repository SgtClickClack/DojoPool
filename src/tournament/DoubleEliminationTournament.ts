import { v4 as uuidv4 } from 'uuid';
import {
  type Tournament,
  type TournamentPlayer,
  type Match,
  type MatchResult,
  type TournamentState,
  type TournamentConfig,
} from './types';

interface DoubleEliminationBracket {
  winnersRounds: Match[][];
  losersRounds: Match[][];
  grandFinals: Match | null;
  grandFinalsRematch: Match | null;
}

export class DoubleEliminationTournament implements Tournament {
  private players: TournamentPlayer[];
  private bracket: DoubleEliminationBracket;
  private currentRound: number;
  private config: TournamentConfig;

  constructor(players: TournamentPlayer[], config: TournamentConfig) {
    if (
      players.length < config.minPlayers ||
      players.length > config.maxPlayers
    ) {
      throw new Error(
        `Tournament requires between ${config.minPlayers} and ${config.maxPlayers} players`
      );
    }

    this.players = players;
    this.config = config;
    this.currentRound = 1;
    this.bracket = this.initializeBracket(players);
  }

  private initializeBracket(
    players: TournamentPlayer[]
  ): DoubleEliminationBracket {
    const seededPlayers = this.seedPlayers(players);
    const winnersRounds: Match[][] = [];
    const losersRounds: Match[][] = [];

    // Create first round matches
    const firstRoundMatches: Match[] = [];
    for (let i = 0; i < seededPlayers.length; i += 2) {
      firstRoundMatches.push({
        id: uuidv4(),
        round: 1,
        player1: seededPlayers[i],
        player2: i + 1 < seededPlayers.length ? seededPlayers[i + 1] : null,
        winner: null,
        loser: null,
        status: 'pending',
      });
    }
    winnersRounds.push(firstRoundMatches);

    return {
      winnersRounds,
      losersRounds,
      grandFinals: null,
      grandFinalsRematch: null,
    };
  }

  private seedPlayers(players: TournamentPlayer[]): TournamentPlayer[] {
    // Sort players by rating if available
    return [...players].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  getCurrentRoundMatches(): Match[] {
    const currentMatches: Match[] = [];

    // Check winners bracket
    if (this.bracket.winnersRounds[this.currentRound - 1]) {
      currentMatches.push(...this.bracket.winnersRounds[this.currentRound - 1]);
    }

    // Check losers bracket
    if (this.bracket.losersRounds[this.currentRound - 1]) {
      currentMatches.push(...this.bracket.losersRounds[this.currentRound - 1]);
    }

    // Check grand finals
    if (this.bracket.grandFinals && !this.bracket.grandFinals.winner) {
      currentMatches.push(this.bracket.grandFinals);
    }

    // Check grand finals rematch
    if (
      this.bracket.grandFinalsRematch &&
      !this.bracket.grandFinalsRematch.winner
    ) {
      currentMatches.push(this.bracket.grandFinalsRematch);
    }

    return currentMatches.filter((match) => match.status !== 'complete');
  }

  submitMatchResult(matchId: string, result: MatchResult): void {
    const match = this.findMatch(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    if (match.status === 'complete') {
      throw new Error('Match already completed');
    }

    // Update match result
    match.winner = result.winner;
    match.loser = result.loser;
    match.status = 'complete';
    match.stats = result.stats;

    // Update player stats
    this.updatePlayerStats(result);

    // Advance brackets
    this.advanceBrackets();
  }

  private findMatch(matchId: string): Match | null {
    // Search in winners bracket
    for (const round of this.bracket.winnersRounds) {
      const match = round.find((m) => m.id === matchId);
      if (match) return match;
    }

    // Search in losers bracket
    for (const round of this.bracket.losersRounds) {
      const match = round.find((m) => m.id === matchId);
      if (match) return match;
    }

    // Check grand finals
    if (this.bracket.grandFinals?.id === matchId) {
      return this.bracket.grandFinals;
    }

    // Check grand finals rematch
    if (this.bracket.grandFinalsRematch?.id === matchId) {
      return this.bracket.grandFinalsRematch;
    }

    return null;
  }

  private updatePlayerStats(result: MatchResult): void {
    const winner = this.players.find((p) => p.id === result.winner.id);
    const loser = this.players.find((p) => p.id === result.loser.id);

    if (winner) {
      winner.stats.wins++;
    }
    if (loser) {
      loser.stats.losses++;
    }
  }

  private advanceBrackets(): void {
    const currentMatches = this.getCurrentRoundMatches();

    // If all matches in current round are complete, create next round
    if (currentMatches.length === 0) {
      this.createNextRound();
    }
  }

  private createNextRound(): void {
    // Logic to create next round matches based on current round results
    // This would include creating winners and losers bracket matches
    // And potentially setting up grand finals
    // Implementation details would depend on specific tournament format requirements
  }

  getStandings(): TournamentPlayer[] {
    return [...this.players].sort((a, b) => {
      // Sort by wins first
      if (b.stats.wins !== a.stats.wins) {
        return b.stats.wins - a.stats.wins;
      }
      // Then by losses (fewer losses is better)
      return a.stats.losses - b.stats.losses;
    });
  }

  getTournamentState(): TournamentState {
    return {
      currentRound: this.currentRound,
      isComplete: this.isComplete(),
      bracket: this.bracket,
      standings: this.getStandings(),
    };
  }

  private isComplete(): boolean {
    // Tournament is complete when grand finals (and potential rematch) are done
    if (!this.bracket.grandFinals) return false;
    if (this.bracket.grandFinals.status !== 'complete') return false;
    if (
      this.bracket.grandFinalsRematch &&
      this.bracket.grandFinalsRematch.status !== 'complete'
    )
      return false;
    return true;
  }
}
