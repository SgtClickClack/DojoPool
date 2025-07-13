import { io, Socket } from 'socket.io-client';
import { env } from '../../config/environment.backend';

export interface RefereeDecision {
  id: string;
  type: 'foul' | 'legal' | 'warning' | 'penalty' | 'disqualification';
  severity: 'minor' | 'major' | 'critical';
  description: string;
  rule: string;
  timestamp: Date;
  player: string;
  match: string;
  confidence: number;
  reviewed: boolean;
  overturned: boolean;
  explanation: string;
}

export interface RuleViolation {
  id: string;
  rule: string;
  description: string;
  penalty: string;
  points: number;
  category: 'technical' | 'behavioral' | 'safety';
}

export interface MatchAnalysis {
  id: string;
  match: string;
  decisions: RefereeDecision[];
  foulCount: number;
  warnings: number;
  penalties: number;
  accuracy: number;
  startTime: Date;
  endTime?: Date;
}

export interface RefereeConfig {
  sensitivity: number;
  autoReview: boolean;
  confidenceThreshold: number;
  rules: string[];
  enabled: boolean;
}

class AIRefereeService {
  private static instance: AIRefereeService;
  private socket: Socket | null = null;
  private isConnected = false;
  private decisions: RefereeDecision[] = [];
  private violations: RuleViolation[] = [];
  private analyses: MatchAnalysis[] = [];
  private config: RefereeConfig = {
    sensitivity: 0.8,
    autoReview: true,
    confidenceThreshold: 0.7,
    rules: ['standard', 'tournament', 'safety'],
    enabled: true
  };

  private constructor() {
    this.initializeWebSocket();
    this.loadMockData();
  }

  public static getInstance(): AIRefereeService {
    if (!AIRefereeService.instance) {
      AIRefereeService.instance = new AIRefereeService();
    }
    return AIRefereeService.instance;
  }

  private initializeWebSocket(): void {
    try {
      const wsUrl = env.WEBSOCKET_URL;
      this.socket = io(wsUrl, {
        transports: ['websocket'],
        timeout: 10000
      });
      this.socket.on('connect', () => {
        this.isConnected = true;
        this.socket?.emit('referee:join', { service: 'referee' });
      });
      this.socket.on('disconnect', () => {
        this.isConnected = false;
      });
      this.socket.on('referee:decision', (decision: RefereeDecision) => {
        this.addDecision(decision);
      });
      this.socket.on('referee:analysis', (analysis: MatchAnalysis) => {
        this.updateAnalysis(analysis);
      });
    } catch (error) {
      this.isConnected = false;
    }
  }

  // Decision Management
  public makeDecision(decision: Omit<RefereeDecision, 'id' | 'timestamp' | 'reviewed' | 'overturned'>): RefereeDecision {
    const newDecision: RefereeDecision = {
      ...decision,
      id: this.generateId(),
      timestamp: new Date(),
      reviewed: false,
      overturned: false
    };
    this.decisions.push(newDecision);
    this.socket?.emit('referee:decision_made', newDecision);
    return newDecision;
  }

  public reviewDecision(decisionId: string, overturned: boolean, explanation: string): void {
    const decision = this.decisions.find(d => d.id === decisionId);
    if (decision) {
      decision.reviewed = true;
      decision.overturned = overturned;
      decision.explanation = explanation;
      this.socket?.emit('referee:decision_reviewed', decision);
    }
  }

  public getDecisions(): RefereeDecision[] {
    return [...this.decisions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getDecisionsByMatch(matchId: string): RefereeDecision[] {
    return this.decisions.filter(d => d.match === matchId);
  }

  public getDecisionsByType(type: RefereeDecision['type']): RefereeDecision[] {
    return this.decisions.filter(d => d.type === type);
  }

  private addDecision(decision: RefereeDecision): void {
    const existingIndex = this.decisions.findIndex(d => d.id === decision.id);
    if (existingIndex !== -1) {
      this.decisions[existingIndex] = decision;
    } else {
      this.decisions.push(decision);
    }
  }

  // Rule Management
  public getViolations(): RuleViolation[] {
    return [...this.violations];
  }

  public addViolation(violation: Omit<RuleViolation, 'id'>): RuleViolation {
    const newViolation: RuleViolation = {
      ...violation,
      id: this.generateId()
    };
    this.violations.push(newViolation);
    return newViolation;
  }

  // Analysis Management
  public startAnalysis(matchId: string): MatchAnalysis {
    const analysis: MatchAnalysis = {
      id: this.generateId(),
      match: matchId,
      decisions: [],
      foulCount: 0,
      warnings: 0,
      penalties: 0,
      accuracy: 100,
      startTime: new Date()
    };
    this.analyses.push(analysis);
    this.socket?.emit('referee:analysis_started', analysis);
    return analysis;
  }

  public endAnalysis(analysisId: string): void {
    const analysis = this.analyses.find(a => a.id === analysisId);
    if (analysis) {
      analysis.endTime = new Date();
      this.updateAnalysisMetrics(analysis);
      this.socket?.emit('referee:analysis_ended', analysis);
    }
  }

  public getAnalyses(): MatchAnalysis[] {
    return [...this.analyses];
  }

  public getAnalysisById(id: string): MatchAnalysis | undefined {
    return this.analyses.find(a => a.id === id);
  }

  private updateAnalysis(analysis: MatchAnalysis): void {
    const index = this.analyses.findIndex(a => a.id === analysis.id);
    if (index !== -1) {
      this.analyses[index] = analysis;
    } else {
      this.analyses.push(analysis);
    }
  }

  private updateAnalysisMetrics(analysis: MatchAnalysis): void {
    const matchDecisions = this.getDecisionsByMatch(analysis.match);
    analysis.decisions = matchDecisions;
    analysis.foulCount = matchDecisions.filter(d => d.type === 'foul').length;
    analysis.warnings = matchDecisions.filter(d => d.type === 'warning').length;
    analysis.penalties = matchDecisions.filter(d => d.type === 'penalty').length;
    
    const reviewedDecisions = matchDecisions.filter(d => d.reviewed);
    if (reviewedDecisions.length > 0) {
      const correctDecisions = reviewedDecisions.filter(d => !d.overturned).length;
      analysis.accuracy = (correctDecisions / reviewedDecisions.length) * 100;
    }
  }

  // Configuration
  public getConfig(): RefereeConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<RefereeConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.socket?.emit('referee:config_updated', this.config);
  }

  // Mock Data
  private loadMockData(): void {
    this.decisions = [
      {
        id: 'dec1',
        type: 'foul',
        severity: 'minor',
        description: 'Ball touched with hand',
        rule: 'Rule 3.2 - Hand contact',
        timestamp: new Date(Date.now() - 300000),
        player: 'Player A',
        match: 'Match 1',
        confidence: 0.95,
        reviewed: true,
        overturned: false,
        explanation: 'Clear hand contact detected by AI'
      },
      {
        id: 'dec2',
        type: 'warning',
        severity: 'minor',
        description: 'Unsportsmanlike conduct',
        rule: 'Rule 5.1 - Conduct',
        timestamp: new Date(Date.now() - 180000),
        player: 'Player B',
        match: 'Match 1',
        confidence: 0.87,
        reviewed: false,
        overturned: false,
        explanation: 'Verbal abuse detected'
      }
    ];

    this.violations = [
      {
        id: 'viol1',
        rule: 'Rule 3.2',
        description: 'Hand contact with ball',
        penalty: 'Loss of turn',
        points: 1,
        category: 'technical'
      },
      {
        id: 'viol2',
        rule: 'Rule 5.1',
        description: 'Unsportsmanlike conduct',
        penalty: 'Warning',
        points: 0,
        category: 'behavioral'
      }
    ];

    this.analyses = [
      {
        id: 'analysis1',
        match: 'Match 1',
        decisions: this.decisions,
        foulCount: 1,
        warnings: 1,
        penalties: 0,
        accuracy: 100,
        startTime: new Date(Date.now() - 600000),
        endTime: new Date()
      }
    ];
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

export default AIRefereeService; 