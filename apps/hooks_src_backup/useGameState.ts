import { useCallback, useEffect, useState } from 'react';
import { io, type Socket, ManagerOptions } from 'socket.io-client';
import {
  type GameState,
  type Shot,
  type Foul,
  GameStatus,
} from '../types/game';

interface UseGameStateProps {
  gameId: string;
  playerId: string;
}

interface GameStateResponse {
  gameState: GameState;
  error?: string;
}

export const useGameState = ({ gameId, playerId }: UseGameStateProps) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const socketOptions = {
      transports: ['websocket'],
      autoConnect: true,
      query: {
        gameId,
        playerId,
      },
    };

    const newSocket = io(
      process.env.NEXT_PUBLIC_WS_URL || '/socket.io',
      socketOptions
    );

    newSocket.on('connect', () => {
      console.log('Connected to game socket');
    });

    newSocket.on('gameStateUpdate', (data: GameStateResponse) => {
      if (data.error) {
        setError(data.error);
      } else {
        setGameState(data.gameState);
      }
    });

    newSocket.on('error', (err: Error) => {
      setError(err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [gameId, playerId]);

  // Fetch initial game state
  useEffect(() => {
    const fetchGameState = async () => {
      try {
        const response = await fetch(`/api/matches/${gameId}/state`);
        const data: GameStateResponse = await response.json();

        if (data.error) {
          setError(data.error);
        } else {
          setGameState(data.gameState);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch game state'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchGameState();
  }, [gameId]);

  const takeShot = useCallback(
    async (shot: Shot) => {
      try {
        const response = await fetch(`/api/matches/${gameId}/shot`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(shot),
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to record shot');
        throw err;
      }
    },
    [gameId]
  );

  const reportFoul = useCallback(
    async (foul: Foul) => {
      try {
        const response = await fetch(`/api/matches/${gameId}/foul`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(foul),
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to report foul');
        throw err;
      }
    },
    [gameId]
  );

  const pauseGame = useCallback(async () => {
    try {
      const response = await fetch(`/api/matches/${gameId}/pause`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause game');
      throw err;
    }
  }, [gameId]);

  const resumeGame = useCallback(async () => {
    try {
      const response = await fetch(`/api/matches/${gameId}/resume`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume game');
      throw err;
    }
  }, [gameId]);

  const cancelGame = useCallback(async () => {
    try {
      const response = await fetch(`/api/matches/${gameId}/cancel`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel game');
      throw err;
    }
  }, [gameId]);

  return {
    gameState,
    loading,
    error,
    takeShot,
    reportFoul,
    pauseGame,
    resumeGame,
    cancelGame,
    isMyTurn: gameState?.currentPlayer === playerId,
    canTakeShot:
      gameState?.gameStatus === GameStatus.ACTIVE &&
      gameState?.currentPlayer === playerId,
  };
};
