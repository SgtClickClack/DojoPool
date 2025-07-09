import { EventEmitter } from 'events';
import { io, Socket } from 'socket.io-client';

export interface GameState {
  playerId: string;
  currentLocation: {
    latitude: number;
    longitude: number;
    dojoId?: string;
  };
  isTraveling: boolean;
  destination?: {
    dojoId: string;
    dojoName: string;
    latitude: number;
    longitude: number;
    estimatedArrival: Date;
  };
  activeChallenges: any[];
  territoryControl: {
    controlledDojos: string[];
    influence: number;
    clanId?: string;
  };
  matchState: {
    isInMatch: boolean;
    matchId?: string;
    opponentId?: string;
    dojoId?: string;
    startTime?: Date;
    score?: {
      player: number;
      opponent: number;
    };
  };
}

/**
 * Focused service for managing core game state
 * Handles player state, location tracking, and basic game flow
 */
export class GameStateService extends EventEmitter {
  private socket: Socket | null = null;
  private gameState: GameState;

  constructor() {
    super();
    
    this.gameState = {
      playerId: 'player-1',
      currentLocation: {
        latitude: -27.4698,
        longitude: 153.0251,
        dojoId: 'dojo-1'
      },
      isTraveling: false,
      activeChallenges: [],
      territoryControl: {
        controlledDojos: [],
        influence: 0,
        clanId: 'clan-1'
      },
      matchState: {
        isInMatch: false
      }
    };

    this.initializeSocket();
  }

  private initializeSocket(): void {
    this.socket = io('/socket.io', {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('GameStateService connected to server');
      this.emit('connected');
    });

    this.socket.on('disconnect', () => {
      console.log('GameStateService disconnected from server');
      this.emit('disconnected');
    });

    this.socket.on('game_state_update', (data: Partial<GameState>) => {
      this.updateGameState(data);
    });
  }

  /**
   * Update game state with new data
   */
  updateGameState(updates: Partial<GameState>): void {
    this.gameState = { ...this.gameState, ...updates };
    this.emit('gameStateUpdated', this.gameState);
  }

  /**
   * Update player location
   */
  updatePlayerLocation(latitude: number, longitude: number, dojoId?: string): void {
    this.gameState.currentLocation = { latitude, longitude, dojoId };
    this.emit('locationUpdated', this.gameState.currentLocation);
  }

  /**
   * Set traveling state
   */
  setTravelingState(isTraveling: boolean, destination?: any): void {
    this.gameState.isTraveling = isTraveling;
    this.gameState.destination = destination;
    this.emit('travelStateUpdated', { isTraveling, destination });
  }

  /**
   * Update match state
   */
  updateMatchState(matchState: Partial<GameState['matchState']>): void {
    this.gameState.matchState = { ...this.gameState.matchState, ...matchState };
    this.emit('matchStateUpdated', this.gameState.matchState);
  }

  /**
   * Add active challenge
   */
  addActiveChallenge(challenge: any): void {
    this.gameState.activeChallenges.push(challenge);
    this.emit('challengeAdded', challenge);
  }

  /**
   * Remove active challenge
   */
  removeActiveChallenge(challengeId: string): void {
    this.gameState.activeChallenges = this.gameState.activeChallenges.filter(
      challenge => challenge.id !== challengeId
    );
    this.emit('challengeRemoved', challengeId);
  }

  /**
   * Update territory control
   */
  updateTerritoryControl(updates: Partial<GameState['territoryControl']>): void {
    this.gameState.territoryControl = { ...this.gameState.territoryControl, ...updates };
    this.emit('territoryControlUpdated', this.gameState.territoryControl);
  }

  /**
   * Get current game state
   */
  getGameState(): GameState {
    return { ...this.gameState };
  }

  /**
   * Get player ID
   */
  getPlayerId(): string {
    return this.gameState.playerId;
  }

  /**
   * Get current location
   */
  getCurrentLocation(): GameState['currentLocation'] {
    return { ...this.gameState.currentLocation };
  }

  /**
   * Check if player is traveling
   */
  isTraveling(): boolean {
    return this.gameState.isTraveling;
  }

  /**
   * Check if player is in match
   */
  isInMatch(): boolean {
    return this.gameState.matchState.isInMatch;
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new GameStateService();