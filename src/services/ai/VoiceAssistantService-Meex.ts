import { EventEmitter } from 'events';
import { Socket } from 'socket.io-client';
import io from 'socket.io-client';

export interface VoiceCommand {
  id: string;
  text: string;
  confidence: number;
  intent: VoiceIntent;
  entities: VoiceEntity[];
  timestamp: Date;
  userId: string;
  sessionId: string;
}

export interface VoiceIntent {
  name: string;
  confidence: number;
  category: 'game_control' | 'navigation' | 'information' | 'social' | 'settings';
  action: string;
  parameters: Record<string, any>;
}

export interface VoiceEntity {
  type: 'player' | 'venue' | 'tournament' | 'action' | 'number' | 'time' | 'location';
  value: string;
  confidence: number;
  start: number;
  end: number;
}

export interface VoiceResponse {
  id: string;
  text: string;
  audioUrl?: string;
  action?: string;
  parameters?: Record<string, any>;
  timestamp: Date;
  commandId: string;
}

export interface VoiceSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  commands: VoiceCommand[];
  responses: VoiceResponse[];
  isActive: boolean;
  settings: VoiceSettings;
}

export interface VoiceSettings {
  enabled: boolean;
  language: string;
  voiceModel: string;
  speed: number;
  volume: number;
  wakeWord: string;
  autoListen: boolean;
  noiseReduction: boolean;
  echoCancellation: boolean;
  commands: VoiceCommandConfig[];
}

export interface VoiceCommandConfig {
  phrase: string;
  action: string;
  category: string;
  enabled: boolean;
  customResponse?: string;
}

export interface VoiceAnalytics {
  totalCommands: number;
  successfulCommands: number;
  failedCommands: number;
  averageConfidence: number;
  popularCommands: string[];
  userSessions: number;
  averageSessionDuration: number;
  languageDistribution: Record<string, number>;
  intentAccuracy: Record<string, number>;
}

class VoiceAssistantService extends EventEmitter {
  private static instance: VoiceAssistantService;
  private socket: Socket | null = null;
  private _isConnected = false;
  private _isListening = false;
  private _isSpeaking = false;
  
  private sessions: Map<string, VoiceSession> = new Map();
  private commands: VoiceCommand[] = [];
  private responses: VoiceResponse[] = [];
  private settings: VoiceSettings = {
    enabled: true,
    language: 'en-US',
    voiceModel: 'neural',
    speed: 1.0,
    volume: 0.8,
    wakeWord: 'dojo',
    autoListen: false,
    noiseReduction: true,
    echoCancellation: true,
    commands: []
  };

  private analytics: VoiceAnalytics = {
    totalCommands: 0,
    successfulCommands: 0,
    failedCommands: 0,
    averageConfidence: 0,
    popularCommands: [],
    userSessions: 0,
    averageSessionDuration: 0,
    languageDistribution: {},
    intentAccuracy: {}
  };

  private recognition: any = null;
  private synthesis: any = null;
  private currentSession: VoiceSession | null = null;

  private constructor() {
    super();
    this.initializeWebSocket();
    this.initializeSpeechRecognition();
    this.initializeSpeechSynthesis();
    this.loadDefaultCommands();
  }

  public static getInstance(): VoiceAssistantService {
    if (!VoiceAssistantService.instance) {
      VoiceAssistantService.instance = new VoiceAssistantService();
    }
    return VoiceAssistantService.instance;
  }

  private initializeWebSocket(): void {
    try {
      this.socket = io('http://localhost:8080', {
        transports: ['websocket'],
        timeout: 10000
      });

      this.socket.on('connect', () => {
        this._isConnected = true;
        this.socket?.emit('voice:join', { service: 'voice-assistant' });
        this.emit('connected');
      });

      this.socket.on('disconnect', () => {
        this._isConnected = false;
        this.emit('disconnected');
      });

      this.socket.on('voice:command_processed', (data: VoiceResponse) => {
        this.addResponse(data);
        this.emit('commandProcessed', data);
      });

      this.socket.on('voice:error', (data: { error: string; commandId?: string }) => {
        this.emit('error', data);
      });

    } catch (error) {
      console.error('WebSocket initialization failed:', error);
    }
  }

  private initializeSpeechRecognition(): void {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.settings.language;

      this.recognition.onstart = () => {
        this._isListening = true;
        this.emit('listeningStarted');
      };

      this.recognition.onend = () => {
        this._isListening = false;
        this.emit('listeningEnded');
      };

      this.recognition.onresult = (event: any) => {
        const result = event.results[event.results.length - 1];
        if (result.isFinal) {
          const text = result[0].transcript;
          const confidence = result[0].confidence;
          this.processVoiceInput(text, confidence);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.emit('recognitionError', event.error);
      };
    }
  }

  private initializeSpeechSynthesis(): void {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }
  }

  private loadDefaultCommands(): void {
    this.settings.commands = [
      {
        phrase: 'start game',
        action: 'game.start',
        category: 'game_control',
        enabled: true
      },
      {
        phrase: 'pause game',
        action: 'game.pause',
        category: 'game_control',
        enabled: true
      },
      {
        phrase: 'end game',
        action: 'game.end',
        category: 'game_control',
        enabled: true
      },
      {
        phrase: 'take shot',
        action: 'game.shot',
        category: 'game_control',
        enabled: true
      },
      {
        phrase: 'show score',
        action: 'game.score',
        category: 'information',
        enabled: true
      },
      {
        phrase: 'show statistics',
        action: 'game.stats',
        category: 'information',
        enabled: true
      },
      {
        phrase: 'go to dashboard',
        action: 'navigation.dashboard',
        category: 'navigation',
        enabled: true
      },
      {
        phrase: 'open tournaments',
        action: 'navigation.tournaments',
        category: 'navigation',
        enabled: true
      },
      {
        phrase: 'find venue',
        action: 'navigation.venue',
        category: 'navigation',
        enabled: true
      },
      {
        phrase: 'send message',
        action: 'social.message',
        category: 'social',
        enabled: true
      },
      {
        phrase: 'voice settings',
        action: 'settings.voice',
        category: 'settings',
        enabled: true
      }
    ];
  }

  // Voice Input Processing
  private async processVoiceInput(text: string, confidence: number): Promise<void> {
    const command: VoiceCommand = {
      id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text.toLowerCase(),
      confidence,
      intent: await this.extractIntent(text),
      entities: await this.extractEntities(text),
      timestamp: new Date(),
      userId: 'current-user', // Replace with actual user ID
      sessionId: this.currentSession?.id || 'no-session'
    };

    this.addCommand(command);
    this.socket?.emit('voice:command', command);

    // Process command locally for immediate response
    const response = await this.processCommand(command);
    if (response) {
      this.speak(response.text);
    }
  }

  private async extractIntent(text: string): Promise<VoiceIntent> {
    // Simple intent extraction - in production, use NLP service
    const words = text.toLowerCase().split(' ');
    
    // Game control intents
    if (words.includes('start') && words.includes('game')) {
      return {
        name: 'start_game',
        confidence: 0.9,
        category: 'game_control',
        action: 'game.start',
        parameters: {}
      };
    }
    
    if (words.includes('pause') && words.includes('game')) {
      return {
        name: 'pause_game',
        confidence: 0.9,
        category: 'game_control',
        action: 'game.pause',
        parameters: {}
      };
    }
    
    if (words.includes('end') && words.includes('game')) {
      return {
        name: 'end_game',
        confidence: 0.9,
        category: 'game_control',
        action: 'game.end',
        parameters: {}
      };
    }
    
    if (words.includes('shot') || words.includes('take')) {
      return {
        name: 'take_shot',
        confidence: 0.8,
        category: 'game_control',
        action: 'game.shot',
        parameters: {}
      };
    }
    
    // Navigation intents
    if (words.includes('dashboard')) {
      return {
        name: 'navigate_dashboard',
        confidence: 0.9,
        category: 'navigation',
        action: 'navigation.dashboard',
        parameters: {}
      };
    }
    
    if (words.includes('tournament')) {
      return {
        name: 'navigate_tournaments',
        confidence: 0.9,
        category: 'navigation',
        action: 'navigation.tournaments',
        parameters: {}
      };
    }
    
    // Information intents
    if (words.includes('score')) {
      return {
        name: 'show_score',
        confidence: 0.9,
        category: 'information',
        action: 'game.score',
        parameters: {}
      };
    }
    
    if (words.includes('stat') || words.includes('stats')) {
      return {
        name: 'show_statistics',
        confidence: 0.8,
        category: 'information',
        action: 'game.stats',
        parameters: {}
      };
    }
    
    // Default intent
    return {
      name: 'unknown',
      confidence: 0.1,
      category: 'information',
      action: 'assistant.help',
      parameters: {}
    };
  }

  private async extractEntities(text: string): Promise<VoiceEntity[]> {
    const entities: VoiceEntity[] = [];
    const words = text.toLowerCase().split(' ');
    
    // Extract numbers
    const numberMatch = text.match(/\d+/);
    if (numberMatch) {
      entities.push({
        type: 'number',
        value: numberMatch[0],
        confidence: 0.9,
        start: text.indexOf(numberMatch[0]),
        end: text.indexOf(numberMatch[0]) + numberMatch[0].length
      });
    }
    
    // Extract player names (simple heuristic)
    const playerKeywords = ['player', 'opponent', 'challenger'];
    playerKeywords.forEach(keyword => {
      const index = words.indexOf(keyword);
      if (index !== -1 && index + 1 < words.length) {
        entities.push({
          type: 'player',
          value: words[index + 1],
          confidence: 0.7,
          start: text.indexOf(keyword),
          end: text.indexOf(keyword) + keyword.length + words[index + 1].length + 1
        });
      }
    });
    
    return entities;
  }

  private async processCommand(command: VoiceCommand): Promise<VoiceResponse | null> {
    const response: VoiceResponse = {
      id: `resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: '',
      action: command.intent.action,
      parameters: command.intent.parameters,
      timestamp: new Date(),
      commandId: command.id
    };

    switch (command.intent.action) {
      case 'game.start':
        response.text = 'Starting a new game. Good luck!';
        break;
      case 'game.pause':
        response.text = 'Game paused. Say "resume game" to continue.';
        break;
      case 'game.end':
        response.text = 'Ending the current game.';
        break;
      case 'game.shot':
        response.text = 'Taking your shot. Focus and aim carefully.';
        break;
      case 'game.score':
        response.text = 'Current score is displayed on screen.';
        break;
      case 'game.stats':
        response.text = 'Showing your game statistics.';
        break;
      case 'navigation.dashboard':
        response.text = 'Navigating to your dashboard.';
        break;
      case 'navigation.tournaments':
        response.text = 'Opening tournaments page.';
        break;
      case 'navigation.venue':
        response.text = 'Finding nearby venues.';
        break;
      case 'social.message':
        response.text = 'Opening message interface.';
        break;
      case 'settings.voice':
        response.text = 'Opening voice assistant settings.';
        break;
      case 'assistant.help':
        response.text = 'I can help you control games, navigate the app, and get information. Try saying "start game" or "show score".';
        break;
      default:
        response.text = 'I didn\'t understand that command. Try saying "help" for available commands.';
    }

    this.addResponse(response);
    return response;
  }

  // Speech Synthesis
  public speak(text: string): void {
    if (this.synthesis && this.settings.enabled) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = this.settings.speed;
      utterance.volume = this.settings.volume;
      utterance.lang = this.settings.language;
      
      utterance.onstart = () => {
        this._isSpeaking = true;
        this.emit('speakingStarted', text);
      };
      
      utterance.onend = () => {
        this._isSpeaking = false;
        this.emit('speakingEnded', text);
      };
      
      utterance.onerror = (event) => {
        this._isSpeaking = false;
        this.emit('speakingError', event);
      };
      
      this.synthesis.speak(utterance);
    }
  }

  public stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this._isSpeaking = false;
      this.emit('speakingStopped');
    }
  }

  // Voice Recognition Control
  public startListening(): void {
    if (this.recognition && this.settings.enabled && !this._isListening) {
      this.recognition.start();
    }
  }

  public stopListening(): void {
    if (this.recognition && this._isListening) {
      this.recognition.stop();
    }
  }

  public toggleListening(): void {
    if (this._isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  // Session Management
  public startSession(userId: string): VoiceSession {
    const session: VoiceSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      startTime: new Date(),
      commands: [],
      responses: [],
      isActive: true,
      settings: { ...this.settings }
    };

    this.sessions.set(session.id, session);
    this.currentSession = session;
    this.analytics.userSessions++;
    
    this.emit('sessionStarted', session);
    return session;
  }

  public endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.endTime = new Date();
      session.isActive = false;
      this.currentSession = null;
      this.emit('sessionEnded', session);
    }
  }

  // Settings Management
  public updateSettings(updates: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...updates };
    
    if (this.recognition) {
      this.recognition.lang = this.settings.language;
    }
    
    this.emit('settingsUpdated', this.settings);
  }

  public getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  // Data Management
  private addCommand(command: VoiceCommand): void {
    this.commands.push(command);
    this.analytics.totalCommands++;
    this.analytics.averageConfidence = 
      (this.analytics.averageConfidence * (this.analytics.totalCommands - 1) + command.confidence) / this.analytics.totalCommands;
    
    if (this.currentSession) {
      this.currentSession.commands.push(command);
    }
    
    this.emit('commandReceived', command);
  }

  private addResponse(response: VoiceResponse): void {
    this.responses.push(response);
    
    if (this.currentSession) {
      this.currentSession.responses.push(response);
    }
    
    this.emit('responseGenerated', response);
  }

  // Analytics
  public getAnalytics(): VoiceAnalytics {
    return { ...this.analytics };
  }

  public getCommands(): VoiceCommand[] {
    return [...this.commands];
  }

  public getResponses(): VoiceResponse[] {
    return [...this.responses];
  }

  public getSessions(): VoiceSession[] {
    return Array.from(this.sessions.values());
  }

  public getCurrentSession(): VoiceSession | null {
    return this.currentSession;
  }

  // Status
  public isConnected(): boolean {
    return this._isConnected;
  }

  public isListening(): boolean {
    return this._isListening;
  }

  public isSpeaking(): boolean {
    return this._isSpeaking;
  }

  public isEnabled(): boolean {
    return this.settings.enabled;
  }

  // Cleanup
  public disconnect(): void {
    this.socket?.disconnect();
    this.stopListening();
    this.stopSpeaking();
  }
}

export default VoiceAssistantService;
