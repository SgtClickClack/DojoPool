import { EventEmitter } from 'events';
import { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import { env } from '../../config/environment.backend';

export interface AIRefereeDecision {
  id: string;
  matchId: string;
  decisionType: 'foul' | 'warning' | 'penalty' | 'disqualification' | 'rule_clarification';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ruleReference: string;
  confidence: number;
  evidence: string[];
  playerId: string;
  explanation: string;
  appealable: boolean;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'appealed' | 'overturned';
}

export interface AIRefereeAnalysis {
  id: string;
  matchId: string;
  analysisType: 'shot_analysis' | 'rule_interpretation' | 'strategy_recommendation' | 'performance_assessment';
  content: string;
  insights: string[];
  recommendations: string[];
  confidence: number;
  context: any;
  timestamp: Date;
}

export interface AIRefereeConfig {
  enableRealTimeAnalysis: boolean;
  enablePredictiveDecisions: boolean;
  enableRuleLearning: boolean;
  confidenceThreshold: number;
  maxAnalysisDepth: number;
  enableAppeals: boolean;
  autoEscalation: boolean;
  notificationSettings: {
    decisions: boolean;
    analyses: boolean;
    appeals: boolean;
    systemAlerts: boolean;
  };
  ruleSet: 'standard' | 'tournament' | 'custom';
  customRules: string[];
}

export interface AIRefereeMetrics {
  totalDecisions: number;
  decisionsByType: Record<string, number>;
  averageConfidence: number;
  appealRate: number;
  overturnedDecisions: number;
  analysisAccuracy: number;
  responseTime: number;
  uptime: number;
  lastUpdated: Date;
}

class AdvancedAIRefereeService extends EventEmitter {
  private static instance: AdvancedAIRefereeService;
  private socket: Socket | null = null;
  private _isConnected = false;
  private decisions: AIRefereeDecision[] = [];
  private analyses: AIRefereeAnalysis[] = [];
  private config: AIRefereeConfig = {
    enableRealTimeAnalysis: true,
    enablePredictiveDecisions: true,
    enableRuleLearning: true,
    confidenceThreshold: 80,
    maxAnalysisDepth: 3,
    enableAppeals: true,
    autoEscalation: true,
    notificationSettings: {
      decisions: true,
      analyses: true,
      appeals: true,
      systemAlerts: true
    },
    ruleSet: 'tournament',
    customRules: []
  };

  private metrics: AIRefereeMetrics = {
    totalDecisions: 0,
    decisionsByType: {},
    averageConfidence: 0,
    appealRate: 0,
    overturnedDecisions: 0,
    analysisAccuracy: 95.5,
    responseTime: 150,
    uptime: 99.9,
    lastUpdated: new Date()
  };

  private constructor() {
    super();
    this.initializeWebSocket();
    this.loadMockData();
  }

  public static getInstance(): AdvancedAIRefereeService {
    if (!AdvancedAIRefereeService.instance) {
      AdvancedAIRefereeService.instance = new AdvancedAIRefereeService();
    }
    return AdvancedAIRefereeService.instance;
  }

  private initializeWebSocket(): void {
    try {
      const wsUrl = env.WEBSOCKET_URL;
      this.socket = io(wsUrl, {
        transports: ['websocket'],
        timeout: 10000
      });

      this.socket.on('connect', () => {
        this._isConnected = true;
        this.socket?.emit('ai_referee:join', { service: 'ai_referee' });
      });

      this.socket.on('disconnect', () => {
        this._isConnected = false;
      });
    } catch (error) {
      this._isConnected = false;
    }
  }

  public async makeDecision(decisionData: Omit<AIRefereeDecision, 'id' | 'timestamp' | 'status'>): Promise<AIRefereeDecision> {
    const decision: AIRefereeDecision = {
      ...decisionData,
      id: this.generateId(),
      timestamp: new Date(),
      status: 'pending'
    };

    this.decisions.push(decision);
    this.socket?.emit('ai_referee:decision_made', decision);
    this.emit('decisionMade', decision);
    return decision;
  }

  public async generateAnalysis(analysisData: Omit<AIRefereeAnalysis, 'id' | 'timestamp'>): Promise<AIRefereeAnalysis> {
    const analysis: AIRefereeAnalysis = {
      ...analysisData,
      id: this.generateId(),
      timestamp: new Date()
    };

    this.analyses.push(analysis);
    this.socket?.emit('ai_referee:analysis_generated', analysis);
    this.emit('analysisGenerated', analysis);
    return analysis;
  }

  public async updateConfig(newConfig: Partial<AIRefereeConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    this.socket?.emit('ai_referee:config_updated', this.config);
    this.emit('configUpdated', this.config);
  }

  public getDecisions(): AIRefereeDecision[] {
    return [...this.decisions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getAnalyses(): AIRefereeAnalysis[] {
    return [...this.analyses].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getConfig(): AIRefereeConfig {
    return { ...this.config };
  }

  public getMetrics(): AIRefereeMetrics {
    return { ...this.metrics };
  }

  public getConnectionStatus(): boolean {
    return this._isConnected;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private loadMockData(): void {
    this.decisions = [
      {
        id: 'decision1',
        matchId: 'match1',
        decisionType: 'foul',
        severity: 'medium',
        description: 'Cue ball scratched after hitting object ball',
        ruleReference: 'Rule 6.3 - Scratch Foul',
        confidence: 92,
        evidence: ['Video analysis shows cue ball entering pocket after contact'],
        playerId: 'player1',
        explanation: 'The cue ball was struck and subsequently entered a pocket, constituting a scratch foul.',
        appealable: true,
        timestamp: new Date(Date.now() - 3600000),
        status: 'confirmed'
      }
    ];

    this.analyses = [
      {
        id: 'analysis1',
        matchId: 'match1',
        analysisType: 'shot_analysis',
        content: 'Break shot analysis for frame 3',
        insights: ['Break speed was optimal at 18 mph'],
        recommendations: ['Consider slightly higher break speed'],
        confidence: 88,
        context: { frame: 3, breakSpeed: 18 },
        timestamp: new Date(Date.now() - 7200000)
      }
    ];
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this._isConnected = false;
  }
}

export default AdvancedAIRefereeService; 