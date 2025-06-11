import { EventEmitter } from 'events';

interface Player {
  id: string;
  name: string;
}

interface Match {
  id: string;
  player1: Player;
  player2: Player;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  score?: string;
  winner?: string;
}

interface TournamentData {
  id: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  matches: Match[];
}

interface TournamentUpdate {
  matchId: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  score?: string;
  timestamp: number;
}

interface TournamentEvents {
  matchUpdate: { matchId: string; update: TournamentUpdate };
  tournamentUpdate: TournamentData;
  tournamentEnd: { winner: string; finalScore: string };
}

export class TournamentService extends EventEmitter {
  private tournament: TournamentData;
  private version: number;

  constructor() {
    super();
    this.tournament = {
      id: '',
      status: 'scheduled',
      matches: [],
    };
    this.version = 0;
  }

  async processBatchUpdates(updates: TournamentUpdate[]): Promise<boolean> {
    for (const update of updates) {
      const match = this.tournament.matches.find(m => m.id === update.matchId);
      if (match) {
        match.status = update.status;
        if (update.score) {
          match.score = update.score;
        }
        this.emit('matchUpdate', { matchId: update.matchId, update });
      }
    }
    this.version++;
    this.emit('tournamentUpdate', this.tournament);
    return true;
  }

  async batchUpdateMatches(updates: TournamentUpdate[]): Promise<boolean> {
    return this.processBatchUpdates(updates);
  }

  async processTournamentData(data: TournamentData): Promise<boolean> {
    this.tournament = data;
    this.version++;
    this.emit('tournamentUpdate', this.tournament);
    return true;
  }

  async updateMatch(matchId: string, update: Partial<Match>): Promise<boolean> {
    const match = this.tournament.matches.find(m => m.id === matchId);
    if (!match) return false;

    Object.assign(match, update);
    this.version++;

    const tournamentUpdate: TournamentUpdate = {
      matchId,
      status: match.status,
      score: match.score,
      timestamp: Date.now(),
    };

    this.emit('matchUpdate', { matchId, update: tournamentUpdate });
    this.emit('tournamentUpdate', this.tournament);

    if (this.tournament.matches.every(m => m.status === 'completed')) {
      const winner = this.determineWinner();
      if (winner) {
        this.emit('tournamentEnd', { winner: winner.id, finalScore: winner.score || '0-0' });
      }
    }

    return true;
  }

  private determineWinner(): Match | null {
    const completedMatches = this.tournament.matches.filter(m => m.status === 'completed');
    if (completedMatches.length === 0) return null;

    // Simple winner determination based on most wins
    const playerWins = new Map<string, number>();
    for (const match of completedMatches) {
      if (match.winner) {
        playerWins.set(match.winner, (playerWins.get(match.winner) || 0) + 1);
      }
    }

    let maxWins = 0;
    let winner: Match | null = null;

    for (const [playerId, wins] of playerWins.entries()) {
      if (wins > maxWins) {
        maxWins = wins;
        winner = completedMatches.find(m => m.winner === playerId) || null;
      }
    }

    return winner;
  }

  // Type-safe event emitter methods
  on<K extends keyof TournamentEvents>(event: K, listener: (arg: TournamentEvents[K]) => void): this {
    return super.on(event, listener);
  }

  emit<K extends keyof TournamentEvents>(event: K, arg: TournamentEvents[K]): boolean {
    return super.emit(event, arg);
  }

  off<K extends keyof TournamentEvents>(event: K, listener: (arg: TournamentEvents[K]) => void): this {
    return super.off(event, listener);
  }
} 