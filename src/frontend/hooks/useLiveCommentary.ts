import {
  LiveCommentaryEvent,
  websocketService,
} from '@/services/services/network/WebSocketService';
import { useCallback, useEffect, useState } from 'react';

interface UseLiveCommentaryProps {
  gameId: string;
  isActive?: boolean;
}

interface CommentaryEntry {
  id: string;
  text: string;
  timestamp: number;
  style?: string;
  isNew: boolean;
}

export const useLiveCommentary = ({
  gameId,
  isActive = true,
}: UseLiveCommentaryProps) => {
  const [commentaryEntries, setCommentaryEntries] = useState<CommentaryEntry[]>(
    []
  );
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCommentaryEntry = useCallback(
    (commentary: LiveCommentaryEvent['data'] | string) => {
      // Handle both string and object formats from backend
      const commentaryText =
        typeof commentary === 'string' ? commentary : commentary.commentary;
      const commentaryStyle =
        typeof commentary === 'string' ? 'professional' : commentary.style;
      const commentaryTimestamp =
        typeof commentary === 'string' ? Date.now() : commentary.timestamp;

      const newEntry: CommentaryEntry = {
        id: `commentary-${Date.now()}-${Math.random()}`,
        text: commentaryText,
        timestamp: commentaryTimestamp,
        style: commentaryStyle,
        isNew: true,
      };

      setCommentaryEntries((prev) => {
        const updated = [newEntry, ...prev.slice(0, 19)]; // Keep last 20 entries
        return updated;
      });

      // Mark as not new after animation
      setTimeout(() => {
        setCommentaryEntries((prev) =>
          prev.map((entry) =>
            entry.id === newEntry.id ? { ...entry, isNew: false } : entry
          )
        );
      }, 3000);
    },
    []
  );

  const clearCommentary = useCallback(() => {
    setCommentaryEntries([]);
    setError(null);
  }, []);

  // Connect to WebSocket and subscribe to commentary
  useEffect(() => {
    if (!isActive || !gameId) {
      setIsConnected(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const connectToCommentary = async () => {
      try {
        // Ensure WebSocket is connected
        if (!websocketService.getConnectionStatus()) {
          await websocketService.connect();
        }

        // Join the match room for commentary
        websocketService.joinGameRoom(gameId);

        // Subscribe to live commentary events
        unsubscribe = websocketService.subscribeToLiveCommentary(
          gameId,
          (commentary) => {
            addCommentaryEntry(commentary);
          }
        );

        setIsConnected(true);
        setError(null);
      } catch (err) {
        console.error('Failed to connect to commentary service:', err);
        setError('Failed to connect to commentary service');
        setIsConnected(false);
      }
    };

    connectToCommentary();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      websocketService.leaveGameRoom(gameId);
      setIsConnected(false);
    };
  }, [gameId, isActive, addCommentaryEntry]);

  // Handle WebSocket connection status changes
  useEffect(() => {
    const handleConnectionChange = () => {
      const connected = websocketService.getConnectionStatus();
      setIsConnected(connected);

      if (!connected) {
        setError('Commentary connection lost');
      } else {
        setError(null);
      }
    };

    // Initial check
    handleConnectionChange();

    // Listen for connection changes
    const unsubscribe = websocketService.subscribe(
      'connect',
      handleConnectionChange
    );
    const unsubscribeDisconnect = websocketService.subscribe(
      'disconnect',
      handleConnectionChange
    );

    return () => {
      unsubscribe();
      unsubscribeDisconnect();
    };
  }, []);

  return {
    commentaryEntries,
    isConnected,
    error,
    loading: false, // Remove loading state as it's not needed
    connectToMatch: () => {
      if (gameId) {
        websocketService.joinGameRoom(gameId);
      }
    },
    clearCommentary,
  };
};
