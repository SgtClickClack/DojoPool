import { EventEmitter } from 'events';
import { io, Socket } from 'socket.io-client';

export interface MatchResult {
  matchId: string;
  territoryId: string;
  winnerId: string;
  loserId: string;
  winnerScore: number;
  loserScore: number;
  matchType: 'challenge' | 'tournament' | 'casual';
  timestamp: Date;
  highlights: string[];
  duration: number;
  isTerritoryMatch: boolean;
}

export interface TerritoryChallenge {
  id: string;
  territoryId: string;
  challengerId: string;
  defenderId: string;
  status: 'pending' | 'accepted' | 'declined' | 'in-progress' | 'completed';
  createdAt: Date;
  acceptedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  matchId?: string;
  challengeType: 'standard' | 'high-stakes' | 'clan-war';
  stakes?: {
    dojoCoins: number;
    nftRequirement?: string;
  };
}

export interface TerritoryOwnershipUpdate {
  territoryId: string;
  previousOwnerId?: string;
  newOwnerId: string;
  clanId?: string;
  timestamp: Date;
  reason: 'challenge' | 'tournament' | 'admin' | 'expired';
  matchId?: string;
}

export class TerritoryGameplayService extends EventEmitter {
  private socket: Socket | null = null;
  private connected: boolean = false;
  private activeChallenges: Map<string, TerritoryChallenge> = new Map();
  private pendingUpdates: TerritoryOwnershipUpdate[] = [];

  constructor() {
    super();
    this.initializeSocket();
  }

  private initializeSocket(): void {
    try {
      this.socket = io('http://localhost:8080', {
        transports: ['websocket'],
        timeout: 5000,
      });

      this.socket.on('connect', () => {
        this.connected = true;
        console.log('TerritoryGameplayService connected to server');
        this.emit('connected');
        this.syncPendingUpdates();
      });

      this.socket.on('disconnect', () => {
        this.connected = false;
        console.log('TerritoryGameplayService disconnected from server');
        this.emit('disconnected');
      });

      // Listen for match result events
      this.socket.on('match-result', (result: MatchResult) => {
        this.handleMatchResult(result);
      });

      // Listen for territory ownership updates
      this.socket.on('territory-ownership-updated', (update: TerritoryOwnershipUpdate) => {
        this.handleTerritoryOwnershipUpdate(update);
      });

      // Listen for challenge events
      this.socket.on('challenge-created', (challenge: TerritoryChallenge) => {
        this.handleChallengeCreated(challenge);
      });

      this.socket.on('challenge-updated', (challenge: TerritoryChallenge) => {
        this.handleChallengeUpdated(challenge);
      });

    } catch (error) {
      console.error('Failed to initialize TerritoryGameplayService WebSocket:', error);
    }
  }

  /**
   * Handle incoming match results and trigger territory updates
   */
  private async handleMatchResult(result: MatchResult): Promise<void> {
    try {
      console.log('Processing match result:', result);

      if (result.isTerritoryMatch) {
        // Update territory ownership
        const ownershipUpdate: TerritoryOwnershipUpdate = {
          territoryId: result.territoryId,
          previousOwnerId: await this.getCurrentTerritoryOwner(result.territoryId),
          newOwnerId: result.winnerId,
          timestamp: new Date(),
          reason: result.matchType === 'challenge' ? 'challenge' : 'tournament',
          matchId: result.matchId,
        };

        // Emit territory ownership update
        this.socket?.emit('territory-ownership-update', ownershipUpdate);
        
        // Update local state
        this.handleTerritoryOwnershipUpdate(ownershipUpdate);

        // Handle challenge completion if applicable
        if (result.matchType === 'challenge') {
          await this.completeChallenge(result.territoryId, result.winnerId, result.loserId);
        }

        // Emit match result processed event
        this.emit('matchResultProcessed', result);
      }

      // Emit general match result event
      this.emit('matchResult', result);

    } catch (error) {
      console.error('Error handling match result:', error);
      this.emit('error', error);
    }
  }

  /**
   * Handle territory ownership updates
   */
  private handleTerritoryOwnershipUpdate(update: TerritoryOwnershipUpdate): void {
    console.log('Territory ownership updated:', update);
    
    // Update local state
    this.pendingUpdates.push(update);
    
    // Emit event for UI updates
    this.emit('territoryOwnershipUpdated', update);
    
    // Broadcast to all connected clients
    this.socket?.emit('broadcast-territory-update', update);
  }

  /**
   * Handle challenge creation
   */
  private handleChallengeCreated(challenge: TerritoryChallenge): void {
    console.log('Challenge created:', challenge);
    this.activeChallenges.set(challenge.id, challenge);
    this.emit('challengeCreated', challenge);
  }

  /**
   * Handle challenge updates
   */
  private handleChallengeUpdated(challenge: TerritoryChallenge): void {
    console.log('Challenge updated:', challenge);
    this.activeChallenges.set(challenge.id, challenge);
    this.emit('challengeUpdated', challenge);
  }

  /**
   * Create a new territory challenge
   */
  public async createChallenge(
    territoryId: string,
    challengerId: string,
    defenderId: string,
    challengeType: 'standard' | 'high-stakes' | 'clan-war' = 'standard',
    stakes?: { dojoCoins: number; nftRequirement?: string }
  ): Promise<TerritoryChallenge> {
    try {
      const challenge: TerritoryChallenge = {
        id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        territoryId,
        challengerId,
        defenderId,
        status: 'pending',
        createdAt: new Date(),
        challengeType,
        stakes,
      };

      // Send challenge to server
      this.socket?.emit('create-challenge', challenge);
      
      // Add to local state
      this.activeChallenges.set(challenge.id, challenge);
      
      this.emit('challengeCreated', challenge);
      return challenge;

    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  }

  /**
   * Accept a territory challenge
   */
  public async acceptChallenge(challengeId: string, defenderId: string): Promise<void> {
    try {
      const challenge = this.activeChallenges.get(challengeId);
      if (!challenge) {
        throw new Error('Challenge not found');
      }

      if (challenge.defenderId !== defenderId) {
        throw new Error('Only the defender can accept the challenge');
      }

      const updatedChallenge: TerritoryChallenge = {
        ...challenge,
        status: 'accepted',
        acceptedAt: new Date(),
      };

      // Send acceptance to server
      this.socket?.emit('accept-challenge', { challengeId, defenderId });
      
      // Update local state
      this.activeChallenges.set(challengeId, updatedChallenge);
      
      this.emit('challengeAccepted', updatedChallenge);

    } catch (error) {
      console.error('Error accepting challenge:', error);
      throw error;
    }
  }

  /**
   * Decline a territory challenge
   */
  public async declineChallenge(challengeId: string, defenderId: string): Promise<void> {
    try {
      const challenge = this.activeChallenges.get(challengeId);
      if (!challenge) {
        throw new Error('Challenge not found');
      }

      if (challenge.defenderId !== defenderId) {
        throw new Error('Only the defender can decline the challenge');
      }

      const updatedChallenge: TerritoryChallenge = {
        ...challenge,
        status: 'declined',
      };

      // Send decline to server
      this.socket?.emit('decline-challenge', { challengeId, defenderId });
      
      // Update local state
      this.activeChallenges.set(challengeId, updatedChallenge);
      
      this.emit('challengeDeclined', updatedChallenge);

    } catch (error) {
      console.error('Error declining challenge:', error);
      throw error;
    }
  }

  /**
   * Complete a challenge after match result
   */
  private async completeChallenge(
    territoryId: string,
    winnerId: string,
    loserId: string
  ): Promise<void> {
    try {
      // Find the active challenge for this territory
      const challenge = Array.from(this.activeChallenges.values()).find(
        c => c.territoryId === territoryId && c.status === 'in-progress'
      );

      if (challenge) {
        const updatedChallenge: TerritoryChallenge = {
          ...challenge,
          status: 'completed',
          completedAt: new Date(),
        };

        // Update local state
        this.activeChallenges.set(challenge.id, updatedChallenge);
        
        // Send completion to server
        this.socket?.emit('complete-challenge', {
          challengeId: challenge.id,
          winnerId,
          loserId,
        });

        this.emit('challengeCompleted', updatedChallenge);
      }

    } catch (error) {
      console.error('Error completing challenge:', error);
      throw error;
    }
  }

  /**
   * Get current territory owner (mock implementation)
   */
  private async getCurrentTerritoryOwner(territoryId: string): Promise<string | undefined> {
    // In a real implementation, this would query the database
    // For now, return a mock owner
    return 'mock_owner_id';
  }

  /**
   * Sync pending updates when reconnecting
   */
  private syncPendingUpdates(): void {
    if (this.pendingUpdates.length > 0) {
      console.log('Syncing pending updates:', this.pendingUpdates.length);
      this.pendingUpdates.forEach(update => {
        this.emit('territoryOwnershipUpdated', update);
      });
    }
  }

  /**
   * Get active challenges for a user
   */
  public getActiveChallenges(userId: string): TerritoryChallenge[] {
    return Array.from(this.activeChallenges.values()).filter(
      challenge => 
        (challenge.challengerId === userId || challenge.defenderId === userId) &&
        ['pending', 'accepted', 'in-progress'].includes(challenge.status)
    );
  }

  /**
   * Get all active challenges
   */
  public getAllActiveChallenges(): TerritoryChallenge[] {
    return Array.from(this.activeChallenges.values()).filter(
      challenge => ['pending', 'accepted', 'in-progress'].includes(challenge.status)
    );
  }

  /**
   * Check if user has pending challenges
   */
  public hasPendingChallenges(userId: string): boolean {
    return this.getActiveChallenges(userId).some(
      challenge => challenge.status === 'pending'
    );
  }

  /**
   * Disconnect from Socket.IO
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
  }

  /**
   * Check connection status
   */
  public isConnected(): boolean {
    return this.connected;
  }
}

// Export singleton instance
export const territoryGameplayService = new TerritoryGameplayService(); 
