import { io, type Socket } from 'socket.io-client';
import { WEBSOCKET_BASE_URL } from '../../../constants';

export interface PlayerPosition {
  playerId: string;
  playerName: string;
  avatar?: string;
  clan?: string;
  lat: number;
  lng: number;
  timestamp: number;
  isOnline: boolean;
}

export interface PlayerPositionUpdate {
  type: 'player_position_update';
  data: PlayerPosition[];
}

export interface DojoStatusUpdate {
  type: 'dojo_status_update';
  data: {
    dojos: Array<{
      id: string;
      status: 'controlled' | 'rival' | 'neutral';
      controller: string;
      influence: number;
      players: number;
    }>;
  };
}

export interface GameUpdate {
  type: 'game_update';
  data: {
    type: 'dojo_captured';
    dojoId: string;
    newStatus: 'controlled' | 'rival' | 'neutral';
    newController: string;
    newInfluence: number;
  };
}

export interface NewChallenge {
  type: 'new_challenge';
  data: {
    challengeId: string;
    challengerId: string;
    defenderId: string;
    stakeCoins: number;
    createdAt: string;
  };
}

export interface ChallengeResponse {
  type: 'challenge_response';
  data: {
    challengeId: string;
    status: 'ACCEPTED' | 'DECLINED';
    updatedAt: string;
  };
}

export interface NewActivityEvent {
  type: 'new_activity_event';
  data: {
    id: string;
    type: string;
    title: string;
    description: string;
    userId: string;
    username: string;
    userAvatar?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
    isPublic: boolean;
  };
}

export interface ShotEvent {
  type: 'shot_taken';
  data: {
    gameId: string;
    playerId: string;
    shotType: 'successful_pot' | 'missed_shot' | 'foul' | 'scratch';
    ballId?: string;
    pocketId?: string;
    timestamp: number;
    ballSunk?: boolean;
    wasFoul?: boolean;
  };
}

export interface LiveCommentaryEvent {
  type: 'live_commentary';
  data: {
    gameId: string;
    commentary: string;
    timestamp: number;
    style?: 'professional' | 'excited' | 'analytical' | 'casual';
    playerName?: string;
    shotType?: string;
    ballSunk?: boolean;
    wasFoul?: boolean;
  };
}

export type WebSocketEvent =
  | PlayerPositionUpdate
  | DojoStatusUpdate
  | GameUpdate
  | NewChallenge
  | ChallengeResponse
  | NewActivityEvent
  | ShotEvent
  | LiveCommentaryEvent;

export class WebSocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private eventListeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private messageActivityListeners: Set<() => void> = new Set();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private serverUrl: string = WEBSOCKET_BASE_URL;

  constructor() {
    void this.connect().catch((error) => {
      console.error('WebSocket connect failed:', error);
    });
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.serverUrl, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
        });

        this.socket.on('connect', () => {
          console.warn('WebSocket connected successfully');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('disconnect', () => {
          console.warn('WebSocket disconnected');
          this.isConnected = false;
          this.handleReconnect();
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          reject(error);
        });

        this.socket.on('error', (error) => {
          console.error('WebSocket error:', error);
        });

        // Handle incoming messages
        this.socket.on('message', (data) => {
          this.handleMessage(data);
        });

        // Handle challenge events
        this.socket.on('new_challenge', (data) => {
          this.handleChallengeEvent('new_challenge', data);
        });

        this.socket.on('challenge_response', (data) => {
          this.handleChallengeEvent('challenge_response', data);
        });

        // Handle other events for general message activity
        this.socket.on('player_position_update', () => {
          this.triggerMessageActivity();
        });

        this.socket.on('dojo_status_update', () => {
          this.triggerMessageActivity();
        });

        this.socket.on('game_update', () => {
          this.triggerMessageActivity();
        });
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        reject(error);
      }
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.warn(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  private handleMessage(data: unknown): void {
    try {
      const parsed: unknown =
        typeof data === 'string' ? JSON.parse(data) : data;

      const message = parsed as { type?: string; data?: unknown };

      // Trigger message activity for any message
      this.triggerMessageActivity();

      if (message.type && this.eventListeners.has(message.type)) {
        const listeners = this.eventListeners.get(message.type);
        if (listeners) {
          listeners.forEach((callback) => {
            try {
              callback(message.data ?? message);
            } catch (error) {
              console.error('Error in event listener:', error);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  subscribe<T>(event: string, callback: (data: T) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    const listeners = this.eventListeners.get(event)!;
    listeners.add(callback as unknown as (data: unknown) => void);

    // Return unsubscribe function
    return () => {
      const cb = callback as unknown as (data: unknown) => void;
      if (listeners.has(cb)) {
        listeners.delete(cb);
      }

      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    };
  }

  unsubscribe<T>(event: string, callback: (data: T) => void): void {
    const listeners = this.eventListeners.get(event);
    const cb = callback as unknown as (data: unknown) => void;
    if (listeners && listeners.has(cb)) {
      listeners.delete(cb);

      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  emit(event: string, data: unknown): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected, cannot emit event:', event);
    }
  }

  joinRoom(room: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('join', { room });
    }
  }

  leaveRoom(room: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave', { room });
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventListeners.clear();
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Specific method for player position updates
  subscribeToPlayerPositions(
    callback: (positions: PlayerPosition[]) => void
  ): () => void {
    return this.subscribe('player_position_update', callback);
  }

  // Method to request player positions
  requestPlayerPositions(): void {
    this.emit('request_player_positions', {});
  }

  // Method to update own position
  updatePlayerPosition(position: Omit<PlayerPosition, 'timestamp'>): void {
    this.emit('update_player_position', {
      ...position,
      timestamp: Date.now(),
    });
  }

  // Subscribe to general message activity (for heartbeat animations)
  subscribeToMessageActivity(callback: () => void): () => void {
    this.messageActivityListeners.add(callback);

    return () => {
      this.messageActivityListeners.delete(callback);
    };
  }

  // Trigger message activity for all listeners
  private triggerMessageActivity(): void {
    this.messageActivityListeners.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error('Error in message activity listener:', error);
      }
    });
  }

  // Register user for targeted notifications
  registerUser(userId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('register_user', { userId });
    }
  }

  // Handle challenge events
  private handleChallengeEvent(
    eventType: 'new_challenge' | 'challenge_response',
    data: unknown
  ): void {
    if (eventType === 'new_challenge') {
      const event: NewChallenge = {
        type: 'new_challenge',
        data: data as NewChallenge['data'],
      };
      this.handleMessage(event);
      return;
    }

    const event: ChallengeResponse = {
      type: 'challenge_response',
      data: data as ChallengeResponse['data'],
    };
    this.handleMessage(event);
  }

  // Method to emit shot events to MatchGateway
  emitShotEvent(shotData: Omit<ShotEvent['data'], 'timestamp'>): void {
    // Connect to match namespace and emit shot_taken event
    if (this.socket && this.isConnected) {
      // Join the match room first
      this.joinRoom(`match:${shotData.gameId}`);

      // Emit the shot_taken event with the format expected by MatchGateway
      this.socket.emit('shot_taken', {
        matchId: shotData.gameId,
        playerId: shotData.playerId,
        ballSunk: shotData.shotType === 'successful_pot',
        wasFoul:
          shotData.shotType === 'foul' || shotData.shotType === 'scratch',
        shotType: shotData.shotType,
        ballId: shotData.ballId,
        pocketId: shotData.pocketId,
        timestamp: Date.now(),
      });
    } else {
      console.warn('WebSocket not connected, cannot emit shot event');
    }
  }

  // Method to subscribe to live commentary from MatchGateway
  subscribeToLiveCommentary(
    gameId: string,
    callback: (commentary: LiveCommentaryEvent['data']) => void
  ): () => void {
    // Join the match room for commentary
    this.joinRoom(`match:${gameId}`);

    return this.subscribe('live_commentary', callback);
  }

  // Method to join a specific game room
  joinGameRoom(gameId: string): void {
    this.joinRoom(`match:${gameId}`);
  }

  // Method to leave a specific game room
  leaveGameRoom(gameId: string): void {
    this.leaveRoom(`match:${gameId}`);
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
