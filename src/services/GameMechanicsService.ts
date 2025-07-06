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
  travelMethod: 'walking' | 'driving' | 'public_transport' | 'teleport' | 'fast_travel';
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

export interface Challenge {
  id: string;
  type: 'pilgrimage' | 'gauntlet' | 'duel' | 'tournament' | 'clan';
  challengerId: string;
  defenderId?: string;
  dojoId: string;
  status: 'pending' | 'accepted' | 'declined' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  expiresAt?: Date;
  requirements?: {
    minLevel?: number;
    minReputation?: number;
    territoryControl?: boolean;
  };
  rewards?: {
    experience?: number;
    coins?: number;
    items?: string[];
  };
}

export interface AdvancedChallenge extends Challenge {
  tournamentId?: string;
  clanId?: string;
  entryFee?: number;
  prizePool?: number;
  maxParticipants?: number;
  currentParticipants?: number;
  startDate?: Date;
  endDate?: Date;
  rules?: string[];
  requirements?: {
    minLevel?: number;
    minReputation?: number;
    clanMembership?: boolean;
    territoryControl?: boolean;
  };
}

export interface ClanChallenge extends AdvancedChallenge {
  clanId: string;
  clanName: string;
  defendingClanId?: string;
  defendingClanName?: string;
  territoryStakes: string[];
  diplomaticImplications: boolean;
}

export interface TournamentChallenge extends AdvancedChallenge {
  tournamentId: string;
  tournamentName: string;
  bracketType: 'single_elimination' | 'double_elimination' | 'round_robin';
  currentRound: number;
  totalRounds: number;
  participants: TournamentParticipant[];
  matches: TournamentMatch[];
}

export interface TournamentParticipant {
  playerId: string;
  playerName: string;
  clanId?: string;
  clanName?: string;
  seed?: number;
  status: 'active' | 'eliminated' | 'winner';
  wins: number;
  losses: number;
}

export interface TournamentMatch {
  matchId: string;
  round: number;
  player1Id: string;
  player2Id: string;
  winnerId?: string;
  status: 'pending' | 'active' | 'completed';
  score?: {
    player1: number;
    player2: number;
  };
}

export interface TerritoryAlliance {
  allianceId: string;
  name: string;
  leaderClanId: string;
  memberClans: string[];
  sharedTerritories: string[];
  diplomaticStatus: 'friendly' | 'neutral' | 'hostile';
  tradeAgreements: TradeAgreement[];
  mutualDefensePacts: DefensePact[];
}

export interface TradeAgreement {
  agreementId: string;
  clan1Id: string;
  clan2Id: string;
  terms: {
    resourceType: string;
    amount: number;
    frequency: 'daily' | 'weekly' | 'monthly';
  };
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'expired' | 'cancelled';
}

export interface DefensePact {
  pactId: string;
  clan1Id: string;
  clan2Id: string;
  territoryScope: string[];
  activationConditions: string[];
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'expired' | 'cancelled';
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

  // Advanced Challenge Management
  async createTournamentChallenge(tournamentData: {
    name: string;
    dojoId: string;
    entryFee: number;
    maxParticipants: number;
    bracketType: 'single_elimination' | 'double_elimination' | 'round_robin';
    startDate: Date;
    endDate: Date;
    rules: string[];
    requirements: {
      minLevel?: number;
      minReputation?: number;
      clanMembership?: boolean;
    };
  }): Promise<TournamentChallenge> {
    try {
      const tournamentChallenge: TournamentChallenge = {
        id: `tournament-${Date.now()}`,
        type: 'tournament',
        challengerId: this.gameState.playerId,
        dojoId: tournamentData.dojoId,
        status: 'pending',
        createdAt: new Date(),
        tournamentId: `tournament-${Date.now()}`,
        tournamentName: tournamentData.name,
        entryFee: tournamentData.entryFee,
        maxParticipants: tournamentData.maxParticipants,
        currentParticipants: 0,
        startDate: tournamentData.startDate,
        endDate: tournamentData.endDate,
        rules: tournamentData.rules,
        requirements: tournamentData.requirements,
        bracketType: tournamentData.bracketType,
        currentRound: 0,
        totalRounds: this.calculateTotalRounds(tournamentData.maxParticipants, tournamentData.bracketType),
        participants: [],
        matches: []
      };

      this.gameState.activeChallenges.push(tournamentChallenge);
      this.emit('tournamentChallengeCreated', tournamentChallenge);

      return tournamentChallenge;
    } catch (error) {
      console.error('Error creating tournament challenge:', error);
      throw error;
    }
  }

  async createClanChallenge(clanData: {
    clanId: string;
    clanName: string;
    defendingClanId?: string;
    defendingClanName?: string;
    dojoId: string;
    territoryStakes: string[];
    diplomaticImplications: boolean;
    entryFee?: number;
    requirements: {
      minLevel?: number;
      minReputation?: number;
      clanMembership: boolean;
    };
  }): Promise<ClanChallenge> {
    try {
      const clanChallenge: ClanChallenge = {
        id: `clan-${Date.now()}`,
        type: 'clan',
        challengerId: this.gameState.playerId,
        dojoId: clanData.dojoId,
        status: 'pending',
        createdAt: new Date(),
        clanId: clanData.clanId,
        clanName: clanData.clanName,
        defendingClanId: clanData.defendingClanId,
        defendingClanName: clanData.defendingClanName,
        territoryStakes: clanData.territoryStakes,
        diplomaticImplications: clanData.diplomaticImplications,
        entryFee: clanData.entryFee,
        requirements: clanData.requirements
      };

      this.gameState.activeChallenges.push(clanChallenge);
      this.emit('clanChallengeCreated', clanChallenge);

      return clanChallenge;
    } catch (error) {
      console.error('Error creating clan challenge:', error);
      throw error;
    }
  }

  async joinTournament(tournamentId: string): Promise<boolean> {
    try {
      const tournament = this.gameState.activeChallenges.find(
        challenge => challenge.tournamentId === tournamentId
      ) as TournamentChallenge;

      if (!tournament) {
        throw new Error('Tournament not found');
      }

      if ((tournament.currentParticipants || 0) >= (tournament.maxParticipants || 0)) {
        throw new Error('Tournament is full');
      }

      const participant: TournamentParticipant = {
        playerId: this.gameState.playerId,
        playerName: 'Player Name', // Get from user profile
        clanId: this.gameState.territoryControl.clanId,
        clanName: 'Clan Name', // Get from clan service
        status: 'active',
        wins: 0,
        losses: 0
      };

      tournament.participants.push(participant);
      tournament.currentParticipants = (tournament.currentParticipants || 0) + 1;

      this.emit('tournamentJoined', { tournamentId, participant });

      return true;
    } catch (error) {
      console.error('Error joining tournament:', error);
      throw error;
    }
  }

  // Territory Alliance Management
  async createTerritoryAlliance(allianceData: {
    name: string;
    leaderClanId: string;
    memberClans: string[];
    sharedTerritories: string[];
  }): Promise<TerritoryAlliance> {
    try {
      const alliance: TerritoryAlliance = {
        allianceId: `alliance-${Date.now()}`,
        name: allianceData.name,
        leaderClanId: allianceData.leaderClanId,
        memberClans: allianceData.memberClans,
        sharedTerritories: allianceData.sharedTerritories,
        diplomaticStatus: 'friendly',
        tradeAgreements: [],
        mutualDefensePacts: []
      };

      this.emit('allianceCreated', alliance);
      return alliance;
    } catch (error) {
      console.error('Error creating territory alliance:', error);
      throw error;
    }
  }

  async createTradeAgreement(agreementData: {
    clan1Id: string;
    clan2Id: string;
    resourceType: string;
    amount: number;
    frequency: 'daily' | 'weekly' | 'monthly';
    duration: number; // in days
  }): Promise<TradeAgreement> {
    try {
      const agreement: TradeAgreement = {
        agreementId: `trade-${Date.now()}`,
        clan1Id: agreementData.clan1Id,
        clan2Id: agreementData.clan2Id,
        terms: {
          resourceType: agreementData.resourceType,
          amount: agreementData.amount,
          frequency: agreementData.frequency
        },
        startDate: new Date(),
        endDate: new Date(Date.now() + agreementData.duration * 24 * 60 * 60 * 1000),
        status: 'active'
      };

      this.emit('tradeAgreementCreated', agreement);
      return agreement;
    } catch (error) {
      console.error('Error creating trade agreement:', error);
      throw error;
    }
  }

  async createDefensePact(pactData: {
    clan1Id: string;
    clan2Id: string;
    territoryScope: string[];
    activationConditions: string[];
    duration: number; // in days
  }): Promise<DefensePact> {
    try {
      const pact: DefensePact = {
        pactId: `pact-${Date.now()}`,
        clan1Id: pactData.clan1Id,
        clan2Id: pactData.clan2Id,
        territoryScope: pactData.territoryScope,
        activationConditions: pactData.activationConditions,
        startDate: new Date(),
        endDate: new Date(Date.now() + pactData.duration * 24 * 60 * 60 * 1000),
        status: 'active'
      };

      this.emit('defensePactCreated', pact);
      return pact;
    } catch (error) {
      console.error('Error creating defense pact:', error);
      throw error;
    }
  }

  // Helper Methods
  private calculateTotalRounds(participants: number, bracketType: string): number {
    switch (bracketType) {
      case 'single_elimination':
        return Math.ceil(Math.log2(participants));
      case 'double_elimination':
        return Math.ceil(Math.log2(participants)) * 2;
      case 'round_robin':
        return participants - 1;
      default:
        return Math.ceil(Math.log2(participants));
    }
  }

  // Accept Challenge
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

  // Decline Challenge
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
    try {
      if (this.gameState.isTraveling) {
        throw new Error('Player is already traveling');
      }

      const destination = await this.getDojoLocation(destinationDojoId);
      const travelTime = this.calculateTravelTime(this.gameState.currentLocation, destination, travelMethod);

      const movement: PlayerMovement = {
        playerId: this.gameState.playerId,
        fromLocation: { ...this.gameState.currentLocation },
        toLocation: {
          latitude: destination.latitude,
          longitude: destination.longitude,
          dojoId: destinationDojoId,
          dojoName: destination.name
        },
        startTime: new Date(),
        estimatedDuration: travelTime,
        travelMethod,
        status: 'traveling'
      };

      this.gameState.isTraveling = true;
      this.gameState.destination = {
        dojoId: destinationDojoId,
        dojoName: destination.name,
        latitude: destination.latitude,
        longitude: destination.longitude,
        estimatedArrival: new Date(Date.now() + travelTime * 60 * 1000)
      };

      this.playerMovements.set(this.gameState.playerId, movement);
      this.emit('travelStarted', movement);

      return movement;
    } catch (error) {
      console.error('Error starting travel:', error);
      throw error;
    }
  }

  // Advanced Movement Features
  async teleportToDojo(dojoId: string, teleportType: 'instant' | 'ritual' | 'clan_gate'): Promise<PlayerMovement> {
    try {
      if (this.gameState.isTraveling) {
        throw new Error('Player is already traveling');
      }

      const destination = await this.getDojoLocation(dojoId);
      const teleportCost = this.calculateTeleportCost(teleportType, this.gameState.currentLocation, destination);

      // Check if player has enough resources for teleportation
      if (!this.hasTeleportResources(teleportCost)) {
        throw new Error('Insufficient resources for teleportation');
      }

      const movement: PlayerMovement = {
        playerId: this.gameState.playerId,
        fromLocation: { ...this.gameState.currentLocation },
        toLocation: {
          latitude: destination.latitude,
          longitude: destination.longitude,
          dojoId,
          dojoName: destination.name
        },
        startTime: new Date(),
        estimatedDuration: teleportType === 'instant' ? 0 : 5, // 5 minutes for ritual/clan gate
        travelMethod: 'teleport',
        status: 'traveling'
      };

      this.gameState.isTraveling = true;
      this.gameState.destination = {
        dojoId,
        dojoName: destination.name,
        latitude: destination.latitude,
        longitude: destination.longitude,
        estimatedArrival: new Date(Date.now() + (teleportType === 'instant' ? 0 : 5 * 60 * 1000))
      };

      this.playerMovements.set(this.gameState.playerId, movement);
      this.emit('teleportStarted', { movement, teleportType, cost: teleportCost });

      return movement;
    } catch (error) {
      console.error('Error teleporting to dojo:', error);
      throw error;
    }
  }

  async fastTravelToDojo(dojoId: string, fastTravelType: 'clan_network' | 'alliance_network' | 'premium'): Promise<PlayerMovement> {
    try {
      if (this.gameState.isTraveling) {
        throw new Error('Player is already traveling');
      }

      const destination = await this.getDojoLocation(dojoId);
      const fastTravelCost = this.calculateFastTravelCost(fastTravelType, this.gameState.currentLocation, destination);

      // Check if player has access to fast travel network
      if (!this.hasFastTravelAccess(fastTravelType, dojoId)) {
        throw new Error('No access to fast travel network for this destination');
      }

      const movement: PlayerMovement = {
        playerId: this.gameState.playerId,
        fromLocation: { ...this.gameState.currentLocation },
        toLocation: {
          latitude: destination.latitude,
          longitude: destination.longitude,
          dojoId,
          dojoName: destination.name
        },
        startTime: new Date(),
        estimatedDuration: this.calculateFastTravelTime(fastTravelType),
        travelMethod: 'fast_travel',
        status: 'traveling'
      };

      this.gameState.isTraveling = true;
      this.gameState.destination = {
        dojoId,
        dojoName: destination.name,
        latitude: destination.latitude,
        longitude: destination.longitude,
        estimatedArrival: new Date(Date.now() + this.calculateFastTravelTime(fastTravelType) * 60 * 1000)
      };

      this.playerMovements.set(this.gameState.playerId, movement);
      this.emit('fastTravelStarted', { movement, fastTravelType, cost: fastTravelCost });

      return movement;
    } catch (error) {
      console.error('Error fast traveling to dojo:', error);
      throw error;
    }
  }

  // Helper Methods for Advanced Movement
  private calculateTeleportCost(teleportType: string, from: any, to: any): any {
    const distance = this.calculateDistance(from, to);
    
    switch (teleportType) {
      case 'instant':
        return { coins: distance * 10, energy: distance * 5 };
      case 'ritual':
        return { coins: distance * 5, energy: distance * 10, ritualItems: 1 };
      case 'clan_gate':
        return { coins: distance * 3, energy: distance * 3, clanPoints: distance * 2 };
      default:
        return { coins: distance * 10, energy: distance * 5 };
    }
  }

  private calculateFastTravelCost(fastTravelType: string, from: any, to: any): any {
    const distance = this.calculateDistance(from, to);
    
    switch (fastTravelType) {
      case 'clan_network':
        return { coins: distance * 2, clanPoints: distance * 1 };
      case 'alliance_network':
        return { coins: distance * 3, alliancePoints: distance * 1 };
      case 'premium':
        return { coins: distance * 5, premiumTokens: 1 };
      default:
        return { coins: distance * 3 };
    }
  }

  private calculateFastTravelTime(fastTravelType: string): number {
    switch (fastTravelType) {
      case 'clan_network':
        return 10; // 10 minutes
      case 'alliance_network':
        return 15; // 15 minutes
      case 'premium':
        return 5; // 5 minutes
      default:
        return 15; // 15 minutes
    }
  }

  private hasTeleportResources(cost: any): boolean {
    // Mock implementation - in real app, check player's actual resources
    return true;
  }

  private hasFastTravelAccess(fastTravelType: string, dojoId: string): boolean {
    // Mock implementation - in real app, check player's clan/alliance membership and dojo access
    switch (fastTravelType) {
      case 'clan_network':
        return this.gameState.territoryControl.clanId !== undefined;
      case 'alliance_network':
        return true; // Mock - check alliance membership
      case 'premium':
        return true; // Mock - check premium status
      default:
        return false;
    }
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