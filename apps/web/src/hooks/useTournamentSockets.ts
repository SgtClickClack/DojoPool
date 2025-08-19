import { useCallback, useEffect, useRef, useState } from 'react';
import { Socket, io } from 'socket.io-client';
import { apiService } from '../services/ApiService';

// WebSocket Event Types
export interface TournamentUpdateEvent {
  tournamentId: string;
  updateType:
    | 'tournament_created'
    | 'tournament_updated'
    | 'tournament_deleted';
  data: any;
}

export interface ParticipantUpdateEvent {
  tournamentId: string;
  playerId: string;
  action: 'registered' | 'unregistered';
  data: any;
}

export interface MatchUpdateEvent {
  matchId: string;
  tournamentId: string;
  data: {
    scoreA: number;
    scoreB: number;
    winnerId: string;
    status: string;
  };
}

// Hook Configuration
interface UseTournamentSocketsConfig {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  onTournamentUpdate?: (event: TournamentUpdateEvent) => void;
  onParticipantUpdate?: (event: ParticipantUpdateEvent) => void;
  onMatchUpdate?: (event: MatchUpdateEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

// Hook Return Type
interface UseTournamentSocketsReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;

  // Connection methods
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;

  // Room management
  joinTournament: (tournamentId: string) => void;
  leaveTournament: (tournamentId: string) => void;
  joinMatch: (matchId: string) => void;
  leaveMatch: (matchId: string) => void;
  joinGlobalTournaments: () => void;
  leaveGlobalTournaments: () => void;

  // Emit methods
  emitTournamentAction: (action: string, data: any) => void;
  emitMatchResult: (matchId: string, result: any) => void;

  // Connection stats
  connectionStats: {
    reconnectAttempts: number;
    totalEvents: number;
    lastEventTime: Date | null;
  };
}

export const useTournamentSockets = (
  config: UseTournamentSocketsConfig = {}
): UseTournamentSocketsReturn => {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 3000,
    onTournamentUpdate,
    onParticipantUpdate,
    onMatchUpdate,
    onConnect,
    onDisconnect,
    onError,
  } = config;

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const eventCountRef = useRef(0);

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Get WebSocket URL from API service
  const getWebSocketURL = useCallback(() => {
    const baseURL = apiService.getBaseURL();
    return baseURL.replace('/api', '').replace('http', 'ws');
  }, []);

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const wsURL = getWebSocketURL();
    console.log('🔌 Initializing WebSocket connection to:', wsURL);

    socketRef.current = io(wsURL, {
      namespace: '/tournaments',
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true,
    });

    // Connection event handlers
    socketRef.current.on('connect', () => {
      console.log('✅ WebSocket connected successfully');
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
      reconnectAttemptsRef.current = 0;
      onConnect?.();
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
      setIsConnecting(false);
      onDisconnect?.();

      // Auto-reconnect logic
      if (
        reason === 'io server disconnect' ||
        reason === 'io client disconnect'
      ) {
        // Server initiated disconnect, don't auto-reconnect
        return;
      }

      if (reconnectAttemptsRef.current < reconnectAttempts) {
        console.log(
          `🔄 Attempting to reconnect (${
            reconnectAttemptsRef.current + 1
          }/${reconnectAttempts})...`
        );
        reconnectAttemptsRef.current++;

        reconnectTimeoutRef.current = setTimeout(() => {
          initializeSocket();
        }, reconnectDelay);
      } else {
        setConnectionError(
          `Failed to reconnect after ${reconnectAttempts} attempts`
        );
        onError?.(
          new Error(`Failed to reconnect after ${reconnectAttempts} attempts`)
        );
      }
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      setIsConnecting(false);
      setConnectionError(error.message);
      onError?.(error);
    });

    // Tournament event handlers
    socketRef.current.on(
      'tournament_updated',
      (event: TournamentUpdateEvent) => {
        console.log('🏆 Tournament update received:', event);
        eventCountRef.current++;
        onTournamentUpdate?.(event);
      }
    );

    socketRef.current.on(
      'participant_updated',
      (event: ParticipantUpdateEvent) => {
        console.log('👤 Participant update received:', event);
        eventCountRef.current++;
        onParticipantUpdate?.(event);
      }
    );

    socketRef.current.on('match_updated', (event: MatchUpdateEvent) => {
      console.log('🎯 Match update received:', event);
      eventCountRef.current++;
      onMatchUpdate?.(event);
    });

    // Error handling
    socketRef.current.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      setConnectionError(error.message);
      onError?.(error);
    });
  }, [
    getWebSocketURL,
    reconnectAttempts,
    reconnectDelay,
    onConnect,
    onDisconnect,
    onError,
    onTournamentUpdate,
    onParticipantUpdate,
    onMatchUpdate,
  ]);

  // Connect method
  const connect = useCallback(() => {
    if (isConnected || isConnecting) {
      console.log('🔄 Already connected or connecting...');
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);
    initializeSocket();
  }, [isConnected, isConnecting, initializeSocket]);

  // Disconnect method
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      console.log('🔌 Disconnecting WebSocket...');
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setConnectionError(null);
  }, []);

  // Reconnect method
  const reconnect = useCallback(() => {
    console.log('🔄 Manual reconnection requested...');
    disconnect();
    setTimeout(() => {
      connect();
    }, 1000);
  }, [connect, disconnect]);

  // Room management methods
  const joinTournament = useCallback(
    (tournamentId: string) => {
      if (socketRef.current && isConnected) {
        console.log(`🏆 Joining tournament room: ${tournamentId}`);
        socketRef.current.emit('join_tournament', { tournamentId });
      } else {
        console.warn('⚠️ Cannot join tournament: WebSocket not connected');
      }
    },
    [isConnected]
  );

  const leaveTournament = useCallback(
    (tournamentId: string) => {
      if (socketRef.current && isConnected) {
        console.log(`🏆 Leaving tournament room: ${tournamentId}`);
        socketRef.current.emit('leave_tournament', { tournamentId });
      }
    },
    [isConnected]
  );

  const joinMatch = useCallback(
    (matchId: string) => {
      if (socketRef.current && isConnected) {
        console.log(`🎯 Joining match room: ${matchId}`);
        socketRef.current.emit('join_match', { matchId });
      } else {
        console.warn('⚠️ Cannot join match: WebSocket not connected');
      }
    },
    [isConnected]
  );

  const leaveMatch = useCallback(
    (matchId: string) => {
      if (socketRef.current && isConnected) {
        console.log(`🎯 Leaving match room: ${matchId}`);
        socketRef.current.emit('leave_match', { matchId });
      }
    },
    [isConnected]
  );

  const joinGlobalTournaments = useCallback(() => {
    if (socketRef.current && isConnected) {
      console.log('🌍 Joining global tournaments room');
      socketRef.current.emit('join_global_tournaments');
    }
  }, [isConnected]);

  const leaveGlobalTournaments = useCallback(() => {
    if (socketRef.current && isConnected) {
      console.log('🌍 Leaving global tournaments room');
      socketRef.current.emit('leave_global_tournaments');
    }
  }, [isConnected]);

  // Emit methods
  const emitTournamentAction = useCallback(
    (action: string, data: any) => {
      if (socketRef.current && isConnected) {
        console.log(`🚀 Emitting tournament action: ${action}`, data);
        socketRef.current.emit('tournament_action', { action, data });
      } else {
        console.warn(
          '⚠️ Cannot emit tournament action: WebSocket not connected'
        );
      }
    },
    [isConnected]
  );

  const emitMatchResult = useCallback(
    (matchId: string, result: any) => {
      if (socketRef.current && isConnected) {
        console.log(`🚀 Emitting match result for ${matchId}:`, result);
        socketRef.current.emit('match_result', { matchId, result });
      } else {
        console.warn('⚠️ Cannot emit match result: WebSocket not connected');
      }
    },
    [isConnected]
  );

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // Connection state
    isConnected,
    isConnecting,
    connectionError,

    // Connection methods
    connect,
    disconnect,
    reconnect,

    // Room management
    joinTournament,
    leaveTournament,
    joinMatch,
    leaveMatch,
    joinGlobalTournaments,
    leaveGlobalTournaments,

    // Emit methods
    emitTournamentAction,
    emitMatchResult,

    // Connection stats
    connectionStats: {
      reconnectAttempts: reconnectAttemptsRef.current,
      totalEvents: eventCountRef.current,
      lastEventTime: eventCountRef.current > 0 ? new Date() : null,
    },
  };
};
