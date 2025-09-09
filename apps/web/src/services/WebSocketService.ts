import { io } from 'socket.io-client';

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

export interface ShardRedirectEvent {
  type: 'redirect_to_shard';
  data: {
    shardUrl: string;
    namespace: string;
    matchId?: string;
    venueId?: string;
  };
}

export interface ShardRebalanceEvent {
  type: 'shard_rebalance';
  data: {
    newShardId: number;
    namespace: string;
    reason: string;
  };
}

export type WebSocketEvent =
  | PlayerPositionUpdate
  | DojoStatusUpdate
  | GameUpdate
  | DirectMessageUpdate
  | ShardRedirectEvent
  | ShardRebalanceEvent;

export class WebSocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();
  private messageActivityListeners: Set<() => void> = new Set();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private currentMatchId: string | null = null;

  // Sharding-related properties
  private currentShardId: number | null = null;
  private shardReconnectionInProgress: boolean = false;
  private shardRedirectListeners: Set<
    (redirect: ShardRedirectEvent['data']) => void
  > = new Set();
  private shardRebalanceListeners: Set<
    (rebalance: ShardRebalanceEvent['data']) => void
  > = new Set();
  private geographicRegion: string | null = null;
  private userLocation: { lat: number; lng: number } | null = null;

  constructor(
    private serverUrl: string = process.env.NEXT_PUBLIC_WEBSOCKET_URL ||
      'http://localhost:3002'
  ) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(`${this.serverUrl}/world-map`, {
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

        // Handle shard-specific events
        this.socket.on('redirect_to_shard', (data) => {
          this.handleShardRedirect(data);
        });

        this.socket.on('shard_rebalance', (data) => {
          this.handleShardRebalance(data);
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

        this.socket = io(`${this.serverUrl}/match`, {
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
          console.log('WebSocket disconnected from match namespace');
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
          console.error('Shot error:', error);
          this.handleMessage({ type: 'shot_error', data: error });
        });

        // Handle any incoming event for general message activity
        this.socket.onAny((eventName, data) => {
          this.triggerMessageActivity();
          this.handleMessage({ type: eventName, data });
        });
      } catch (error) {
        console.error('Failed to create match WebSocket connection:', error);
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
      console.log(`Joined match room: ${matchId}`);
    }
  }

  // Leave match room
  leaveMatchRoom(matchId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_match', { matchId });
      console.log(`Left match room: ${matchId}`);
    }
  }

  // Convenience: subscribe to match status updates
  subscribeToMatchStatus(
    callback: (payload: { matchId: string; status: string }) => void
  ): () => void {
    return this.subscribe('match_status_update', callback);
  }

  // Emit shot taken event for live commentary
  emitShotTaken(shotData: ShotData): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('shot_taken', shotData);
      console.log('Shot taken event emitted:', shotData);
    } else {
      console.warn('WebSocket not connected, cannot emit shot_taken event');
    }
  }

  // Send direct message
  sendDirectMessage(receiverId: string, content: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_dm', { receiverId, content });
      console.log('Direct message sent:', { receiverId, content });
    } else {
      console.warn('WebSocket not connected, cannot send direct message');
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  private handleMessage(data: any): void {
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
              console.error('Error in event listener:', error);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  subscribe(event: string, callback: (data: any) => void): () => void {
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

  unsubscribe(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners && listeners.has(callback)) {
      listeners.delete(callback);

      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  emit(event: string, data: any): void {
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

  // Shard event handlers
  private handleShardRedirect(redirectData: ShardRedirectEvent['data']): void {
    console.log('Received shard redirect:', redirectData);
    this.shardReconnectionInProgress = true;

    // Notify listeners
    this.shardRedirectListeners.forEach((listener) => {
      try {
        listener(redirectData);
      } catch (error) {
        console.error('Error in shard redirect listener:', error);
      }
    });

    // Automatically reconnect to the new shard
    this.reconnectToShard(redirectData);
  }

  private handleShardRebalance(
    rebalanceData: ShardRebalanceEvent['data']
  ): void {
    console.log('Received shard rebalance:', rebalanceData);
    this.currentShardId = rebalanceData.newShardId;

    // Notify listeners
    this.shardRebalanceListeners.forEach((listener) => {
      try {
        listener(rebalanceData);
      } catch (error) {
        console.error('Error in shard rebalance listener:', error);
      }
    });
  }

  private async reconnectToShard(
    redirectData: ShardRedirectEvent['data']
  ): Promise<void> {
    try {
      // Disconnect from current socket
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
        this.isConnected = false;
      }

      // Wait a brief moment
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Connect to new shard
      const newServerUrl = redirectData.shardUrl || this.serverUrl;
      const newNamespace = redirectData.namespace || '/world-map';

      if (redirectData.matchId) {
        // Reconnect to match namespace
        await this.connectToMatchOnShard(redirectData.matchId, newServerUrl);
      } else if (redirectData.venueId) {
        // Reconnect to world map with geographic region
        await this.connectToWorldMapOnShard(redirectData.venueId, newServerUrl);
      } else {
        // Default world map connection
        await this.connectToWorldMap(newServerUrl);
      }

      this.shardReconnectionInProgress = false;
      console.log('Successfully reconnected to new shard');
    } catch (error) {
      console.error('Failed to reconnect to shard:', error);
      this.shardReconnectionInProgress = false;

      // Fallback to original server
      this.connect().catch((fallbackError) => {
        console.error('Fallback connection also failed:', fallbackError);
      });
    }
  }

  private async connectToWorldMapOnShard(
    venueId: string,
    serverUrl: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(`${serverUrl}/world-map`, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
        });

        this.socket.on('connect', () => {
          console.log('Connected to world map shard');
          this.isConnected = true;
          this.reconnectAttempts = 0;

          // Join the geographic region
          this.socket?.emit('join_world_region', { venueId });

          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('Disconnected from world map shard');
          this.isConnected = false;
          if (!this.shardReconnectionInProgress) {
            this.handleReconnect();
          }
        });

        this.socket.on('connect_error', (error) => {
          console.error('World map shard connection error:', error);
          reject(error);
        });

        // Set up other event handlers
        this.setupShardEventHandlers();
      } catch (error) {
        console.error('Failed to create world map shard connection:', error);
        reject(error);
      }
    });
  }

  private async connectToMatchOnShard(
    matchId: string,
    serverUrl: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(`${serverUrl}/matches`, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
        });

        this.socket.on('connect', () => {
          console.log('Connected to matches shard');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.currentMatchId = matchId;

          // Join the match room
          this.socket?.emit('join_match', { matchId });

          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('Disconnected from matches shard');
          this.isConnected = false;
          this.currentMatchId = null;
          if (!this.shardReconnectionInProgress) {
            this.handleReconnect();
          }
        });

        this.socket.on('connect_error', (error) => {
          console.error('Matches shard connection error:', error);
          reject(error);
        });

        // Set up other event handlers
        this.setupShardEventHandlers();
      } catch (error) {
        console.error('Failed to create matches shard connection:', error);
        reject(error);
      }
    });
  }

  private async connectToWorldMap(serverUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(`${serverUrl}/world-map`, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
        });

        this.socket.on('connect', () => {
          console.log('Connected to world map');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('Disconnected from world map');
          this.isConnected = false;
          if (!this.shardReconnectionInProgress) {
            this.handleReconnect();
          }
        });

        this.socket.on('connect_error', (error) => {
          console.error('World map connection error:', error);
          reject(error);
        });

        this.setupShardEventHandlers();
      } catch (error) {
        console.error('Failed to create world map connection:', error);
        reject(error);
      }
    });
  }

  private setupShardEventHandlers(): void {
    if (!this.socket) return;

    // Handle shard-specific events
    this.socket.on('redirect_to_shard', (data) => {
      this.handleShardRedirect(data);
    });

    this.socket.on('shard_rebalance', (data) => {
      this.handleShardRebalance(data);
    });

    // Handle incoming messages
    this.socket.on('message', (data) => {
      this.handleMessage(data);
    });

    // Handle any incoming event for general message activity
    this.socket.onAny((eventName, data) => {
      this.triggerMessageActivity();
      this.handleMessage({ type: eventName, data });
    });
  }

  // Public methods for shard management
  setUserLocation(lat: number, lng: number): void {
    this.userLocation = { lat, lng };
    console.log('User location updated for shard routing:', this.userLocation);
  }

  setGeographicRegion(venueId: string): void {
    this.geographicRegion = venueId;
    console.log('Geographic region set for shard routing:', venueId);
  }

  getCurrentShardId(): number | null {
    return this.currentShardId;
  }

  isShardReconnectionInProgress(): boolean {
    return this.shardReconnectionInProgress;
  }

  // Subscribe to shard events
  subscribeToShardRedirects(
    callback: (redirect: ShardRedirectEvent['data']) => void
  ): () => void {
    this.shardRedirectListeners.add(callback);
    return () => {
      this.shardRedirectListeners.delete(callback);
    };
  }

  subscribeToShardRebalances(
    callback: (rebalance: ShardRebalanceEvent['data']) => void
  ): () => void {
    this.shardRebalanceListeners.add(callback);
    return () => {
      this.shardRebalanceListeners.delete(callback);
    };
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
}

// Export singleton instance
export const websocketService = new WebSocketService();
