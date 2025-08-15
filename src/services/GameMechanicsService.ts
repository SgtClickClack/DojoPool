import { EventEmitter } from 'events';
import { ChallengeService } from '.js';
import progressionService from '.js';
import gameStateService, { GameStateService, GameState } from '.js';
import advancedTournamentService, { AdvancedTournamentService, CreateTournamentData } from '.js';
import PlayerMovementService from '.js';

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

/**
 * Refactored GameMechanicsService - Now acts as a lightweight orchestrator
 * Delegates specific responsibilities to focused services for better maintainability
 */
class GameMechanicsService extends EventEmitter {
  private gameStateService: GameStateService;
  private tournamentService: AdvancedTournamentService;
  private movementService: PlayerMovementService;
  private challengeService: typeof ChallengeService;
  private progressionService: typeof progressionService;
  private territoryControl: Map<string, TerritoryControl> = new Map();
  private activeMatches: Map<string, MatchTracking> = new Map();

  constructor() {
    super();
    
    // Initialize focused services
    this.gameStateService = gameStateService;
    this.tournamentService = advancedTournamentService;
    this.movementService = new PlayerMovementService(this.gameStateService);
    this.challengeService = ChallengeService;
    this.progressionService = progressionService;

    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    // Relay events from focused services
    this.gameStateService.on('gameStateUpdated', (data) => this.emit('gameStateUpdated', data));
    this.gameStateService.on('locationUpdated', (data) => this.emit('locationUpdated', data));
    
    this.tournamentService.on('tournamentChallengeCreated', (data) => this.emit('tournamentChallengeCreated', data));
    this.tournamentService.on('tournamentJoined', (data) => this.emit('tournamentJoined', data));
    
    this.movementService.on('travelStarted', (data) => this.emit('travelStarted', data));
    this.movementService.on('travelCompleted', (data) => this.emit('travelCompleted', data));
    
    // Listen for progression events
    this.progressionService.on('levelUp', (data: any) => this.emit('levelUp', data));
    this.progressionService.on('achievementUnlocked', (data: any) => this.emit('achievementUnlocked', data));
    this.progressionService.on('objectiveCompleted', (data: any) => this.emit('objectiveCompleted', data));
  }

  // ===== CHALLENGE MANAGEMENT (Delegated to ChallengeService and TournamentService) =====

  /**
   * Create a basic challenge (delegated to ChallengeService)
   */
  async createChallenge(type: 'pilgrimage' | 'gauntlet' | 'duel', dojoId: string, defenderId: string): Promise<any> {
    try {
      const challenge = await this.challengeService.createChallenge({
        type,
        defenderId,
        dojoId
      });

      this.gameStateService.addActiveChallenge(challenge);
      this.emit('challengeCreated', challenge);

      return challenge;
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  }

  /**
   * Create tournament challenge (delegated to TournamentService)
   */
  async createTournamentChallenge(tournamentData: CreateTournamentData): Promise<any> {
    return this.tournamentService.createTournamentChallenge(tournamentData);
  }

  /**
   * Accept challenge (delegated to ChallengeService)
   */
  async acceptChallenge(challengeId: string): Promise<any> {
    try {
      const challenge = await this.challengeService.acceptChallenge(challengeId);
      this.emit('challengeAccepted', challenge);
      return challenge;
    } catch (error) {
      console.error('Error accepting challenge:', error);
      throw error;
    }
  }

  /**
   * Decline challenge (delegated to ChallengeService)
   */
  async declineChallenge(challengeId: string): Promise<any> {
    try {
      const challenge = await this.challengeService.declineChallenge(challengeId);
      this.gameStateService.removeActiveChallenge(challengeId);
      this.emit('challengeDeclined', challenge);
      return challenge;
    } catch (error) {
      console.error('Error declining challenge:', error);
      throw error;
    }
  }

  // ===== TERRITORY CONTROL =====

  /**
   * Claim territory (simplified)
   */
  async claimTerritory(dojoId: string): Promise<boolean> {
    try {
      const playerId = this.gameStateService.getPlayerId();
      const territory: TerritoryControl = {
        dojoId,
        controllerId: playerId,
        controllerName: 'Current Player',
        influence: 100,
        level: 1,
        lastContested: new Date(),
        defenders: [playerId],
        challenges: []
      };

      this.territoryControl.set(dojoId, territory);
      
      // Update game state
      const currentState = this.gameStateService.getGameState();
      this.gameStateService.updateTerritoryControl({
        controlledDojos: [...currentState.territoryControl.controlledDojos, dojoId],
        influence: currentState.territoryControl.influence + 10
      });

      this.emit('territoryClaimed', territory);
      return true;
    } catch (error) {
      console.error('Error claiming territory:', error);
      throw error;
    }
  }

  // ===== PLAYER MOVEMENT (Delegated to PlayerMovementService) =====

  /**
   * Start travel (delegated to PlayerMovementService)
   */
  async startTravel(destinationDojoId: string, travelMethod: 'walking' | 'driving' | 'public_transport' = 'walking'): Promise<any> {
    return this.movementService.startTravel(destinationDojoId, travelMethod);
  }

  /**
   * Teleport to dojo (delegated to PlayerMovementService)
   */
  async teleportToDojo(dojoId: string, teleportType: 'instant' | 'ritual' | 'clan_gate'): Promise<any> {
    return this.movementService.teleportToDojo(dojoId, teleportType);
  }

  /**
   * Fast travel to dojo (delegated to PlayerMovementService)
   */
  async fastTravelToDojo(dojoId: string, fastTravelType: 'clan_network' | 'alliance_network' | 'premium'): Promise<any> {
    return this.movementService.fastTravelToDojo(dojoId, fastTravelType);
  }

  /**
   * Complete travel (delegated to PlayerMovementService)
   */
  async completeTravel(): Promise<void> {
    return this.movementService.completeTravel();
  }

  /**
   * Cancel travel (delegated to PlayerMovementService)
   */
  async cancelTravel(): Promise<void> {
    return this.movementService.cancelTravel();
  }

  // ===== MATCH MANAGEMENT =====

  /**
   * Start a match
   */
  async startMatch(opponentId: string, dojoId: string): Promise<MatchTracking> {
    try {
      const playerId = this.gameStateService.getPlayerId();
      const match: MatchTracking = {
        matchId: `match-${Date.now()}`,
        player1Id: playerId,
        player2Id: opponentId,
        dojoId,
        startTime: new Date(),
        status: 'preparing',
        score: { player1: 0, player2: 0 },
        events: []
      };

      this.activeMatches.set(match.matchId, match);
      
      // Update game state
      this.gameStateService.updateMatchState({
        isInMatch: true,
        matchId: match.matchId,
        opponentId,
        dojoId,
        startTime: match.startTime,
        score: { player: 0, opponent: 0 }
      });

      this.emit('matchStarted', match);
      return match;
    } catch (error) {
      console.error('Error starting match:', error);
      throw error;
    }
  }

  /**
   * Record match event
   */
  async recordMatchEvent(matchId: string, event: Omit<MatchEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const match = this.activeMatches.get(matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      const matchEvent: MatchEvent = {
        id: `event-${Date.now()}`,
        timestamp: new Date(),
        ...event
      };

      match.events.push(matchEvent);

      // Handle 'game_end' events to update match scores
      if (event.type === 'game_end' && event.data) {
        const { winner, score } = event.data;
        
        // Update match score based on the winner
        if (winner === match.player1Id) {
          match.score.player1++;
        } else if (winner === match.player2Id) {
          match.score.player2++;
        }

        // Update game state with new score
        const currentPlayerId = this.gameStateService.getPlayerId();
        const isPlayer1 = currentPlayerId === match.player1Id;
        
        this.gameStateService.updateMatchState({
          isInMatch: true,
          matchId: match.matchId,
          opponentId: isPlayer1 ? match.player2Id : match.player1Id,
          dojoId: match.dojoId,
          startTime: match.startTime,
          score: {
            player: isPlayer1 ? match.score.player1 : match.score.player2,
            opponent: isPlayer1 ? match.score.player2 : match.score.player1
          }
        });
      }

      this.activeMatches.set(matchId, match);

      this.emit('matchEventRecorded', { matchId, event: matchEvent });
    } catch (error) {
      console.error('Error recording match event:', error);
      throw error;
    }
  }

  /**
   * End match
   */
  async endMatch(matchId: string, winnerId: string): Promise<void> {
    try {
      const match = this.activeMatches.get(matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      match.status = 'completed';
      match.endTime = new Date();
      match.winnerId = winnerId;

      this.activeMatches.set(matchId, match);

      // Award experience and update progression
      const loserId = match.player1Id === winnerId ? match.player2Id : match.player1Id;
      const currentPlayerId = this.gameStateService.getPlayerId();
      
      // Award 100 XP to winner, 25 XP to loser
      try {
        // Only award experience to current player
        if (winnerId === currentPlayerId) {
          this.progressionService.addExperience(100);
          this.progressionService.updateGameResult(true);
        } else if (loserId === currentPlayerId) {
          this.progressionService.addExperience(25);
          this.progressionService.updateGameResult(false);
        }
      } catch (progressionError) {
        console.error('Error updating progression after match:', progressionError);
        // Don't throw - match completion is more important than progression updates
      }

      // Update game state
      this.gameStateService.updateMatchState({
        isInMatch: false,
        matchId: undefined,
        opponentId: undefined,
        dojoId: undefined,
        startTime: undefined,
        score: undefined
      });

      this.emit('matchEnded', match);
    } catch (error) {
      console.error('Error ending match:', error);
      throw error;
    }
  }

  // ===== GETTERS (Delegated to appropriate services) =====

  getGameState(): GameState {
    return this.gameStateService.getGameState();
  }

  getTerritoryControl(): Map<string, TerritoryControl> {
    return this.territoryControl;
  }

  getActiveMatches(): Map<string, MatchTracking> {
    return this.activeMatches;
  }

  getPlayerMovements(): Map<string, any> {
    return this.movementService.getAllMovements();
  }

  // ===== TOURNAMENT DELEGATION =====

  async joinTournament(tournamentId: string): Promise<boolean> {
    const playerId = this.gameStateService.getPlayerId();
    return this.tournamentService.joinTournament(tournamentId, playerId, 'Player Name');
  }

  getTournament(tournamentId: string): any {
    return this.tournamentService.getTournament(tournamentId);
  }

  getActiveTournaments(): any[] {
    return this.tournamentService.getActiveTournaments();
  }

  // ===== CLEANUP =====

  disconnect(): void {
    this.gameStateService.disconnect();
    this.removeAllListeners();
  }
}

export default new GameMechanicsService(); 
