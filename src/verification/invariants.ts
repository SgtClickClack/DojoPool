import { type GameState, Game, Table, Player } from '../types/game';

export interface InvariantResult {
  name: string;
  valid: boolean;
  details?: string;
  timestamp: number;
}

export class StateInvariantChecker {
  private invariants: Map<string, (state: GameState) => InvariantResult>;

  constructor() {
    this.invariants = new Map();
    this.setupInvariants();
  }

  private setupInvariants(): void {
    // Table state invariants
    this.invariants.set('table-player-consistency', (state: GameState) => {
      for (const table of state.tables) {
        const tablePlayers = new Set(table.players);
        for (const playerId of tablePlayers) {
          if (!state.players.some((p) => p.id === playerId)) {
            return {
              name: 'table-player-consistency',
              valid: false,
              details: `Table ${table.id} references non-existent player ${playerId}`,
              timestamp: Date.now(),
            };
          }
        }
      }
      return {
        name: 'table-player-consistency',
        valid: true,
        timestamp: Date.now(),
      };
    });

    // Game state invariants
    this.invariants.set('game-turn-validity', (state: GameState) => {
      for (const table of state.tables) {
        if (table.currentGame) {
          const game = table.currentGame;
          if (game.status === 'active') {
            if (!game.players.includes(game.currentTurn)) {
              return {
                name: 'game-turn-validity',
                valid: false,
                details: `Game in table ${table.id} has invalid current turn player`,
                timestamp: Date.now(),
              };
            }
          }
        }
      }
      return {
        name: 'game-turn-validity',
        valid: true,
        timestamp: Date.now(),
      };
    });

    // Player state invariants
    this.invariants.set('player-score-validity', (state: GameState) => {
      for (const player of state.players) {
        if (player.score < 0) {
          return {
            name: 'player-score-validity',
            valid: false,
            details: `Player ${player.id} has invalid negative score`,
            timestamp: Date.now(),
          };
        }
      }
      return {
        name: 'player-score-validity',
        valid: true,
        timestamp: Date.now(),
      };
    });

    // Game phase consistency
    this.invariants.set('game-phase-consistency', (state: GameState) => {
      const validPhases = ['setup', 'active', 'finished'];
      if (!validPhases.includes(state.gamePhase)) {
        return {
          name: 'game-phase-consistency',
          valid: false,
          details: `Invalid game phase: ${state.gamePhase}`,
          timestamp: Date.now(),
        };
      }
      return {
        name: 'game-phase-consistency',
        valid: true,
        timestamp: Date.now(),
      };
    });

    // Table status consistency
    this.invariants.set('table-status-consistency', (state: GameState) => {
      for (const table of state.tables) {
        if (table.status === 'active' && !table.currentGame) {
          return {
            name: 'table-status-consistency',
            valid: false,
            details: `Table ${table.id} is active but has no current game`,
            timestamp: Date.now(),
          };
        }
      }
      return {
        name: 'table-status-consistency',
        valid: true,
        timestamp: Date.now(),
      };
    });
  }

  public checkAll(state: GameState): InvariantResult[] {
    return Array.from(this.invariants.values()).map((check) => check(state));
  }

  public check(
    state: GameState,
    invariantName: string
  ): InvariantResult | null {
    const checker = this.invariants.get(invariantName);
    if (!checker) {
      return null;
    }
    return checker(state);
  }

  public addInvariant(
    name: string,
    checker: (state: GameState) => InvariantResult
  ): void {
    this.invariants.set(name, checker);
  }

  public removeInvariant(name: string): boolean {
    return this.invariants.delete(name);
  }

  public getInvariantNames(): string[] {
    return Array.from(this.invariants.keys());
  }
}
