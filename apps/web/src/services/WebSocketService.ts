import { io, type Socket } from 'socket.io-client';

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

export interface ShotData {
  matchId: string;
  playerId: string;
  ballSunk: boolean;
  wasFoul: boolean;
  playerName?: string;
  shotType?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
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

export interface DirectMessageUpdate {
  type: 'new_dm';
  data: ChatMessage;
}

export type WebSocketEvent =
  | PlayerPositionUpdate
  | DojoStatusUpdate
  | GameUpdate
  | DirectMessageUpdate;

export type WebSocketEventData = Record<string, unknown>;

export class WebSocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private eventListeners: Map<string, Set<(_data: WebSocketEventData) => void>> = new Map();
  private messageActivityListeners: Set<() => void> = new Set();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private currentMatchId: string | null = null;

  constructor(
    private _serverUrl: string = process.env.NEXT_PUBLIC_WEBSOCKET_URL ||
      'http://localhost:3002'
  ) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(`${this._serverUrl}/world-map`, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
        });

        this.socket.on('connect', () => {
          console.log(
            'WebSocket connected successfully to world-map namespace'
          );
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('WebSocket disconnected from world-map namespace');
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

        // Handle any incoming event for general message activity
        this.socket.onAny((eventName, data) => {
          // Trigger message activity for any incoming event
          this.triggerMessageActivity();
          this.handleMessage({ type: eventName, data });
        });
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  // Connect to match namespace for live commentary
  connectToMatch(matchId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.socket) {
          this.socket.disconnect();
        }

        this.socket = io(`${this._serverUrl}/match`, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
        });

        this.socket.on('connect', () => {
          console.log('WebSocket connected successfully to match namespace');
          this.isConnected = true;
          this.currentMatchId = matchId;
          this.reconnectAttempts = 0;

          // Join the match room
          this.joinMatchRoom(matchId);
          resolve();
        });

        this.socket.on('disconnect', () => {
          this.isConnected = false;
          this.currentMatchId = null;
          this.handleReconnect();
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          reject(error);
        });

        this.socket.on('error', (error) => {
          console.error('WebSocket error:', error);
        });

        // Handle live commentary events
        this.socket.on('live_commentary', (data) => {
          this.handleMessage({ type: 'live_commentary', data });
        });

        // Handle shot errors
        this.socket.on('shot_error', (error) => {
          this.handleMessage({ type: 'shot_error', data: error });
        });

        // Handle any incoming event for general message activity
        this.socket.onAny((eventName, data) => {
          this.triggerMessageActivity();
          this.handleMessage({ type: eventName, data });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Join match room
  joinMatchRoom(matchId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_match', {
        matchId,
        playerId: this.currentMatchId,
      });
    }
  }

  // Leave match room
  leaveMatchRoom(matchId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_match', { matchId });
    }
  }

  // Convenience: subscribe to match status updates
  subscribeToMatchStatus(
    callback: (payload: { matchId: string; status: string }) => void
  ): () => void {
    return this.subscribe('match_status_update', callback as (data: WebSocketEventData) => void);
  }

  // Emit shot taken event for live commentary
  emitShotTaken(shotData: ShotData): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('shot_taken', shotData);
    } else {
      console.warn('WebSocket not connected, cannot emit shot_taken event');
    }
  }

  // Send direct message
  sendDirectMessage(receiverId: string, content: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_dm', { receiverId, content });
    } else {
      console.warn('WebSocket not connected, cannot send direct message');
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      this.connect().catch((error) => {
        // Handle reconnection errors silently
      });
    }, delay);
  }

  private handleMessage(data: WebSocketEventData): void {
    try {
      const message = typeof data === 'string' ? JSON.parse(data) : data;

      // Trigger message activity for any message
      this.triggerMessageActivity();

      if (message.type && this.eventListeners.has(message.type)) {
        const listeners = this.eventListeners.get(message.type);
        if (listeners) {
          listeners.forEach((callback) => {
            try {
              callback(message.data || message);
            } catch (error) {
              // Handle event listener errors silently
            }
          });
        }
      }
    } catch (error) {
      // Handle message parsing errors silently
    }
  }

  subscribe(event: string, callback: (data: WebSocketEventData) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    const listeners = this.eventListeners.get(event)!;
    listeners.add(callback);

    // Return unsubscribe function
    return () => {
      if (listeners.has(callback)) {
        listeners.delete(callback);
      }

      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    };
  }

  unsubscribe(event: string, callback: (data: WebSocketEventData) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners && listeners.has(callback)) {
      listeners.delete(callback);

      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  emit(event: string, data: WebSocketEventData): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
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
    return this.subscribe('player_position_update', callback as unknown as (data: WebSocketEventData) => void);
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
        // Handle message activity listener errors silently
      }
    });
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
