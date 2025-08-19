import { useEffect, useState, useCallback } from 'react';
import {
  territoryGameplayService,
  type TerritoryChallenge,
  type TerritoryOwnershipUpdate,
  type MatchResult,
} from '../services/territory/TerritoryGameplayService';

export interface UseTerritoryGameplayReturn {
  // Connection state
  isConnected: boolean;

  // Challenge management
  activeChallenges: TerritoryChallenge[];
  pendingChallenges: TerritoryChallenge[];
  hasPendingChallenges: boolean;

  // Actions
  createChallenge: (
    territoryId: string,
    challengerId: string,
    defenderId: string,
    challengeType?: 'standard' | 'high-stakes' | 'clan-war',
    stakes?: { dojoCoins: number; nftRequirement?: string }
  ) => Promise<TerritoryChallenge>;

  acceptChallenge: (challengeId: string, defenderId: string) => Promise<void>;
  declineChallenge: (challengeId: string, defenderId: string) => Promise<void>;

  // Events
  onChallengeCreated: (
    callback: (challenge: TerritoryChallenge) => void
  ) => void;
  onChallengeUpdated: (
    callback: (challenge: TerritoryChallenge) => void
  ) => void;
  onChallengeAccepted: (
    callback: (challenge: TerritoryChallenge) => void
  ) => void;
  onChallengeDeclined: (
    callback: (challenge: TerritoryChallenge) => void
  ) => void;
  onChallengeCompleted: (
    callback: (challenge: TerritoryChallenge) => void
  ) => void;

  onTerritoryOwnershipUpdated: (
    callback: (update: TerritoryOwnershipUpdate) => void
  ) => void;
  onMatchResult: (callback: (result: MatchResult) => void) => void;
  onMatchResultProcessed: (callback: (result: MatchResult) => void) => void;

  // Utility
  getUserChallenges: (userId: string) => TerritoryChallenge[];
  disconnect: () => void;
}

export const useTerritoryGameplay = (
  userId?: string
): UseTerritoryGameplayReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [activeChallenges, setActiveChallenges] = useState<
    TerritoryChallenge[]
  >([]);
  const [pendingChallenges, setPendingChallenges] = useState<
    TerritoryChallenge[]
  >([]);

  // Initialize connection and event listeners
  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      console.log('Territory gameplay service connected');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('Territory gameplay service disconnected');
    };

    const handleChallengeCreated = (challenge: TerritoryChallenge) => {
      setActiveChallenges((prev) => [...prev, challenge]);
      if (challenge.status === 'pending') {
        setPendingChallenges((prev) => [...prev, challenge]);
      }
    };

    const handleChallengeUpdated = (challenge: TerritoryChallenge) => {
      setActiveChallenges((prev) =>
        prev.map((c) => (c.id === challenge.id ? challenge : c))
      );

      setPendingChallenges((prev) =>
        prev.map((c) => (c.id === challenge.id ? challenge : c))
      );
    };

    const handleChallengeAccepted = (challenge: TerritoryChallenge) => {
      setPendingChallenges((prev) => prev.filter((c) => c.id !== challenge.id));
    };

    const handleChallengeDeclined = (challenge: TerritoryChallenge) => {
      setActiveChallenges((prev) => prev.filter((c) => c.id !== challenge.id));
      setPendingChallenges((prev) => prev.filter((c) => c.id !== challenge.id));
    };

    const handleChallengeCompleted = (challenge: TerritoryChallenge) => {
      setActiveChallenges((prev) => prev.filter((c) => c.id !== challenge.id));
    };

    // Set up event listeners
    territoryGameplayService.on('connected', handleConnect);
    territoryGameplayService.on('disconnected', handleDisconnect);
    territoryGameplayService.on('challengeCreated', handleChallengeCreated);
    territoryGameplayService.on('challengeUpdated', handleChallengeUpdated);
    territoryGameplayService.on('challengeAccepted', handleChallengeAccepted);
    territoryGameplayService.on('challengeDeclined', handleChallengeDeclined);
    territoryGameplayService.on('challengeCompleted', handleChallengeCompleted);

    // Set initial connection state
    setIsConnected(territoryGameplayService.isConnected());

    // Set initial challenges
    setActiveChallenges(territoryGameplayService.getAllActiveChallenges());
    setPendingChallenges(
      territoryGameplayService
        .getAllActiveChallenges()
        .filter((c) => c.status === 'pending')
    );

    // Cleanup event listeners
    return () => {
      territoryGameplayService.off('connected', handleConnect);
      territoryGameplayService.off('disconnected', handleDisconnect);
      territoryGameplayService.off('challengeCreated', handleChallengeCreated);
      territoryGameplayService.off('challengeUpdated', handleChallengeUpdated);
      territoryGameplayService.off(
        'challengeAccepted',
        handleChallengeAccepted
      );
      territoryGameplayService.off(
        'challengeDeclined',
        handleChallengeDeclined
      );
      territoryGameplayService.off(
        'challengeCompleted',
        handleChallengeCompleted
      );
    };
  }, []);

  // Update challenges when userId changes
  useEffect(() => {
    if (userId) {
      setActiveChallenges(territoryGameplayService.getActiveChallenges(userId));
      setPendingChallenges(
        territoryGameplayService
          .getActiveChallenges(userId)
          .filter((c) => c.status === 'pending')
      );
    }
  }, [userId]);

  // Challenge actions
  const createChallenge = useCallback(
    async (
      territoryId: string,
      challengerId: string,
      defenderId: string,
      challengeType: 'standard' | 'high-stakes' | 'clan-war' = 'standard',
      stakes?: { dojoCoins: number; nftRequirement?: string }
    ) => {
      return await territoryGameplayService.createChallenge(
        territoryId,
        challengerId,
        defenderId,
        challengeType,
        stakes
      );
    },
    []
  );

  const acceptChallenge = useCallback(
    async (challengeId: string, defenderId: string) => {
      await territoryGameplayService.acceptChallenge(challengeId, defenderId);
    },
    []
  );

  const declineChallenge = useCallback(
    async (challengeId: string, defenderId: string) => {
      await territoryGameplayService.declineChallenge(challengeId, defenderId);
    },
    []
  );

  // Event registration functions
  const onChallengeCreated = useCallback(
    (callback: (challenge: TerritoryChallenge) => void) => {
      territoryGameplayService.on('challengeCreated', callback);
    },
    []
  );

  const onChallengeUpdated = useCallback(
    (callback: (challenge: TerritoryChallenge) => void) => {
      territoryGameplayService.on('challengeUpdated', callback);
    },
    []
  );

  const onChallengeAccepted = useCallback(
    (callback: (challenge: TerritoryChallenge) => void) => {
      territoryGameplayService.on('challengeAccepted', callback);
    },
    []
  );

  const onChallengeDeclined = useCallback(
    (callback: (challenge: TerritoryChallenge) => void) => {
      territoryGameplayService.on('challengeDeclined', callback);
    },
    []
  );

  const onChallengeCompleted = useCallback(
    (callback: (challenge: TerritoryChallenge) => void) => {
      territoryGameplayService.on('challengeCompleted', callback);
    },
    []
  );

  const onTerritoryOwnershipUpdated = useCallback(
    (callback: (update: TerritoryOwnershipUpdate) => void) => {
      territoryGameplayService.on('territoryOwnershipUpdated', callback);
    },
    []
  );

  const onMatchResult = useCallback(
    (callback: (result: MatchResult) => void) => {
      territoryGameplayService.on('matchResult', callback);
    },
    []
  );

  const onMatchResultProcessed = useCallback(
    (callback: (result: MatchResult) => void) => {
      territoryGameplayService.on('matchResultProcessed', callback);
    },
    []
  );

  // Utility functions
  const getUserChallenges = useCallback((userId: string) => {
    return territoryGameplayService.getActiveChallenges(userId);
  }, []);

  const disconnect = useCallback(() => {
    territoryGameplayService.disconnect();
  }, []);

  const hasPendingChallenges = useCallback(() => {
    if (!userId) return false;
    return territoryGameplayService.hasPendingChallenges(userId);
  }, [userId]);

  return {
    isConnected,
    activeChallenges,
    pendingChallenges,
    hasPendingChallenges: hasPendingChallenges(),
    createChallenge,
    acceptChallenge,
    declineChallenge,
    onChallengeCreated,
    onChallengeUpdated,
    onChallengeAccepted,
    onChallengeDeclined,
    onChallengeCompleted,
    onTerritoryOwnershipUpdated,
    onMatchResult,
    onMatchResultProcessed,
    getUserChallenges,
    disconnect,
  };
};
