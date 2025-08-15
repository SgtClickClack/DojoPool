import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "./useWebSocket";

interface GameState {
  id: string;
  status: string;
  currentPlayer: string;
  players: Array<{ id: string; name: string; score: number }>;
  ballPositions: Record<string, { x: number; y: number }>;
  lastShot?: {
    ballId: string;
    success: boolean;
    type: string;
    timestamp: number;
  };
  fouls: Record<string, any[]>;
  winner?: string;
}

interface ShotData {
  ballId: string;
  velocity: number;
  direction: { x: number; y: number };
  targetPocket?: { x: number; y: number };
}

export const useGameSocket = (gameId: string) => {
  const { socket, connected } = useWebSocket();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Join game room when connected
  useEffect(() => {
    if (socket && connected && gameId) {
      socket.emit("join_game", { game_id: gameId });
      socket.emit("request_game_state", { game_id: gameId });
    }
  }, [socket, connected, gameId]);

  // Set up game event listeners
  useEffect(() => {
    if (!socket) return;

    const handleGameState = (data: { game: GameState }) => {
      setGameState(data.game);
      setLoading(false);
      setError(null);
    };

    const handleGameUpdate = (data: { type: string; data: any; game: GameState }) => {
      setGameState(data.game);
    };

    const handleShotResult = (data: any) => {
      if (gameState) {
        setGameState(prev => prev ? {
          ...prev,
          lastShot: {
            ballId: data.ball_id,
            success: data.success,
            type: data.type,
            timestamp: Date.now()
          }
        } : null);
      }
    };

    const handleError = (data: { message: string }) => {
      setError(data.message);
      setLoading(false);
    };

    // Register event listeners
    socket.on("game_state", handleGameState);
    socket.on("game_update", handleGameUpdate);
    socket.on("shot_result", handleShotResult);
    socket.on("error", handleError);

    return () => {
      socket.off("game_state", handleGameState);
      socket.off("game_update", handleGameUpdate);
      socket.off("shot_result", handleShotResult);
      socket.off("error", handleError);
    };
  }, [socket, gameState]);

  // Game actions
  const takeShot = useCallback((shotData: ShotData) => {
    if (socket && gameId) {
      socket.emit("game_action", {
        game_id: gameId,
        action_type: "shot",
        action_data: shotData
      });
    }
  }, [socket, gameId]);

  const reportFoul = useCallback((foulData: { type: string; reason?: string }) => {
    if (socket && gameId) {
      socket.emit("game_action", {
        game_id: gameId,
        action_type: "foul",
        action_data: foulData
      });
    }
  }, [socket, gameId]);

  const leaveGame = useCallback(() => {
    if (socket && gameId) {
      socket.emit("leave_game", { game_id: gameId });
    }
  }, [socket, gameId]);

  return {
    gameState,
    loading,
    error,
    connected,
    takeShot,
    reportFoul,
    leaveGame
  };
}; 