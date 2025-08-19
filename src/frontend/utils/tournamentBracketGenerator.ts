import {
  Tournament,
  TournamentFormat,
  TournamentMatch,
  TournamentPlayer,
  TournamentRound,
} from '../types/tournament';

export interface BracketGenerationOptions {
  seedPlayers?: boolean;
  randomizeSeeds?: boolean;
  groupSize?: number;
}

export class TournamentBracketGenerator {
  /**
   * Generate tournament brackets based on format and players
   */
  static generateBracket(
    tournament: Tournament,
    players: TournamentPlayer[],
    options: BracketGenerationOptions = {}
  ): Tournament {
    const { format } = tournament;

    switch (format) {
      case TournamentFormat.SINGLE_ELIMINATION:
        return this.generateSingleElimination(tournament, players, options);
      case TournamentFormat.DOUBLE_ELIMINATION:
        return this.generateDoubleElimination(tournament, players, options);
      case TournamentFormat.ROUND_ROBIN:
        return this.generateRoundRobin(tournament, players, options);
      case TournamentFormat.SWISS:
        return this.generateSwissSystem(tournament, players, options);
      default:
        throw new Error(`Unsupported tournament format: ${format}`);
    }
  }

  /**
   * Generate single elimination bracket
   */
  private static generateSingleElimination(
    tournament: Tournament,
    players: TournamentPlayer[],
    options: BracketGenerationOptions
  ): Tournament {
    const seededPlayers = this.seedPlayers(players, options);
    const rounds = this.createSingleEliminationRounds(seededPlayers);

    return {
      ...tournament,
      players: seededPlayers,
      rounds,
      status: tournament.status,
    };
  }

  /**
   * Generate double elimination bracket
   */
  private static generateDoubleElimination(
    tournament: Tournament,
    players: TournamentPlayer[],
    options: BracketGenerationOptions
  ): Tournament {
    const seededPlayers = this.seedPlayers(players, options);
    const winnerRounds = this.createSingleEliminationRounds(seededPlayers);
    const loserRounds = this.createLoserBracketRounds(seededPlayers);

    return {
      ...tournament,
      players: seededPlayers,
      rounds: winnerRounds,
      loserRounds,
      status: tournament.status,
    };
  }

  /**
   * Generate round robin tournament
   */
  private static generateRoundRobin(
    tournament: Tournament,
    players: TournamentPlayer[],
    options: BracketGenerationOptions
  ): Tournament {
    const seededPlayers = this.seedPlayers(players, options);
    const groupMatches = this.createRoundRobinMatches(seededPlayers);

    return {
      ...tournament,
      players: seededPlayers,
      groupMatches,
      status: tournament.status,
    };
  }

  /**
   * Generate Swiss system tournament
   */
  private static generateSwissSystem(
    tournament: Tournament,
    players: TournamentPlayer[],
    options: BracketGenerationOptions
  ): Tournament {
    const seededPlayers = this.seedPlayers(players, options);
    const swissRounds = this.createSwissRounds(seededPlayers);

    return {
      ...tournament,
      players: seededPlayers,
      swissRounds,
      status: tournament.status,
    };
  }

  /**
   * Seed players based on ranking or random assignment
   */
  private static seedPlayers(
    players: TournamentPlayer[],
    options: BracketGenerationOptions
  ): TournamentPlayer[] {
    let seededPlayers = [...players];

    if (options.seedPlayers) {
      // Sort by rank, then by wins, then by losses
      seededPlayers.sort((a, b) => {
        if (a.rank !== b.rank) return a.rank - b.rank;
        if ((a.wins || 0) !== (b.wins || 0))
          return (b.wins || 0) - (a.wins || 0);
        return (a.losses || 0) - (b.losses || 0);
      });
    }

    if (options.randomizeSeeds) {
      // Fisher-Yates shuffle
      for (let i = seededPlayers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [seededPlayers[i], seededPlayers[j]] = [
          seededPlayers[j],
          seededPlayers[i],
        ];
      }
    }

    return seededPlayers;
  }

  /**
   * Create single elimination rounds
   */
  private static createSingleEliminationRounds(
    players: TournamentPlayer[]
  ): TournamentRound[] {
    const rounds: TournamentRound[] = [];
    let currentPlayers = [...players];
    let roundNumber = 1;

    while (currentPlayers.length > 1) {
      const matches: TournamentMatch[] = [];

      // Create matches for current round
      for (let i = 0; i < currentPlayers.length; i += 2) {
        if (i + 1 < currentPlayers.length) {
          matches.push({
            id: `round-${roundNumber}-match-${matches.length + 1}`,
            roundNumber,
            matchNumber: matches.length + 1,
            player1Id: currentPlayers[i].id,
            player2Id: currentPlayers[i + 1].id,
            status: 'PENDING',
            startTime: undefined,
            endTime: undefined,
          });
        } else {
          // Bye - player advances automatically
          currentPlayers[i].wins = (currentPlayers[i].wins || 0) + 1;
        }
      }

      rounds.push({
        roundNumber,
        matches,
        status: 'PENDING',
        startTime: undefined,
        endTime: undefined,
      });

      // Prepare for next round (winners advance)
      currentPlayers = currentPlayers.filter((_, index) => index % 2 === 0);
      roundNumber++;
    }

    return rounds;
  }

  /**
   * Create loser bracket rounds for double elimination
   */
  private static createLoserBracketRounds(
    players: TournamentPlayer[]
  ): TournamentRound[] {
    const rounds: TournamentRound[] = [];
    const numRounds = Math.ceil(Math.log2(players.length)) * 2 - 1;

    for (let round = 1; round <= numRounds; round++) {
      const matches: TournamentMatch[] = [];
      const matchesInRound = Math.max(
        1,
        Math.floor(players.length / Math.pow(2, round))
      );

      for (let match = 1; match <= matchesInRound; match++) {
        matches.push({
          id: `loser-round-${round}-match-${match}`,
          roundNumber: round,
          matchNumber: match,
          status: 'PENDING',
          startTime: undefined,
          endTime: undefined,
        });
      }

      rounds.push({
        roundNumber: round,
        matches,
        status: 'PENDING',
        startTime: undefined,
        endTime: undefined,
      });
    }

    return rounds;
  }

  /**
   * Create round robin matches
   */
  private static createRoundRobinMatches(
    players: TournamentPlayer[]
  ): TournamentMatch[] {
    const matches: TournamentMatch[] = [];
    let matchNumber = 1;

    // Round robin: each player plays every other player once
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        matches.push({
          id: `rr-match-${matchNumber}`,
          roundNumber: 1,
          matchNumber: matchNumber++,
          player1Id: players[i].id,
          player2Id: players[j].id,
          status: 'PENDING',
          startTime: undefined,
          endTime: undefined,
        });
      }
    }

    return matches;
  }

  /**
   * Create Swiss system rounds
   */
  private static createSwissRounds(
    players: TournamentPlayer[]
  ): TournamentRound[] {
    const rounds: TournamentRound[] = [];
    const numRounds = Math.ceil(Math.log2(players.length));

    for (let round = 1; round <= numRounds; round++) {
      const matches: TournamentMatch[] = [];
      const matchesInRound = Math.floor(players.length / 2);

      for (let match = 1; match <= matchesInRound; match++) {
        matches.push({
          id: `swiss-round-${round}-match-${match}`,
          roundNumber: round,
          matchNumber: match,
          status: 'PENDING',
          startTime: undefined,
          endTime: undefined,
        });
      }

      rounds.push({
        roundNumber: round,
        matches,
        status: 'PENDING',
        startTime: undefined,
        endTime: undefined,
      });
    }

    return rounds;
  }

  /**
   * Calculate number of rounds needed for a tournament
   */
  static calculateRounds(
    format: TournamentFormat,
    playerCount: number
  ): number {
    switch (format) {
      case TournamentFormat.SINGLE_ELIMINATION:
        return Math.ceil(Math.log2(playerCount));
      case TournamentFormat.DOUBLE_ELIMINATION:
        return Math.ceil(Math.log2(playerCount)) * 2 - 1;
      case TournamentFormat.ROUND_ROBIN:
        return 1; // All matches in one round
      case TournamentFormat.SWISS:
        return Math.ceil(Math.log2(playerCount));
      default:
        return 0;
    }
  }

  /**
   * Calculate total matches for a tournament
   */
  static calculateTotalMatches(
    format: TournamentFormat,
    playerCount: number
  ): number {
    switch (format) {
      case TournamentFormat.SINGLE_ELIMINATION:
        return playerCount - 1;
      case TournamentFormat.DOUBLE_ELIMINATION:
        return (playerCount - 1) * 2;
      case TournamentFormat.ROUND_ROBIN:
        return (playerCount * (playerCount - 1)) / 2;
      case TournamentFormat.SWISS:
        return Math.floor(playerCount / 2) * Math.ceil(Math.log2(playerCount));
      default:
        return 0;
    }
  }
}
