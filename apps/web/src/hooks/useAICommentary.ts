import { useEffect, useState, useCallback, useRef } from 'react';
import {
  realTimeAICommentaryService,
  type AICommentaryEvent,
  type PoolGod,
} from '../services/ai/RealTimeAICommentaryService';

export interface UseAICommentaryReturn {
  // Connection state
  isConnected: boolean;

  // Commentary data
  events: AICommentaryEvent[];
  currentMatchEvents: AICommentaryEvent[];
  poolGods: PoolGod[];

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions
  joinMatch: (matchId: string) => void;
  leaveMatch: (matchId: string) => void;
  addReaction: (eventId: string, reaction: any) => Promise<void>;

  // Events
  onCommentaryGenerated: (callback: (event: AICommentaryEvent) => void) => void;
  onConnected: (callback: () => void) => void;
  onDisconnected: (callback: () => void) => void;
}

export const useAICommentary = (matchId?: string): UseAICommentaryReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<AICommentaryEvent[]>([]);
  const [currentMatchEvents, setCurrentMatchEvents] = useState<
    AICommentaryEvent[]
  >([]);
  const [poolGods, setPoolGods] = useState<PoolGod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentMatchId = useRef<string | undefined>(matchId);
  const listeners = useRef<Map<string, Function[]>>(new Map());

  // Initialize service connection
  useEffect(() => {
    const handleConnected = () => {
      setIsConnected(true);
      setError(null);
      setPoolGods(realTimeAICommentaryService.getPoolGods());
      setEvents(realTimeAICommentaryService.getEvents());
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setError('AI Commentary service disconnected');
    };

    const handleCommentaryGenerated = (event: AICommentaryEvent) => {
      setEvents((prev) => [event, ...prev]);
      if (event.matchId === currentMatchId.current) {
        setCurrentMatchEvents((prev) => [event, ...prev]);
      }
    };

    // Set up event listeners
    realTimeAICommentaryService.on('connected', handleConnected);
    realTimeAICommentaryService.on('disconnected', handleDisconnected);
    realTimeAICommentaryService.on(
      'commentaryGenerated',
      handleCommentaryGenerated
    );

    // Initialize connection state
    setIsConnected(realTimeAICommentaryService.getConnectionStatus());
    setPoolGods(realTimeAICommentaryService.getPoolGods());
    setEvents(realTimeAICommentaryService.getEvents());

    return () => {
      realTimeAICommentaryService.off('connected', handleConnected);
      realTimeAICommentaryService.off('disconnected', handleDisconnected);
      realTimeAICommentaryService.off(
        'commentaryGenerated',
        handleCommentaryGenerated
      );
    };
  }, []);

  // Update current match events when matchId changes
  useEffect(() => {
    currentMatchId.current = matchId;
    if (matchId) {
      const matchEvents = realTimeAICommentaryService.getEventsByMatch(matchId);
      setCurrentMatchEvents(matchEvents);
    } else {
      setCurrentMatchEvents([]);
    }
  }, [matchId]);

  const joinMatch = useCallback((newMatchId: string) => {
    currentMatchId.current = newMatchId;
    const matchEvents =
      realTimeAICommentaryService.getEventsByMatch(newMatchId);
    setCurrentMatchEvents(matchEvents);
  }, []);

  const leaveMatch = useCallback(() => {
    currentMatchId.current = undefined;
    setCurrentMatchEvents([]);
  }, []);

  const addReaction = useCallback(async (eventId: string, reaction: any) => {
    try {
      setIsLoading(true);
      // This would call the service method to add reaction
      // For now, we'll simulate it
      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId
            ? { ...event, reactions: [...event.reactions, reaction] }
            : event
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reaction');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Event registration functions
  const onCommentaryGenerated = useCallback(
    (callback: (event: AICommentaryEvent) => void) => {
      if (!listeners.current.has('commentaryGenerated')) {
        listeners.current.set('commentaryGenerated', []);
      }
      listeners.current.get('commentaryGenerated')!.push(callback);
    },
    []
  );

  const onConnected = useCallback((callback: () => void) => {
    if (!listeners.current.has('connected')) {
      listeners.current.set('connected', []);
    }
    listeners.current.get('connected')!.push(callback);
  }, []);

  const onDisconnected = useCallback((callback: () => void) => {
    if (!listeners.current.has('disconnected')) {
      listeners.current.set('disconnected', []);
    }
    listeners.current.get('disconnected')!.push(callback);
  }, []);

  return {
    isConnected,
    events,
    currentMatchEvents,
    poolGods,
    isLoading,
    error,
    joinMatch,
    leaveMatch,
    addReaction,
    onCommentaryGenerated,
    onConnected,
    onDisconnected,
  };
};
