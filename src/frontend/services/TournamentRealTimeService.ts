import { getSocketIOUrl } from '@/config/urls';
import { io, Socket } from 'socket.io-client';

export interface TournamentUpdate {
  type:
    | 'tournament_created'
    | 'tournament_updated'
    | 'tournament_deleted'
    | 'player_registered'
    | 'player_unregistered'
    | 'tournament_started'
    | 'match_updated'
    | 'match_completed';
  tournamentId: string;
  data: any;
  timestamp: Date;
}

export interface MatchUpdate {
  matchId: string;
  tournamentId: string;
  scoreA: number;
  scoreB: number;
  winnerId: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  timestamp: Date;
}

export interface ParticipantUpdate {
  tournamentId: string;
  playerId: string;
  action: 'registered' | 'unregistered';
  timestamp: Date;
}

export class TournamentRealTimeService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(private serverUrl: string = getSocketIOUrl()) {}

  // Connect to WebSocket server
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.serverUrl, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
        });

        this.socket.on('connect', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('Tournament WebSocket connected');
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          this.isConnected = false;
          console.log('Tournament WebSocket disconnected:', reason);

          if (reason === 'io server disconnect') {
            // Server disconnected, try to reconnect
            this.socket?.connect();
          }
        });

        this.socket.on('connect_error', (error) => {
          console.error('Tournament WebSocket connection error:', error);
          this.isConnected = false;
          reject(error);
        });

        this.socket.on('reconnect', (attemptNumber) => {
          console.log(
            'Tournament WebSocket reconnected after',
            attemptNumber,
            'attempts'
          );
          this.isConnected = true;
          this.reconnectAttempts = 0;
        });

        this.socket.on('reconnect_failed', () => {
          console.error('Tournament WebSocket reconnection failed');
          this.isConnected = false;
        });

        // Set up tournament event listeners
        this.setupTournamentListeners();
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Check connection status
  isConnectedToServer(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Subscribe to tournament updates
  subscribeToTournament(
    tournamentId: string,
    callback: (update: TournamentUpdate) => void
  ): () => void {
    if (!this.isConnectedToServer()) {
      console.warn(
        'WebSocket not connected, cannot subscribe to tournament updates'
      );
      return () => {};
    }

    const eventKey = `tournament:${tournamentId}`;
    if (!this.listeners.has(eventKey)) {
      this.listeners.set(eventKey, new Set());
    }

    this.listeners.get(eventKey)!.add(callback);

    // Join tournament room
    this.socket?.emit('join_tournament', { tournamentId });

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventKey);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(eventKey);
          // Leave tournament room
          this.socket?.emit('leave_tournament', { tournamentId });
        }
      }
    };
  }

  // Subscribe to all tournament updates
  subscribeToAllTournaments(
    callback: (update: TournamentUpdate) => void
  ): () => void {
    if (!this.isConnectedToServer()) {
      console.warn(
        'WebSocket not connected, cannot subscribe to tournament updates'
      );
      return () => {};
    }

    const eventKey = 'all_tournaments';
    if (!this.listeners.has(eventKey)) {
      this.listeners.set(eventKey, new Set());
    }

    this.listeners.get(eventKey)!.add(callback);

    // Join global tournament room
    this.socket?.emit('join_global_tournaments');

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventKey);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(eventKey);
          // Leave global tournament room
          this.socket?.emit('leave_global_tournaments');
        }
      }
    };
  }

  // Subscribe to match updates
  subscribeToMatch(
    matchId: string,
    callback: (update: MatchUpdate) => void
  ): () => void {
    if (!this.isConnectedToServer()) {
      console.warn(
        'WebSocket not connected, cannot subscribe to match updates'
      );
      return () => {};
    }

    const eventKey = `match:${matchId}`;
    if (!this.listeners.has(eventKey)) {
      this.listeners.set(eventKey, new Set());
    }

    this.listeners.get(eventKey)!.add(callback);

    // Join match room
    this.socket?.emit('join_match', { matchId });

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventKey);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(eventKey);
          // Leave match room
          this.socket?.emit('leave_match', { matchId });
        }
      }
    };
  }

  // Emit tournament action (for admin/organizer use)
  emitTournamentAction(action: string, data: any): void {
    if (!this.isConnectedToServer()) {
      console.warn('WebSocket not connected, cannot emit tournament action');
      return;
    }

    this.socket?.emit('tournament_action', { action, data });
  }

  // Emit match result (for referee/admin use)
  emitMatchResult(
    matchId: string,
    result: { scoreA: number; scoreB: number; winnerId: string }
  ): void {
    if (!this.isConnectedToServer()) {
      console.warn('WebSocket not connected, cannot emit match result');
      return;
    }

    this.socket?.emit('match_result', { matchId, result });
  }

  // Set up tournament event listeners
  private setupTournamentListeners(): void {
    if (!this.socket) return;

    // Tournament updates
    this.socket.on('tournament_update', (data: TournamentUpdate) => {
      this.notifyListeners(`tournament:${data.tournamentId}`, data);
      this.notifyListeners('all_tournaments', data);
    });

    // Match updates
    this.socket.on('match_update', (data: MatchUpdate) => {
      this.notifyListeners(`match:${data.matchId}`, data);
      this.notifyListeners(`tournament:${data.tournamentId}`, data);
    });

    // Participant updates
    this.socket.on('participant_update', (data: ParticipantUpdate) => {
      this.notifyListeners(`tournament:${data.tournamentId}`, {
        type: `player_${data.action}`,
        tournamentId: data.tournamentId,
        data: { playerId: data.playerId },
        timestamp: data.timestamp,
      });
    });

    // Error handling
    this.socket.on('tournament_error', (error: any) => {
      console.error('Tournament WebSocket error:', error);
    });
  }

  // Notify all listeners for a specific event
  private notifyListeners(eventKey: string, data: any): void {
    const listeners = this.listeners.get(eventKey);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in tournament WebSocket listener:', error);
        }
      });
    }
  }

  // Get connection statistics
  getConnectionStats(): {
    isConnected: boolean;
    reconnectAttempts: number;
    listenerCount: number;
  } {
    return {
      isConnected: this.isConnectedToServer(),
      reconnectAttempts: this.reconnectAttempts,
      listenerCount: Array.from(this.listeners.values()).reduce(
        (total, set) => total + set.size,
        0
      ),
    };
  }

  // Clean up all listeners
  cleanup(): void {
    this.listeners.clear();
    this.disconnect();
  }
}

// Singleton instance
export const tournamentRealTimeService = new TournamentRealTimeService();
