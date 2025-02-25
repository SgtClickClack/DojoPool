import { EventEmitter } from 'events';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';

export enum WebSocketEvent {
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
    ERROR = 'error',
    GAME_UPDATE = 'game_update',
    SHOT_UPDATE = 'shot_update',
    BREAK_UPDATE = 'break_update',
    MATCH_END = 'match_end',
    LEADERBOARD_UPDATE = 'leaderboard_update'
}

export class WebSocketService {
    private static instance: WebSocketService;
    private socket: WebSocket | null = null;
    private eventEmitter: EventEmitter;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectTimeout: number = 1000;
    private gameId: string | null = null;
    private timeframe: string | null = null;

    private constructor() {
        this.eventEmitter = new EventEmitter();
    }

    public static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    public connectToGame(gameId: string): void {
        this.gameId = gameId;
        this.connect(`game/${gameId}/`);
    }

    public connectToLeaderboard(timeframe: string): void {
        this.timeframe = timeframe;
        this.connect(`leaderboard/${timeframe}/`);
    }

    public disconnect(): void {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
            this.gameId = null;
            this.timeframe = null;
            this.eventEmitter.emit(WebSocketEvent.DISCONNECTED);
        }
    }

    public on(event: WebSocketEvent, callback: (data: any) => void): void {
        this.eventEmitter.on(event, callback);
    }

    public off(event: WebSocketEvent, callback: (data: any) => void): void {
        this.eventEmitter.off(event, callback);
    }

    public sendMessage(data: any): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        } else {
            console.error('WebSocket is not connected');
        }
    }

    private connect(endpoint: string): void {
        const token = localStorage.getItem('access_token');
        if (!token) {
            console.error('No access token found');
            return;
        }

        const url = `${WS_BASE_URL}/${endpoint}`;
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
            this.eventEmitter.emit(WebSocketEvent.CONNECTED);
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                switch (data.type) {
                    case 'match_state':
                    case 'shot_update':
                    case 'break_update':
                    case 'match_end':
                        this.eventEmitter.emit(WebSocketEvent.GAME_UPDATE, data);
                        break;
                    case 'leaderboard_state':
                        this.eventEmitter.emit(WebSocketEvent.LEADERBOARD_UPDATE, data);
                        break;
                    default:
                        console.warn('Unknown message type:', data.type);
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        this.socket.onclose = () => {
            this.eventEmitter.emit(WebSocketEvent.DISCONNECTED);
            this.handleReconnection(endpoint);
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.eventEmitter.emit(WebSocketEvent.ERROR, error);
        };
    }

    private handleReconnection(endpoint: string): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
                this.connect(endpoint);
            }, this.reconnectTimeout * Math.pow(2, this.reconnectAttempts - 1));
        } else {
            console.error('Max reconnection attempts reached');
        }
    }
} 