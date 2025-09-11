import { io } from 'socket.io-client';

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  userId?: string;
  roomId?: string;
}

export interface TournamentUpdate {
  tournamentId: string;
  event:
    | 'player_joined'
    | 'player_left'
    | 'match_started'
    | 'match_ended'
    | 'tournament_started'
    | 'tournament_ended';
  data: any;
}

export interface MatchUpdate {
  matchId: string;
  event:
    | 'ball_potted'
    | 'turn_changed'
    | 'match_ended'
    | 'spectator_joined'
    | 'spectator_left';
  data: any;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
  roomId: string;
  type: 'message' | 'system' | 'achievement';
}

export interface NotificationData {
  id: string;
  userId: string;
  type: 'tournament' | 'match' | 'achievement' | 'clan' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private eventListeners: Map<string, Function[]> = new Map();

  // Connection state
  private connectionState:
    | 'disconnected'
    | 'connecting'
    | 'connected'
    | 'reconnecting' = 'disconnected';

  constructor() {
    this.setupEventListeners();
  }

  // Initialize WebSocket connection
  async connect(token?: string): Promise<void> {
    if (this.isConnecting || this.socket?.connected) {
      return;
    }

    this.isConnecting = true;
    this.connectionState = 'connecting';

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

      this.socket = io(wsUrl, {
        auth: token ? { token } : undefined,
        transports: ['websocket', 'polling'],
        timeout: 5000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.emit('connected', { socketId: this.socket?.id });
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        this.connectionState = 'disconnected';
        this.emit('disconnected', { reason });
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.connectionState = 'disconnected';
        this.isConnecting = false;
        this.emit('connection_error', { error: error.message });
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
        this.connectionState = 'connected';
        this.emit('reconnected', { attemptNumber });
      });

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`WebSocket reconnection attempt ${attemptNumber}`);
        this.connectionState = 'reconnecting';
        this.emit('reconnecting', { attemptNumber });
      });

      this.socket.on('reconnect_error', (error) => {
        console.error('WebSocket reconnection error:', error);
        this.emit('reconnection_error', { error: error.message });
      });

      this.socket.on('reconnect_failed', () => {
        console.log('WebSocket reconnection failed');
        this.connectionState = 'disconnected';
        this.emit('reconnection_failed');
      });
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this.isConnecting = false;
      this.connectionState = 'disconnected';
      throw error;
    }
  }

  // Disconnect from WebSocket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionState = 'disconnected';
    this.emit('disconnected', { reason: 'manual' });
  }

  // Send message to server
  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected, cannot emit:', event);
    }
  }

  // Listen for events
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);

    // Also listen on socket if connected
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remove event listener
  off(event: string, callback?: Function): void {
    if (callback) {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    } else {
      this.eventListeners.delete(event);
    }

    // Also remove from socket if connected
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Setup default event listeners
  private setupEventListeners(): void {
    // Tournament events
    this.on('tournament_update', (data: TournamentUpdate) => {
      this.handleTournamentUpdate(data);
    });

    // Match events
    this.on('match_update', (data: MatchUpdate) => {
      this.handleMatchUpdate(data);
    });

    // Chat events
    this.on('chat_message', (data: ChatMessage) => {
      this.handleChatMessage(data);
    });

    this.on('user_joined_chat', (data) => {
      this.handleUserJoinedChat(data);
    });

    this.on('user_left_chat', (data) => {
      this.handleUserLeftChat(data);
    });

    // Notification events
    this.on('notification', (data: NotificationData) => {
      this.handleNotification(data);
    });

    // Battle pass events
    this.on('battle_pass_progress', (data) => {
      this.handleBattlePassProgress(data);
    });

    // System events
    this.on('system_message', (data) => {
      this.handleSystemMessage(data);
    });
  }

  // Tournament room management
  joinTournament(tournamentId: string): void {
    this.emit('join_tournament', { tournamentId });
  }

  leaveTournament(tournamentId: string): void {
    this.emit('leave_tournament', { tournamentId });
  }

  // Match room management
  joinMatch(matchId: string, spectator: boolean = false): void {
    this.emit('join_match', { matchId, spectator });
  }

  leaveMatch(matchId: string): void {
    this.emit('leave_match', { matchId });
  }

  // Chat room management
  joinChat(roomId: string, username: string): void {
    this.emit('join_chat', { roomId, username });
  }

  leaveChat(roomId: string): void {
    this.emit('leave_chat', { roomId });
  }

  sendChatMessage(roomId: string, message: string): void {
    this.emit('send_message', { roomId, message });
  }

  sendTypingIndicator(roomId: string, isTyping: boolean): void {
    this.emit(isTyping ? 'typing_start' : 'typing_stop', { roomId });
  }

  // Event handlers
  private handleTournamentUpdate(data: TournamentUpdate): void {
    console.log('Tournament update received:', data);
    this.emit('tournament_update', data);
  }

  private handleMatchUpdate(data: MatchUpdate): void {
    console.log('Match update received:', data);
    this.emit('match_update', data);
  }

  private handleChatMessage(data: ChatMessage): void {
    console.log('Chat message received:', data);
    this.emit('chat_message', data);
  }

  private handleUserJoinedChat(data: any): void {
    console.log('User joined chat:', data);
    this.emit('user_joined_chat', data);
  }

  private handleUserLeftChat(data: any): void {
    console.log('User left chat:', data);
    this.emit('user_left_chat', data);
  }

  private handleNotification(data: NotificationData): void {
    console.log('Notification received:', data);
    this.emit('notification', data);
  }

  private handleBattlePassProgress(data: any): void {
    console.log('Battle pass progress update:', data);
    this.emit('battle_pass_progress', data);
  }

  private handleSystemMessage(data: any): void {
    console.log('System message received:', data);
    this.emit('system_message', data);
  }

  // Utility methods
  getConnectionState(): string {
    return this.connectionState;
  }

  isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  // Cleanup
  destroy(): void {
    this.disconnect();
    this.eventListeners.clear();
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;
export { WebSocketService };
