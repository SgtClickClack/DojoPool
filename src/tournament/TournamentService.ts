import {
  Tournament,
  TournamentPlayer,
  TournamentConfig,
  MatchResult,
  TournamentFormat,
} from "./types";
import { TournamentFactory } from "./TournamentFactory";

interface TournamentData {
  id: string;
  tournament: Tournament;
  config: TournamentConfig;
  players: TournamentPlayer[];
  createdAt: Date;
  updatedAt: Date;
}

export class TournamentService {
  private tournaments: Map<string, TournamentData>;

  constructor() {
    this.tournaments = new Map();
  }

  createTournament(
    format: TournamentFormat,
    players: TournamentPlayer[],
    config: TournamentConfig,
  ): string {
    const id = this.generateTournamentId();
    const tournament = TournamentFactory.createTournament(
      format,
      players,
      config,
    );

    this.tournaments.set(id, {
      id,
      tournament,
      config,
      players,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return id;
  }

  getTournament(id: string): Tournament {
    const data = this.tournaments.get(id);
    if (!data) {
      throw new Error(`Tournament not found: ${id}`);
    }
    return data.tournament;
  }

  getTournamentConfig(id: string): TournamentConfig {
    const data = this.tournaments.get(id);
    if (!data) {
      throw new Error(`Tournament not found: ${id}`);
    }
    return data.config;
  }

  getTournamentPlayers(id: string): TournamentPlayer[] {
    const data = this.tournaments.get(id);
    if (!data) {
      throw new Error(`Tournament not found: ${id}`);
    }
    return data.players;
  }

  submitMatchResult(
    tournamentId: string,
    matchId: string,
    result: MatchResult,
  ): void {
    const tournament = this.getTournament(tournamentId);
    tournament.submitMatchResult(matchId, result);

    const data = this.tournaments.get(tournamentId);
    if (data) {
      data.updatedAt = new Date();
    }
  }

  getCurrentRoundMatches(tournamentId: string) {
    const tournament = this.getTournament(tournamentId);
    return tournament.getCurrentRoundMatches();
  }

  getStandings(tournamentId: string) {
    const tournament = this.getTournament(tournamentId);
    return tournament.getStandings();
  }

  getTournamentState(tournamentId: string) {
    const tournament = this.getTournament(tournamentId);
    return tournament.getTournamentState();
  }

  listTournaments(): TournamentData[] {
    return Array.from(this.tournaments.values());
  }

  private generateTournamentId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
