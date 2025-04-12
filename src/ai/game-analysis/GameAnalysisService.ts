import { GameState, PlayerStats, MatchStats, GameEvent } from '../types/game';

export class GameAnalysisService {
  private gameState: GameState;
  private playerStats: Map<string, PlayerStats>;
  private matchStats: MatchStats;
  private eventHistory: GameEvent[];

  constructor() {
    this.gameState = {
      currentPlayer: '',
      score: { player1: 0, player2: 0 },
      turn: 0,
      status: 'waiting'
    };
    this.playerStats = new Map();
    this.matchStats = {
      totalShots: 0,
      successfulShots: 0,
      averageShotTime: 0,
      longestStreak: 0,
      currentStreak: 0
    };
    this.eventHistory = [];
  }

  public initializeGame(player1Id: string, player2Id: string): void {
    this.playerStats.set(player1Id, this.createInitialPlayerStats());
    this.playerStats.set(player2Id, this.createInitialPlayerStats());
    this.gameState.currentPlayer = player1Id;
    this.gameState.status = 'in_progress';
  }

  public updateGameState(event: GameEvent): void {
    this.eventHistory.push(event);
    this.updatePlayerStats(event);
    this.updateMatchStats(event);
    this.updateGameStatus(event);
  }

  public getPlayerStats(playerId: string): PlayerStats | undefined {
    return this.playerStats.get(playerId);
  }

  public getMatchStats(): MatchStats {
    return this.matchStats;
  }

  public getGameState(): GameState {
    return this.gameState;
  }

  public getEventHistory(): GameEvent[] {
    return this.eventHistory;
  }

  private createInitialPlayerStats(): PlayerStats {
    return {
      shotsTaken: 0,
      successfulShots: 0,
      averageAccuracy: 0,
      preferredShotTypes: new Map(),
      weaknesses: new Set(),
      currentStreak: 0,
      longestStreak: 0
    };
  }

  private updatePlayerStats(event: GameEvent): void {
    const playerStats = this.playerStats.get(event.playerId);
    if (!playerStats) return;

    playerStats.shotsTaken++;
    if (event.success) {
      playerStats.successfulShots++;
      playerStats.currentStreak++;
      playerStats.longestStreak = Math.max(playerStats.longestStreak, playerStats.currentStreak);
    } else {
      playerStats.currentStreak = 0;
    }

    // Update preferred shot types
    const shotTypeCount = playerStats.preferredShotTypes.get(event.shotType) || 0;
    playerStats.preferredShotTypes.set(event.shotType, shotTypeCount + 1);

    // Update weaknesses
    if (!event.success && event.accuracy < 0.5) {
      playerStats.weaknesses.add(event.shotType);
    }

    // Update average accuracy
    playerStats.averageAccuracy = 
      (playerStats.averageAccuracy * (playerStats.shotsTaken - 1) + event.accuracy) / 
      playerStats.shotsTaken;
  }

  private updateMatchStats(event: GameEvent): void {
    this.matchStats.totalShots++;
    if (event.success) {
      this.matchStats.successfulShots++;
      this.matchStats.currentStreak++;
      this.matchStats.longestStreak = Math.max(
        this.matchStats.longestStreak,
        this.matchStats.currentStreak
      );
    } else {
      this.matchStats.currentStreak = 0;
    }

    // Update average shot time
    this.matchStats.averageShotTime = 
      (this.matchStats.averageShotTime * (this.matchStats.totalShots - 1) + event.duration) / 
      this.matchStats.totalShots;
  }

  private updateGameStatus(event: GameEvent): void {
    this.gameState.turn++;
    this.gameState.currentPlayer = event.playerId === this.gameState.currentPlayer ? 
      this.getOtherPlayer(event.playerId) : 
      event.playerId;

    // Update score
    if (event.success) {
      if (event.playerId === Object.keys(this.gameState.score)[0]) {
        this.gameState.score.player1++;
      } else {
        this.gameState.score.player2++;
      }
    }

    // Check for game end
    if (this.gameState.score.player1 >= 8 || this.gameState.score.player2 >= 8) {
      this.gameState.status = 'completed';
    }
  }

  private getOtherPlayer(playerId: string): string {
    const players = Array.from(this.playerStats.keys());
    return players.find(id => id !== playerId) || '';
  }
} 