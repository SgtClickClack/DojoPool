import { io, Socket } from 'socket.io-client';

export interface Stream {
  id: string;
  title: string;
  description: string;
  status: 'live' | 'offline' | 'scheduled';
  quality: '720p' | '1080p' | '4k';
  viewers: number;
  maxViewers: number;
  startTime: Date;
  endTime?: Date;
  match: string;
  streamer: string;
  url: string;
  thumbnail: string;
}

export interface ChatMessage {
  id: string;
  streamId: string;
  user: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'emote' | 'donation' | 'subscription';
  moderation: 'clean' | 'flagged' | 'removed';
}

export interface BroadcastSettings {
  quality: string;
  bitrate: number;
  fps: number;
  resolution: string;
  audioCodec: string;
  videoCodec: string;
}

export interface StreamAnalytics {
  streamId: string;
  peakViewers: number;
  avgViewers: number;
  totalWatchTime: number;
  chatMessages: number;
  donations: number;
  subscriptions: number;
  engagement: number;
}

class TournamentStreamingService {
  private static instance: TournamentStreamingService;
  private socket: Socket | null = null;
  private _isConnected = false;
  private streams: Stream[] = [];
  private chatMessages: ChatMessage[] = [];
  private analytics: StreamAnalytics[] = [];
  private settings: BroadcastSettings = {
    quality: '1080p',
    bitrate: 6000,
    fps: 60,
    resolution: '1920x1080',
    audioCodec: 'AAC',
    videoCodec: 'H.264'
  };

  private constructor() {
    this.initializeWebSocket();
    this.loadMockData();
  }

  public static getInstance(): TournamentStreamingService {
    if (!TournamentStreamingService.instance) {
      TournamentStreamingService.instance = new TournamentStreamingService();
    }
    return TournamentStreamingService.instance;
  }

  private initializeWebSocket(): void {
    try {
      this.socket = io('http://localhost:8080', {
        transports: ['websocket'],
        timeout: 10000
      });
      this.socket.on('connect', () => {
        this._isConnected = true;
        this.socket?.emit('streaming:join', { service: 'streaming' });
      });
      this.socket.on('disconnect', () => {
        this._isConnected = false;
      });
      this.socket.on('streaming:stream_update', (stream: Stream) => {
        this.updateStream(stream);
      });
      this.socket.on('streaming:chat_message', (message: ChatMessage) => {
        this.addChatMessage(message);
      });
    } catch (error) {
      this._isConnected = false;
    }
  }

  // Stream Management
  public createStream(stream: Omit<Stream, 'id' | 'viewers' | 'maxViewers' | 'startTime'>): Stream {
    const newStream: Stream = {
      ...stream,
      id: this.generateId(),
      viewers: 0,
      maxViewers: 0,
      startTime: new Date()
    };
    this.streams.push(newStream);
    this.socket?.emit('streaming:stream_created', newStream);
    return newStream;
  }

  public startStream(streamId: string): void {
    const stream = this.streams.find(s => s.id === streamId);
    if (stream) {
      stream.status = 'live';
      stream.startTime = new Date();
      this.socket?.emit('streaming:stream_started', stream);
    }
  }

  public endStream(streamId: string): void {
    const stream = this.streams.find(s => s.id === streamId);
    if (stream) {
      stream.status = 'offline';
      stream.endTime = new Date();
      this.socket?.emit('streaming:stream_ended', stream);
    }
  }

  public getStreams(): Stream[] {
    return [...this.streams];
  }

  public getStreamById(id: string): Stream | undefined {
    return this.streams.find(s => s.id === id);
  }

  public getLiveStreams(): Stream[] {
    return this.streams.filter(s => s.status === 'live');
  }

  private updateStream(stream: Stream): void {
    const index = this.streams.findIndex(s => s.id === stream.id);
    if (index !== -1) {
      this.streams[index] = stream;
    } else {
      this.streams.push(stream);
    }
  }

  // Chat Management
  public sendChatMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const newMessage: ChatMessage = {
      ...message,
      id: this.generateId(),
      timestamp: new Date()
    };
    this.chatMessages.push(newMessage);
    this.socket?.emit('streaming:chat_sent', newMessage);
    return newMessage;
  }

  public getChatMessages(streamId: string): ChatMessage[] {
    return this.chatMessages.filter(m => m.streamId === streamId);
  }

  public moderateMessage(messageId: string, action: 'flag' | 'remove'): void {
    const message = this.chatMessages.find(m => m.id === messageId);
    if (message) {
      message.moderation = action === 'remove' ? 'removed' : 'flagged';
      this.socket?.emit('streaming:message_moderated', message);
    }
  }

  private addChatMessage(message: ChatMessage): void {
    const existingIndex = this.chatMessages.findIndex(m => m.id === message.id);
    if (existingIndex !== -1) {
      this.chatMessages[existingIndex] = message;
    } else {
      this.chatMessages.push(message);
    }
  }

  // Analytics
  public getAnalytics(streamId: string): StreamAnalytics | undefined {
    return this.analytics.find(a => a.streamId === streamId);
  }

  public getAllAnalytics(): StreamAnalytics[] {
    return [...this.analytics];
  }

  // Settings
  public getSettings(): BroadcastSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<BroadcastSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.socket?.emit('streaming:settings_updated', this.settings);
  }

  // Mock Data
  private loadMockData(): void {
    this.streams = [
      {
        id: 'stream1',
        title: 'Championship Finals - Match 1',
        description: 'Live coverage of the tournament championship finals',
        status: 'live',
        quality: '1080p',
        viewers: 1250,
        maxViewers: 1500,
        startTime: new Date(Date.now() - 3600000),
        match: 'Match 1',
        streamer: 'DojoPool Official',
        url: 'https://stream.dojopool.com/live/championship',
        thumbnail: '/images/stream-thumbnail.jpg'
      },
      {
        id: 'stream2',
        title: 'Semi-Finals Preview',
        description: 'Pre-match analysis and player interviews',
        status: 'scheduled',
        quality: '720p',
        viewers: 0,
        maxViewers: 0,
        startTime: new Date(Date.now() + 7200000),
        match: 'Semi-Finals',
        streamer: 'DojoPool Official',
        url: 'https://stream.dojopool.com/scheduled/semifinals',
        thumbnail: '/images/stream-thumbnail-2.jpg'
      }
    ];

    this.chatMessages = [
      {
        id: 'msg1',
        streamId: 'stream1',
        user: 'PoolMaster2024',
        message: 'Amazing shot!',
        timestamp: new Date(Date.now() - 300000),
        type: 'text',
        moderation: 'clean'
      },
      {
        id: 'msg2',
        streamId: 'stream1',
        user: 'CueQueen',
        message: '🔥🔥🔥',
        timestamp: new Date(Date.now() - 180000),
        type: 'emote',
        moderation: 'clean'
      }
    ];

    this.analytics = [
      {
        streamId: 'stream1',
        peakViewers: 1500,
        avgViewers: 1200,
        totalWatchTime: 3600000,
        chatMessages: 1250,
        donations: 45,
        subscriptions: 12,
        engagement: 85
      }
    ];
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Utility Methods
  public isConnected(): boolean {
    return this._isConnected;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this._isConnected = false;
  }
}

export default TournamentStreamingService; 
