import { io, Socket } from 'socket.io-client';

export interface StreamConfig {
  quality: 'low' | 'medium' | 'high' | 'ultra';
  bitrate: number;
  resolution: string;
  frameRate: number;
  audioEnabled: boolean;
  videoEnabled: boolean;
  commentaryEnabled: boolean;
  chatEnabled: boolean;
  recordingEnabled: boolean;
}

export interface StreamStats {
  viewers: number;
  peakViewers: number;
  averageWatchTime: number;
  chatMessages: number;
  donations: number;
  streamUptime: number;
  bitrate: number;
  frameRate: number;
  droppedFrames: number;
  audioLevel: number;
  videoQuality: number;
}

export interface CommentaryEvent {
  id: string;
  type: 'shot' | 'foul' | 'game_end' | 'highlight' | 'analysis';
  timestamp: Date;
  message: string;
  player?: string;
  excitement: number;
  priority: 'low' | 'medium' | 'high';
  audioUrl?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  type: 'user' | 'moderator' | 'system';
  isHighlighted: boolean;
  donation?: number;
}

export interface BroadcastSettings {
  title: string;
  description: string;
  tags: string[];
  visibility: 'public' | 'private' | 'unlisted';
  allowChat: boolean;
  moderateChat: boolean;
  allowDonations: boolean;
  scheduleTime?: Date;
  duration?: number;
  thumbnail?: string;
}

export interface StreamSession {
  id: string;
  tournamentId: string;
  matchId?: string;
  title: string;
  status: 'preparing' | 'live' | 'paused' | 'ended';
  startTime: Date;
  endTime?: Date;
  config: StreamConfig;
  stats: StreamStats;
  settings: BroadcastSettings;
  commentary: CommentaryEvent[];
  chat: ChatMessage[];
  highlights: string[];
  recordingUrl?: string;
  replayUrl?: string;
}

class TournamentStreamingService {
  private socket: Socket | null = null;
  private static instance: TournamentStreamingService;
  private config: StreamConfig;
  private currentSession: StreamSession | null = null;
  private isConnected: boolean = false;
  private isStreaming: boolean = false;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  private constructor() {
    this.config = {
      quality: 'high',
      bitrate: 5000000,
      resolution: '1920x1080',
      frameRate: 30,
      audioEnabled: true,
      videoEnabled: true,
      commentaryEnabled: true,
      chatEnabled: true,
      recordingEnabled: true,
    };
    this.initializeSocket();
    this.generateMockData();
  }

  public static getInstance(): TournamentStreamingService {
    if (!TournamentStreamingService.instance) {
      TournamentStreamingService.instance = new TournamentStreamingService();
    }
    return TournamentStreamingService.instance;
  }

  private initializeSocket(): void {
    this.socket = io('http://localhost:8080', {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('TournamentStreamingService connected to server');
      this.isConnected = true;
      this.requestStreamingData();
    });

    this.socket.on('disconnect', () => {
      console.log('TournamentStreamingService disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('streaming-update', (data: any) => {
      this.handleStreamingUpdate(data);
    });

    this.socket.on('commentary-update', (data: any) => {
      this.handleCommentaryUpdate(data);
    });

    this.socket.on('chat-message', (data: any) => {
      this.handleChatMessage(data);
    });

    this.socket.on('viewer-update', (data: any) => {
      this.handleViewerUpdate(data);
    });
  }

  private handleStreamingUpdate(data: any): void {
    if (this.currentSession) {
      this.currentSession.stats = { ...this.currentSession.stats, ...data.stats };
      this.currentSession.status = data.status;
    }
  }

  private handleCommentaryUpdate(data: any): void {
    if (this.currentSession) {
      this.currentSession.commentary.push(data);
    }
  }

  private handleChatMessage(data: any): void {
    if (this.currentSession) {
      this.currentSession.chat.push(data);
    }
  }

  private handleViewerUpdate(data: any): void {
    if (this.currentSession) {
      this.currentSession.stats.viewers = data.viewers;
      this.currentSession.stats.peakViewers = Math.max(
        this.currentSession.stats.peakViewers,
        data.viewers
      );
    }
  }

  private requestStreamingData(): void {
    this.socket?.emit('request-streaming-data');
  }

  private generateMockData(): void {
    this.currentSession = {
      id: 'stream-1',
      tournamentId: 't1',
      matchId: 'm1',
      title: 'Spring Championship Finals - Live Stream',
      status: 'live',
      startTime: new Date(Date.now() - 30 * 60 * 1000), // Started 30 minutes ago
      config: this.config,
      stats: {
        viewers: 1250,
        peakViewers: 1800,
        averageWatchTime: 25.5,
        chatMessages: 3420,
        donations: 1250,
        streamUptime: 1800,
        bitrate: 5000000,
        frameRate: 30,
        droppedFrames: 12,
        audioLevel: 0.8,
        videoQuality: 0.95,
      },
      settings: {
        title: 'Spring Championship Finals - Live Stream',
        description: 'Watch the epic finals of the Spring Championship 2024!',
        tags: ['pool', 'tournament', 'finals', 'live'],
        visibility: 'public',
        allowChat: true,
        moderateChat: true,
        allowDonations: true,
        thumbnail: '/images/stream-thumbnail.jpg',
      },
      commentary: [
        {
          id: 'c1',
          type: 'shot',
          timestamp: new Date(Date.now() - 5000),
          message: 'Incredible bank shot by Alex Chen! That was a 3-rail shot that found the corner pocket perfectly.',
          player: 'Alex Chen',
          excitement: 9,
          priority: 'high',
        },
        {
          id: 'c2',
          type: 'analysis',
          timestamp: new Date(Date.now() - 3000),
          message: 'Sarah Kim is setting up for a difficult combination shot. This could be the turning point of the match.',
          player: 'Sarah Kim',
          excitement: 7,
          priority: 'medium',
        },
      ],
      chat: [
        {
          id: 'chat1',
          userId: 'u1',
          username: 'PoolFan2024',
          message: 'Amazing shot! 🔥',
          timestamp: new Date(Date.now() - 2000),
          type: 'user',
          isHighlighted: false,
        },
        {
          id: 'chat2',
          userId: 'u2',
          username: 'Moderator',
          message: 'Welcome everyone to the finals!',
          timestamp: new Date(Date.now() - 1000),
          type: 'moderator',
          isHighlighted: true,
        },
      ],
      highlights: [
        'Amazing 3-rail bank shot by Alex Chen',
        'Incredible comeback by Sarah Kim',
        'Perfect safety shot under pressure',
      ],
    };
  }

  public async startStream(tournamentId: string, matchId?: string): Promise<boolean> {
    try {
      // Request media permissions
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });

      // Start recording if enabled
      if (this.config.recordingEnabled) {
        this.startRecording();
      }

      // Update session status
      if (this.currentSession) {
        this.currentSession.status = 'live';
        this.currentSession.startTime = new Date();
        this.currentSession.tournamentId = tournamentId;
        this.currentSession.matchId = matchId;
      }

      this.isStreaming = true;
      this.socket?.emit('stream-started', {
        tournamentId,
        matchId,
        config: this.config,
      });

      return true;
    } catch (error) {
      console.error('Failed to start stream:', error);
      return false;
    }
  }

  public stopStream(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }

    if (this.currentSession) {
      this.currentSession.status = 'ended';
      this.currentSession.endTime = new Date();
    }

    this.isStreaming = false;
    this.socket?.emit('stream-stopped');
  }

  public pauseStream(): void {
    if (this.currentSession) {
      this.currentSession.status = 'paused';
    }
    this.socket?.emit('stream-paused');
  }

  public resumeStream(): void {
    if (this.currentSession) {
      this.currentSession.status = 'live';
    }
    this.socket?.emit('stream-resumed');
  }

  private startRecording(): void {
    if (this.mediaStream && this.config.recordingEnabled) {
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: 'video/webm;codecs=vp9',
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        if (this.currentSession) {
          this.currentSession.recordingUrl = url;
        }
        this.recordedChunks = [];
      };

      this.mediaRecorder.start(1000); // Record in 1-second chunks
    }
  }

  public addCommentary(event: Omit<CommentaryEvent, 'id' | 'timestamp'>): void {
    const commentaryEvent: CommentaryEvent = {
      ...event,
      id: `commentary-${Date.now()}`,
      timestamp: new Date(),
    };

    if (this.currentSession) {
      this.currentSession.commentary.push(commentaryEvent);
    }

    this.socket?.emit('commentary-added', commentaryEvent);
  }

  public sendChatMessage(message: string, userId: string, username: string): void {
    const chatMessage: ChatMessage = {
      id: `chat-${Date.now()}`,
      userId,
      username,
      message,
      timestamp: new Date(),
      type: 'user',
      isHighlighted: false,
    };

    if (this.currentSession) {
      this.currentSession.chat.push(chatMessage);
    }

    this.socket?.emit('chat-message-sent', chatMessage);
  }

  public updateConfig(newConfig: Partial<StreamConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.socket?.emit('streaming-config-updated', this.config);
  }

  public getCurrentSession(): StreamSession | null {
    return this.currentSession;
  }

  public getConfig(): StreamConfig {
    return { ...this.config };
  }

  public isConnected(): boolean {
    return this._isConnected;
  }

  public isStreaming(): boolean {
    return this.isStreaming;
  }

  public getStreamStats(): StreamStats | null {
    return this.currentSession?.stats || null;
  }

  public getCommentary(): CommentaryEvent[] {
    return this.currentSession?.commentary || [];
  }

  public getChatMessages(): ChatMessage[] {
    return this.currentSession?.chat || [];
  }

  public getHighlights(): string[] {
    return this.currentSession?.highlights || [];
  }

  public addHighlight(highlight: string): void {
    if (this.currentSession) {
      this.currentSession.highlights.push(highlight);
    }
  }

  public updateBroadcastSettings(settings: Partial<BroadcastSettings>): void {
    if (this.currentSession) {
      this.currentSession.settings = { ...this.currentSession.settings, ...settings };
    }
    this.socket?.emit('broadcast-settings-updated', settings);
  }

  public disconnect(): void {
    this.socket?.disconnect();
  }
}

export default TournamentStreamingService; 