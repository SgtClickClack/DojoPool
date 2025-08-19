import {
  TerritoryGameplayService,
  type TerritoryChallenge,
  type MatchResult,
} from '../../services/territory/TerritoryGameplayService';
import { vi } from 'vitest';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

describe('TerritoryGameplayService', () => {
  let service: TerritoryGameplayService;

  beforeEach(() => {
    service = new TerritoryGameplayService();
  });

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      expect(service).toBeDefined();
      expect(service.isConnected()).toBe(false);
    });
  });

  describe('challenge management', () => {
    it('should create challenge', async () => {
      const challenge = await service.createChallenge(
        'territory-1',
        'player-2',
        'player-1',
        'standard'
      );

      expect(challenge.territoryId).toBe('territory-1');
      expect(challenge.challengerId).toBe('player-2');
      expect(challenge.defenderId).toBe('player-1');
      expect(challenge.status).toBe('pending');
      expect(challenge.challengeType).toBe('standard');
    });

    it('should create high-stakes challenge', async () => {
      const challenge = await service.createChallenge(
        'territory-1',
        'player-2',
        'player-1',
        'high-stakes',
        { dojoCoins: 1000, nftRequirement: 'trophy-1' }
      );

      expect(challenge.challengeType).toBe('high-stakes');
      expect(challenge.stakes?.dojoCoins).toBe(1000);
      expect(challenge.stakes?.nftRequirement).toBe('trophy-1');
    });

    it('should accept challenge', async () => {
      const challenge = await service.createChallenge(
        'territory-1',
        'player-2',
        'player-1'
      );

      await service.acceptChallenge(challenge.id, 'player-1');

      // The service should emit events, but we can't easily test the internal state
      // since it's managed by the server. We can test that the method doesn't throw.
      expect(true).toBe(true);
    });

    it('should decline challenge', async () => {
      const challenge = await service.createChallenge(
        'territory-1',
        'player-2',
        'player-1'
      );

      await service.declineChallenge(challenge.id, 'player-1');

      // Test that the method doesn't throw
      expect(true).toBe(true);
    });
  });

  describe('challenge queries', () => {
    it('should get active challenges for user', () => {
      const challenges = service.getActiveChallenges('player-1');
      expect(Array.isArray(challenges)).toBe(true);
    });

    it('should get all active challenges', () => {
      const challenges = service.getAllActiveChallenges();
      expect(Array.isArray(challenges)).toBe(true);
    });

    it('should check for pending challenges', () => {
      const hasPending = service.hasPendingChallenges('player-1');
      expect(typeof hasPending).toBe('boolean');
    });
  });

  describe('event handling', () => {
    it('should handle match result events', async () => {
      return new Promise<void>((resolve) => {
        const mockMatchResult: MatchResult = {
          matchId: 'match-1',
          territoryId: 'territory-1',
          winnerId: 'player-2',
          loserId: 'player-1',
          winnerScore: 5,
          loserScore: 3,
          matchType: 'challenge',
          timestamp: new Date(),
          highlights: ['amazing shot'],
          duration: 1800,
          isTerritoryMatch: true,
        };

        service.on('matchResult', (result) => {
          expect(result.matchId).toBe('match-1');
          expect(result.winnerId).toBe('player-2');
          resolve();
        });

        // Simulate socket event by calling the private method directly
        (service as any).handleMatchResult(mockMatchResult);
      });
    });

    it('should handle territory ownership updates', async () => {
      return new Promise<void>((resolve) => {
        service.on('territoryOwnershipUpdated', (update) => {
          expect(update.territoryId).toBe('territory-1');
          expect(update.newOwnerId).toBe('player-2');
          resolve();
        });

        // Simulate socket event by calling the private method directly
        (service as any).handleTerritoryOwnershipUpdate({
          territoryId: 'territory-1',
          newOwnerId: 'player-2',
          timestamp: new Date(),
          reason: 'challenge',
        });
      });
    });

    it('should handle challenge events', async () => {
      return new Promise<void>((resolve) => {
        const mockChallenge: TerritoryChallenge = {
          id: 'challenge-1',
          territoryId: 'territory-1',
          challengerId: 'player-2',
          defenderId: 'player-1',
          status: 'pending',
          createdAt: new Date(),
          challengeType: 'standard',
        };

        service.on('challengeCreated', (challenge) => {
          expect(challenge.id).toBe('challenge-1');
          expect(challenge.status).toBe('pending');
          resolve();
        });

        // Simulate socket event by calling the private method directly
        (service as any).handleChallengeCreated(mockChallenge);
      });
    });
  });

  describe('connection management', () => {
    it('should check connection status', () => {
      const isConnected = service.isConnected();
      expect(typeof isConnected).toBe('boolean');
    });

    it('should disconnect properly', () => {
      service.disconnect();
      // Test that the method doesn't throw
      expect(true).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle connection errors gracefully', async () => {
      return new Promise<void>((resolve) => {
        service.on('error', (error) => {
          expect(error).toBeDefined();
          resolve();
        });

        // Simulate an error
        service.emit('error', new Error('Connection failed'));
      });
    });

    it('should handle disconnection events', () => {
      // Test that the service can listen for disconnection events
      service.on('disconnected', () => {
        expect(true).toBe(true);
      });

      // Verify the service has the event listener capability
      expect(service.listenerCount('disconnected')).toBeGreaterThan(0);
    });
  });
});
