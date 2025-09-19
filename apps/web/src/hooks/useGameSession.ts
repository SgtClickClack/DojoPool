import { apiClient } from '@/services/APIService';
import {
  type GameSession,
  type GameSessionUpdateDto,
  type ShotData,
} from '@/types/gameSession';
import { useCallback, useEffect, useState } from 'react';

interface UseGameSessionReturn {
  gameSession: GameSession | null;
  loading: boolean;
  error: string | null;
  updateSession: (updateDto: GameSessionUpdateDto) => Promise<void>;
  recordShot: (shotData: ShotData) => Promise<void>;
  recordFoul: (
    playerId: string,
    foulType: string,
    reason: string
  ) => Promise<void>;
  endSession: (winnerId: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const useGameSession = (sessionId: string): UseGameSessionReturn => {
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<GameSession>(
        `/game-sessions/${sessionId}`
      );
      setGameSession(response.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch game session';
      setError(errorMessage);
      console.error('Error fetching game session:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const updateSession = useCallback(
    async (updateDto: GameSessionUpdateDto) => {
      try {
        setError(null);

        const response = await apiClient.put<GameSession>(
          `/game-sessions/${sessionId}`,
          updateDto
        );
        setGameSession(response.data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update game session';
        setError(errorMessage);
        console.error('Error updating game session:', err);
        throw err;
      }
    },
    [sessionId]
  );

  const recordShot = useCallback(
    async (shotData: ShotData) => {
      try {
        setError(null);

        const response = await apiClient.post<GameSession>(
          `/game-sessions/${sessionId}/shot`,
          shotData
        );
        setGameSession(response.data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to record shot';
        setError(errorMessage);
        console.error('Error recording shot:', err);
        throw err;
      }
    },
    [sessionId]
  );

  const recordFoul = useCallback(
    async (playerId: string, foulType: string, reason: string) => {
      try {
        setError(null);

        const response = await apiClient.post<GameSession>(
          `/game-sessions/${sessionId}/foul`,
          {
            playerId,
            foulType,
            reason,
          }
        );
        setGameSession(response.data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to record foul';
        setError(errorMessage);
        console.error('Error recording foul:', err);
        throw err;
      }
    },
    [sessionId]
  );

  const endSession = useCallback(
    async (winnerId: string) => {
      try {
        setError(null);

        const response = await apiClient.post<GameSession>(
          `/game-sessions/${sessionId}/end`,
          {
            winnerId,
          }
        );
        setGameSession(response.data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to end game session';
        setError(errorMessage);
        console.error('Error ending game session:', err);
        throw err;
      }
    },
    [sessionId]
  );

  const refreshSession = useCallback(async () => {
    await fetchSession();
  }, [fetchSession]);

  // Initial fetch
  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId, fetchSession]);

  // Set up polling for active sessions
  useEffect(() => {
    if (!gameSession || gameSession.status !== 'ACTIVE') return;

    const interval = setInterval(() => {
      fetchSession();
    }, 5000); // Poll every 5 seconds for active sessions

    return () => clearInterval(interval);
  }, [gameSession, fetchSession]);

  return {
    gameSession,
    loading,
    error,
    updateSession,
    recordShot,
    recordFoul,
    endSession,
    refreshSession,
  };
};
