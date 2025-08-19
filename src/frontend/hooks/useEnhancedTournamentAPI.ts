import { useCallback, useEffect, useRef, useState } from 'react';
import {
  tournamentRealTimeService,
  type MatchUpdate,
  type TournamentUpdate,
} from '../services/TournamentRealTimeService';
import { type Tournament } from '../types/tournament';
import {
  useTournamentAPI,
  type TournamentAPIActions,
  type TournamentAPIState,
} from './useTournamentAPI';

export interface EnhancedTournamentState extends TournamentAPIState {
  realTimeConnected: boolean;
  lastUpdate: Date | null;
  pendingUpdates: (TournamentUpdate | MatchUpdate)[];
}

export interface EnhancedTournamentActions extends TournamentAPIActions {
  // Real-time operations
  connectRealTime: () => Promise<void>;
  disconnectRealTime: () => void;
  subscribeToTournamentUpdates: (tournamentId: string) => () => void;
  subscribeToMatchUpdates: (matchId: string) => () => void;

  // Enhanced operations with real-time updates
  updateMatchWithRealTime: (
    matchId: string,
    scoreA: number,
    scoreB: number,
    winnerId: string
  ) => Promise<any>;
  startTournamentWithRealTime: (tournamentId: string) => Promise<Tournament>;

  // Real-time status
  getRealTimeStatus: () => { isConnected: boolean; listenerCount: number };
}

export const useEnhancedTournamentAPI = (): EnhancedTournamentState &
  EnhancedTournamentActions => {
  const baseAPI = useTournamentAPI();
  const [realTimeState, setRealTimeState] = useState({
    realTimeConnected: false,
    lastUpdate: null as Date | null,
    pendingUpdates: [] as (TournamentUpdate | MatchUpdate)[],
  });

  const realTimeSubscriptions = useRef<Map<string, () => void>>(new Map());

  // Connect to real-time service
  const connectRealTime = useCallback(async (): Promise<void> => {
    try {
      await tournamentRealTimeService.connect();
      setRealTimeState((prev) => ({ ...prev, realTimeConnected: true }));
    } catch (error) {
      console.error('Failed to connect to real-time service:', error);
      setRealTimeState((prev) => ({ ...prev, realTimeConnected: false }));
    }
  }, []);

  // Disconnect from real-time service
  const disconnectRealTime = useCallback((): void => {
    // Clean up all subscriptions
    realTimeSubscriptions.current.forEach((unsubscribe) => unsubscribe());
    realTimeSubscriptions.current.clear();

    tournamentRealTimeService.disconnect();
    setRealTimeState((prev) => ({
      ...prev,
      realTimeConnected: false,
      pendingUpdates: [],
      lastUpdate: null,
    }));
  }, []);

  // Subscribe to tournament updates
  const subscribeToTournamentUpdates = useCallback(
    (tournamentId: string): (() => void) => {
      if (!realTimeState.realTimeConnected) {
        console.warn('Real-time service not connected');
        return () => {};
      }

      const unsubscribe = tournamentRealTimeService.subscribeToTournament(
        tournamentId,
        (update: TournamentUpdate) => {
          setRealTimeState((prev) => ({
            ...prev,
            lastUpdate: new Date(),
            pendingUpdates: [...prev.pendingUpdates, update],
          }));

          // Handle different update types
          switch (update.type) {
            case 'tournament_updated':
              // Refresh tournament data
              baseAPI.loadTournament(tournamentId);
              break;
            case 'player_registered':
            case 'player_unregistered':
              // Refresh tournament data to get updated participant list
              baseAPI.loadTournament(tournamentId);
              break;
            case 'tournament_started':
              // Refresh tournament and matches
              baseAPI.loadTournament(tournamentId);
              baseAPI.loadMatches(tournamentId);
              break;
            case 'match_updated':
            case 'match_completed':
              // Refresh matches
              baseAPI.loadMatches(tournamentId);
              break;
          }
        }
      );

      // Store subscription for cleanup
      realTimeSubscriptions.current.set(
        `tournament:${tournamentId}`,
        unsubscribe
      );

      return unsubscribe;
    },
    [realTimeState.realTimeConnected, baseAPI]
  );

  // Subscribe to match updates
  const subscribeToMatchUpdates = useCallback(
    (matchId: string): (() => void) => {
      if (!realTimeState.realTimeConnected) {
        console.warn('Real-time service not connected');
        return () => {};
      }

      const unsubscribe = tournamentRealTimeService.subscribeToMatch(
        matchId,
        (update: MatchUpdate) => {
          setRealTimeState((prev) => ({
            ...prev,
            lastUpdate: new Date(),
            pendingUpdates: [...prev.pendingUpdates, update],
          }));

          // Refresh matches for the tournament
          if (baseAPI.currentTournament) {
            baseAPI.loadMatches(baseAPI.currentTournament.id);
          }
        }
      );

      // Store subscription for cleanup
      realTimeSubscriptions.current.set(`match:${matchId}`, unsubscribe);

      return unsubscribe;
    },
    [realTimeState.realTimeConnected, baseAPI]
  );

  // Enhanced match update with real-time
  const updateMatchWithRealTime = useCallback(
    async (
      matchId: string,
      scoreA: number,
      scoreB: number,
      winnerId: string
    ): Promise<any> => {
      try {
        // Update via API
        const result = await baseAPI.updateMatchResult(
          matchId,
          scoreA,
          scoreB,
          winnerId
        );

        // Emit real-time update
        if (realTimeState.realTimeConnected) {
          tournamentRealTimeService.emitMatchResult(matchId, {
            scoreA,
            scoreB,
            winnerId,
          });
        }

        return result;
      } catch (error) {
        console.error('Failed to update match with real-time:', error);
        throw error;
      }
    },
    [baseAPI, realTimeState.realTimeConnected]
  );

  // Enhanced tournament start with real-time
  const startTournamentWithRealTime = useCallback(
    async (tournamentId: string): Promise<Tournament> => {
      try {
        // Start tournament via API
        const tournament = await baseAPI.startTournament(tournamentId);

        // Emit real-time update
        if (realTimeState.realTimeConnected) {
          tournamentRealTimeService.emitTournamentAction('tournament_started', {
            tournamentId,
          });
        }

        return tournament;
      } catch (error) {
        console.error('Failed to start tournament with real-time:', error);
        throw error;
      }
    },
    [baseAPI, realTimeState.realTimeConnected]
  );

  // Get real-time connection status
  const getRealTimeStatus = useCallback(() => {
    return tournamentRealTimeService.getConnectionStats();
  }, []);

  // Auto-connect to real-time service when component mounts
  useEffect(() => {
    connectRealTime();

    return () => {
      disconnectRealTime();
    };
  }, [connectRealTime, disconnectRealTime]);

  // Process pending updates
  useEffect(() => {
    if (realTimeState.pendingUpdates.length > 0) {
      // Process updates and clear them
      setRealTimeState((prev) => ({
        ...prev,
        pendingUpdates: [],
      }));
    }
  }, [realTimeState.pendingUpdates]);

  // Auto-subscribe to current tournament updates
  useEffect(() => {
    if (baseAPI.currentTournament && realTimeState.realTimeConnected) {
      const unsubscribe = subscribeToTournamentUpdates(
        baseAPI.currentTournament.id
      );

      return () => {
        unsubscribe();
        realTimeSubscriptions.current.delete(
          `tournament:${baseAPI.currentTournament.id}`
        );
      };
    }
  }, [
    baseAPI.currentTournament?.id,
    realTimeState.realTimeConnected,
    subscribeToTournamentUpdates,
  ]);

  // Auto-subscribe to current tournament matches
  useEffect(() => {
    if (
      baseAPI.currentTournament &&
      realTimeState.realTimeConnected &&
      baseAPI.matches.length > 0
    ) {
      const subscriptions: (() => void)[] = [];

      baseAPI.matches.forEach((match) => {
        const unsubscribe = subscribeToMatchUpdates(match.id);
        subscriptions.push(unsubscribe);
      });

      return () => {
        subscriptions.forEach((unsubscribe) => unsubscribe());
        baseAPI.matches.forEach((match) => {
          realTimeSubscriptions.current.delete(`match:${match.id}`);
        });
      };
    }
  }, [
    baseAPI.currentTournament?.id,
    baseAPI.matches,
    realTimeState.realTimeConnected,
    subscribeToMatchUpdates,
  ]);

  return {
    ...baseAPI,
    ...realTimeState,
    connectRealTime,
    disconnectRealTime,
    subscribeToTournamentUpdates,
    subscribeToMatchUpdates,
    updateMatchWithRealTime,
    startTournamentWithRealTime,
    getRealTimeStatus,
  };
};
