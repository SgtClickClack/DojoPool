import { useCallback, useEffect, useState } from 'react';
import { websocketService } from '../../apps/web/src/services/services/network/WebSocketService';

export interface CommentaryMessage {
  id: string;
  message: string;
  timestamp: Date;
  type: 'shot' | 'foul' | 'achievement' | 'general';
}

export const useLiveCommentary = (matchId: string, playerId?: string) => {
  const [commentary, setCommentary] = useState<CommentaryMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Connect to match room
  const connectToMatch = useCallback(async () => {
    if (!matchId) return;

    try {
      setLoading(true);
      setError(null);

      await websocketService.connectToMatch(matchId);
      setIsConnected(true);

      // Subscribe to live commentary events
      const unsubscribe = websocketService.subscribe(
        'live_commentary',
        (data) => {
          const message =
            typeof data === 'string' ? data : data.message || data;

          if (message) {
            const newCommentary: CommentaryMessage = {
              id: Date.now().toString(),
              message,
              timestamp: new Date(),
              type: 'shot', // Default type, could be enhanced with AI analysis
            };

            setCommentary((prev) => [...prev, newCommentary]);
          }
        }
      );

      // Subscribe to shot errors
      const errorUnsubscribe = websocketService.subscribe(
        'shot_error',
        (error) => {
          setError(error);
          console.error('Shot error:', error);
        }
      );

      // Store unsubscribe functions for cleanup
      return () => {
        unsubscribe();
        errorUnsubscribe();
      };
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to match'
      );
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  // Disconnect from match
  const disconnectFromMatch = useCallback(() => {
    websocketService.leaveMatchRoom(matchId);
    websocketService.disconnect();
    setIsConnected(false);
    setCommentary([]);
  }, [matchId]);

  // Emit shot taken event
  const emitShotTaken = useCallback(
    (shotData: {
      ballSunk: boolean;
      wasFoul: boolean;
      shotType?: string;
      playerName?: string;
    }) => {
      if (!playerId) {
        console.warn('Player ID not available for shot reporting');
        return;
      }

      const shotPayload = {
        matchId,
        playerId,
        ballSunk: shotData.ballSunk,
        wasFoul: shotData.wasFoul,
        playerName: shotData.playerName,
        shotType: shotData.shotType || 'successful_pot',
      };

      websocketService.emitShotTaken(shotPayload);
    },
    [matchId, playerId]
  );

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const setup = async () => {
      cleanup = await connectToMatch();
    };

    setup();

    return () => {
      if (cleanup) cleanup();
      disconnectFromMatch();
    };
  }, [connectToMatch, disconnectFromMatch]);

  return {
    commentary,
    isConnected,
    error,
    loading,
    emitShotTaken,
    connectToMatch,
    disconnectFromMatch,
  };
};
