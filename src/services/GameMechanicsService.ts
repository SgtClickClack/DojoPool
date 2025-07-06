import { EventEmitter } from 'events';
import { io, Socket } from 'socket.io-client';
import { ChallengeService } from './ChallengeService';
import progressionService from './progression/ProgressionService';

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

export interface TerritoryControl {
  dojoId: string;
  controllerId: string;
  controllerName: string;
  clanId?: string;
  clanName?: string;
  influence: number;
  level: number;
  lastContested: Date;
  defenders: string[];
  challenges: any[];
}

export interface PlayerMovement {
  playerId: string;
  fromLocation: {
    latitude: number;
    longitude: number;
    dojoId?: string;
  };
  toLocation: {
    latitude: number;
    longitude: number;
    dojoId: string;
    dojoName: string;
  };
  startTime: Date;
  estimatedDuration: number; // in minutes
  travelMethod: 'walking' | 'driving' | 'public_transport';
  status: 'traveling' | 'arrived' | 'cancelled';
}

export interface MatchTracking {
  matchId: string;
  player1Id: string;
  player2Id: string;
  dojoId: string;
  startTime: Date;
  endTime?: Date;
  status: 'preparing' | 'active' | 'completed' | 'cancelled';
  score: {
    player1: number;
    player2: number;
  };
  events: MatchEvent[];
  winnerId?: string;
  matchData?: any;
}

export interface MatchEvent {
  id: string;
  type: 'shot' | 'foul' | 'timeout' | 'game_end';
  timestamp: Date;
  playerId: string;
  data?: any;
}

class GameMechanicsService extends EventEmitter {
  private socket: Socket | null = null;
  private gameState: GameState;
  private territoryControl: Map<string, TerritoryControl> = new Map();
  private activeMatches: Map<string, MatchTracking> = new Map();
  private playerMovements: Map<string, PlayerMovement> = new Map();
  private progressionService: typeof progressionService;
  private challengeService: typeof ChallengeService;

  constructor() {
    super();
    this.progressionService = progressionService;
    this.challengeService = ChallengeService;
    
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
    this.initializeEventListeners();
  }

  private initializeSocket(): void {
    this.socket = io('/socket.io', {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('GameMechanicsService connected to server');
      this.emit('connected');
    });

    this.socket.on('disconnect', () => {
      console.log('GameMechanicsService disconnected from server');
      this.emit('disconnected');
    });

    this.socket.on('territory_update', (data: TerritoryControl) => {
      this.handleTerritoryUpdate(data);
    });

    this.socket.on('challenge_update', (data: any) => {
      this.handleChallengeUpdate(data);
    });

    this.socket.on('match_update', (data: MatchTracking) => {
      this.handleMatchUpdate(data);
    });

    this.socket.on('player_movement', (data: PlayerMovement) => {
      this.handlePlayerMovement(data);
    });
  }

  private initializeEventListeners(): void {
    // Listen for progression events
    this.progressionService.on('levelUp', (data: any) => {
      this.emit('levelUp', data);
    });

    this.progressionService.on('achievementUnlocked', (data: any) => {
      this.emit('achievementUnlocked', data);
    });

    this.progressionService.on('objectiveCompleted', (data: any) => {
      this.emit('objectiveCompleted', data);
    });
  }

  // Challenge Management
  async createChallenge(type: 'pilgrimage' | 'gauntlet' | 'duel', dojoId: string, defenderId: string): Promise<any> {
    try {
      const challenge = await this.challengeService.createChallenge({
        type,
        defenderId,
        dojoId
      });

      this.gameState.activeChallenges.push(challenge);
      this.emit('challengeCreated', challenge);

      return challenge;
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  }

  async acceptChallenge(challengeId: string): Promise<any> {
    try {
      const challenge = await this.challengeService.acceptChallenge(challengeId);
      
      // Update local state
      const index = this.gameState.activeChallenges.findIndex(c => c.id === challengeId);
      if (index !== -1) {
        this.gameState.activeChallenges[index] = challenge;
      }

      this.emit('challengeAccepted', challenge);
      return challenge;
    } catch (error) {
      console.error('Error accepting challenge:', error);
      throw error;
    }
  }

  async declineChallenge(challengeId: string): Promise<any> {
    try {
      const challenge = await this.challengeService.declineChallenge(challengeId);
      
      // Remove from active challenges
      this.gameState.activeChallenges = this.gameState.activeChallenges.filter(c => c.id !== challengeId);

      this.emit('challengeDeclined', challenge);
      return challenge;
    } catch (error) {
      console.error('Error declining challenge:', error);
      throw error;
    }
  }

  // Territory Control
  async claimTerritory(dojoId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/territory/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dojoId,
          playerId: this.gameState.playerId
        })
      });

      if (response.ok) {
        const territory = await response.json();
        this.territoryControl.set(dojoId, territory);
        this.gameState.territoryControl.controlledDojos.push(dojoId);
        
        this.emit('territoryClaimed', territory);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error claiming territory:', error);
      return false;
    }
  }

  async contestTerritory(dojoId: string, challengeType: 'standard' | 'high-stakes' | 'clan-war'): Promise<any> {
    try {
      const response = await fetch('/api/territory/contest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dojoId,
          challengerId: this.gameState.playerId,
          challengeType
        })
      });

      if (response.ok) {
        const challenge = await response.json();
        this.emit('territoryContested', challenge);
        return challenge;
      }
      return null;
    } catch (error) {
      console.error('Error contesting territory:', error);
      return null;
    }
  }

  // Player Movement
  async startTravel(destinationDojoId: string, travelMethod: 'walking' | 'driving' | 'public_transport' = 'walking'): Promise<PlayerMovement> {
    const destination = await this.getDojoLocation(destinationDojoId);
    if (!destination) {
      throw new Error('Destination dojo not found');
    }

    const movement: PlayerMovement = {
      playerId: this.gameState.playerId,
      fromLocation: { ...this.gameState.currentLocation },
      toLocation: destination,
      startTime: new Date(),
      estimatedDuration: this.calculateTravelTime(
        this.gameState.currentLocation,
        destination,
        travelMethod
      ),
      travelMethod,
      status: 'traveling'
    };

    this.playerMovements.set(this.gameState.playerId, movement);
    this.gameState.isTraveling = true;
    this.gameState.destination = {
      dojoId: destination.dojoId,
      dojoName: destination.dojoName,
      latitude: destination.latitude,
      longitude: destination.longitude,
      estimatedArrival: new Date(Date.now() + movement.estimatedDuration * 60 * 1000)
    };

    // Emit movement start
    this.socket?.emit('player_movement_start', movement);
    this.emit('travelStarted', movement);

    // Start travel timer
    setTimeout(() => {
      this.completeTravel();
    }, movement.estimatedDuration * 60 * 1000);

    return movement;
  }

  async completeTravel(): Promise<void> {
    const movement = this.playerMovements.get(this.gameState.playerId);
    if (!movement) return;

    movement.status = 'arrived';
    this.gameState.currentLocation = {
      latitude: movement.toLocation.latitude,
      longitude: movement.toLocation.longitude,
      dojoId: movement.toLocation.dojoId
    };
    this.gameState.isTraveling = false;
    this.gameState.destination = undefined;

    this.playerMovements.delete(this.gameState.playerId);

    // Emit movement completion
    this.socket?.emit('player_movement_complete', movement);
    this.emit('travelCompleted', movement);
  }

  async cancelTravel(): Promise<void> {
    const movement = this.playerMovements.get(this.gameState.playerId);
    if (!movement) return;

    movement.status = 'cancelled';
    this.gameState.isTraveling = false;
    this.gameState.destination = undefined;

    this.playerMovements.delete(this.gameState.playerId);

    // Emit movement cancellation
    this.socket?.emit('player_movement_cancel', movement);
    this.emit('travelCancelled', movement);
  }

  // Match Tracking
  async startMatch(opponentId: string, dojoId: string): Promise<MatchTracking> {
    const match: MatchTracking = {
      matchId: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      player1Id: this.gameState.playerId,
      player2Id: opponentId,
      dojoId,
      startTime: new Date(),
      status: 'preparing',
      score: { player1: 0, player2: 0 },
      events: []
    };

    this.activeMatches.set(match.matchId, match);
    this.gameState.matchState = {
      isInMatch: true,
      matchId: match.matchId,
      opponentId,
      dojoId,
      startTime: match.startTime,
      score: { player: 0, opponent: 0 }
    };

    // Emit match start
    this.socket?.emit('match_start', match);
    this.emit('matchStarted', match);

    return match;
  }

  async recordMatchEvent(matchId: string, event: Omit<MatchEvent, 'id' | 'timestamp'>): Promise<void> {
    const match = this.activeMatches.get(matchId);
    if (!match) return;

    const matchEvent: MatchEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...event
    };

    match.events.push(matchEvent);

    // Update score if it's a game-ending event
    if (event.type === 'game_end') {
      if (event.playerId === match.player1Id) {
        match.score.player1++;
        this.gameState.matchState.score!.player++;
      } else {
        match.score.player2++;
        this.gameState.matchState.score!.opponent++;
      }
    }

    // Emit event
    this.socket?.emit('match_event', { matchId, event: matchEvent });
    this.emit('matchEvent', { matchId, event: matchEvent });
  }

  async endMatch(matchId: string, winnerId: string): Promise<void> {
    const match = this.activeMatches.get(matchId);
    if (!match) return;

    match.status = 'completed';
    match.endTime = new Date();
    match.winnerId = winnerId;

    this.gameState.matchState = {
      isInMatch: false
    };

    // Award experience and progression
    const isWinner = winnerId === this.gameState.playerId;
    const experienceGained = isWinner ? 100 : 25;
    
    await this.progressionService.addExperience(experienceGained);
    
    // Update game result for progression tracking
    this.progressionService.updateGameResult(isWinner);

    // Emit match end
    this.socket?.emit('match_end', match);
    this.emit('matchEnded', match);

    this.activeMatches.delete(matchId);
  }

  // Utility Methods
  private async getDojoLocation(dojoId: string): Promise<any> {
    try {
      const response = await fetch(`/api/dojo/${dojoId}`);
      if (response.ok) {
        const dojo = await response.json();
        return {
          dojoId: dojo.id,
          dojoName: dojo.name,
          latitude: dojo.latitude,
          longitude: dojo.longitude
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching dojo location:', error);
      return null;
    }
  }

  private calculateTravelTime(from: any, to: any, method: string): number {
    const distance = this.calculateDistance(from, to);
    
    const speeds = {
      walking: 5, // km/h
      driving: 30, // km/h
      public_transport: 20 // km/h
    };

    return Math.ceil((distance / speeds[method as keyof typeof speeds]) * 60); // minutes
  }

  private calculateDistance(from: any, to: any): number {
    const R = 6371; // Earth's radius in km
    const dLat = (to.latitude - from.latitude) * Math.PI / 180;
    const dLon = (to.longitude - from.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(from.latitude * Math.PI / 180) * Math.cos(to.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Event Handlers
  private handleTerritoryUpdate(data: TerritoryControl): void {
    this.territoryControl.set(data.dojoId, data);
    this.emit('territoryUpdated', data);
  }

  private handleChallengeUpdate(data: any): void {
    const index = this.gameState.activeChallenges.findIndex(c => c.id === data.id);
    if (index !== -1) {
      this.gameState.activeChallenges[index] = data;
    } else {
      this.gameState.activeChallenges.push(data);
    }
    this.emit('challengeUpdated', data);
  }

  private handleMatchUpdate(data: MatchTracking): void {
    this.activeMatches.set(data.matchId, data);
    this.emit('matchUpdated', data);
  }

  private handlePlayerMovement(data: PlayerMovement): void {
    this.playerMovements.set(data.playerId, data);
    this.emit('playerMovementUpdated', data);
  }

  // Getters
  getGameState(): GameState {
    return { ...this.gameState };
  }

  getTerritoryControl(): Map<string, TerritoryControl> {
    return new Map(this.territoryControl);
  }

  getActiveMatches(): Map<string, MatchTracking> {
    return new Map(this.activeMatches);
  }

  getPlayerMovements(): Map<string, PlayerMovement> {
    return new Map(this.playerMovements);
  }

  // Cleanup
  disconnect(): void {
    this.socket?.disconnect();
    this.removeAllListeners();
  }
}

export default GameMechanicsService; 