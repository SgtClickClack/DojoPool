import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';

export interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  networkLatency: number;
  responseTime: number;
  activeConnections: number;
  cacheHitRate: number;
  databaseQueries: number;
  errorRate: number;
  timestamp: number;
}

export interface PredictiveInsight {
  id: string;
  type: 'match_outcome' | 'player_performance' | 'tournament_success' | 'revenue_forecast';
  confidence: number;
  prediction: string;
  factors: string[];
  impact: 'high' | 'medium' | 'low';
  timestamp: Date;
  expiryDate: Date;
}

export interface TournamentROI {
  tournamentId: string;
  totalInvestment: number;
  totalRevenue: number;
  netProfit: number;
  roiPercentage: number;
  breakEvenPoint: Date;
  projectedProfit: number;
  riskFactors: string[];
  recommendations: string[];
}

export interface ViewershipMetrics {
  peakViewers: number;
  averageViewers: number;
  totalWatchTime: number;
  engagementRate: number;
  retentionRate: number;
  geographicDistribution: Record<string, number>;
  deviceTypes: Record<string, number>;
  socialShares: number;
  chatActivity: number;
}

export interface PlayerPerformanceTrend {
  playerId: string;
  skillRating: number;
  winRate: number;
  averageScore: number;
  consistency: number;
  improvement: number;
  trend: 'improving' | 'declining' | 'stable';
  predictions: {
    nextMatchWinProbability: number;
    tournamentFinish: number;
    skillRatingIn30Days: number;
  };
}

export interface ReportTemplate {
  id: string;
  name: string;
  type: 'tournament' | 'player' | 'financial' | 'performance' | 'comprehensive';
  sections: string[];
  schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'on_demand';
  recipients: string[];
  format: 'pdf' | 'csv' | 'json' | 'html';
  autoGenerate: boolean;
}

export interface AnalyticsConfig {
  realTimeMonitoring: boolean;
  predictiveAnalytics: boolean;
  automatedReporting: boolean;
  performanceTracking: boolean;
  dataRetentionDays: number;
  alertThresholds: {
    cpuUsage: number;
    memoryUsage: number;
    errorRate: number;
    responseTime: number;
  };
  reportSchedules: ReportTemplate[];
}

class AdvancedAnalyticsService extends EventEmitter {
  private static instance: AdvancedAnalyticsService;
  private socket: Socket | null = null;
  private _isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;

  // Analytics state
  private performanceMetrics: PerformanceMetrics[] = [];
  private predictiveInsights: PredictiveInsight[] = [];
  private tournamentROIs: TournamentROI[] = [];
  private viewershipMetrics: ViewershipMetrics[] = [];
  private playerTrends: PlayerPerformanceTrend[] = [];
  private reportTemplates: ReportTemplate[] = [];

  // Configuration
  private config: AnalyticsConfig = {
    realTimeMonitoring: true,
    predictiveAnalytics: true,
    automatedReporting: true,
    performanceTracking: true,
    dataRetentionDays: 90,
    alertThresholds: {
      cpuUsage: 80,
      memoryUsage: 85,
      errorRate: 5,
      responseTime: 2000
    },
    reportSchedules: []
  };

  private constructor() {
    super();
    this.initializeWebSocket();
    this.loadMockData();
    this.startMonitoring();
  }

  public static getInstance(): AdvancedAnalyticsService {
    if (!AdvancedAnalyticsService.instance) {
      AdvancedAnalyticsService.instance = new AdvancedAnalyticsService();
    }
    return AdvancedAnalyticsService.instance;
  }

  private initializeWebSocket(): void {
    try {
      this.socket = io('http://localhost:8080', {
        transports: ['websocket'],
        timeout: 10000
      });

      this.socket.on('connect', () => {
        console.log('📊 Advanced Analytics service connected to WebSocket');
        this._isConnected = true;
        this.reconnectAttempts = 0;
        this.socket?.emit('analytics:join', { service: 'advanced_analytics' });
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Advanced Analytics service disconnected from WebSocket');
        this._isConnected = false;
        this.handleReconnection();
      });

      this.socket.on('analytics:performance_update', (data: PerformanceMetrics) => {
        this.addPerformanceMetric(data);
      });

      this.socket.on('analytics:insight_generated', (data: PredictiveInsight) => {
        this.addPredictiveInsight(data);
      });

      this.socket.on('analytics:roi_updated', (data: TournamentROI) => {
        this.updateTournamentROI(data);
      });

    } catch (error) {
      console.error('❌ Failed to initialize advanced analytics WebSocket:', error);
      this.handleReconnection();
    }
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.initializeWebSocket();
      }, this.reconnectInterval);
    }
  }

  // Performance Monitoring
  public async trackPerformance(metrics: PerformanceMetrics): Promise<void> {
    this.performanceMetrics.push(metrics);
    
    // Keep only recent metrics based on retention policy
    const cutoffTime = Date.now() - (this.config.dataRetentionDays * 24 * 60 * 60 * 1000);
    this.performanceMetrics = this.performanceMetrics.filter(m => m.timestamp > cutoffTime);

    // Check for performance alerts
    this.checkPerformanceAlerts(metrics);

    this.socket?.emit('analytics:performance_tracked', metrics);
    this.emit('performanceUpdate', metrics);
  }

  private checkPerformanceAlerts(metrics: PerformanceMetrics): void {
    const alerts = [];

    if (metrics.cpuUsage > this.config.alertThresholds.cpuUsage) {
      alerts.push({
        type: 'performance',
        severity: 'warning',
        message: `High CPU usage detected: ${metrics.cpuUsage}%`,
        metric: 'cpuUsage',
        value: metrics.cpuUsage,
        threshold: this.config.alertThresholds.cpuUsage
      });
    }

    if (metrics.memoryUsage > this.config.alertThresholds.memoryUsage) {
      alerts.push({
        type: 'performance',
        severity: 'warning',
        message: `High memory usage detected: ${metrics.memoryUsage}%`,
        metric: 'memoryUsage',
        value: metrics.memoryUsage,
        threshold: this.config.alertThresholds.memoryUsage
      });
    }

    if (metrics.errorRate > this.config.alertThresholds.errorRate) {
      alerts.push({
        type: 'performance',
        severity: 'critical',
        message: `High error rate detected: ${metrics.errorRate}%`,
        metric: 'errorRate',
        value: metrics.errorRate,
        threshold: this.config.alertThresholds.errorRate
      });
    }

    if (metrics.responseTime > this.config.alertThresholds.responseTime) {
      alerts.push({
        type: 'performance',
        severity: 'warning',
        message: `Slow response time detected: ${metrics.responseTime}ms`,
        metric: 'responseTime',
        value: metrics.responseTime,
        threshold: this.config.alertThresholds.responseTime
      });
    }

    alerts.forEach(alert => {
      this.socket?.emit('analytics:alert_triggered', alert);
      this.emit('performanceAlert', alert);
    });
  }

  // Predictive Analytics
  public async generatePredictiveInsight(type: PredictiveInsight['type'], data: any): Promise<PredictiveInsight> {
    const insight: PredictiveInsight = {
      id: this.generateId(),
      type,
      confidence: this.calculateConfidence(data),
      prediction: this.generatePrediction(type, data),
      factors: this.identifyFactors(type, data),
      impact: this.assessImpact(type, data),
      timestamp: new Date(),
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    this.predictiveInsights.push(insight);
    this.socket?.emit('analytics:insight_created', insight);
    this.emit('insightGenerated', insight);

    return insight;
  }

  private calculateConfidence(data: any): number {
    const dataQuality = Math.min(1, Object.keys(data).length / 10);
    const historicalAccuracy = 0.85;
    return Math.round((dataQuality * 0.4 + historicalAccuracy * 0.6) * 100);
  }

  private generatePrediction(type: PredictiveInsight['type'], data: any): string {
    switch (type) {
      case 'match_outcome':
        return `Player ${data.playerId} has ${data.winProbability}% chance of winning`;
      case 'player_performance':
        return `Player ${data.playerId} expected to improve by ${data.improvement} points`;
      case 'tournament_success':
        return `Tournament ${data.tournamentId} projected ${data.successRate}% completion rate`;
      case 'revenue_forecast':
        return `Projected revenue: $${data.projectedRevenue}`;
      default:
        return 'Prediction analysis in progress...';
    }
  }

  private identifyFactors(type: PredictiveInsight['type'], data: any): string[] {
    const factors = [];
    
    switch (type) {
      case 'match_outcome':
        factors.push('Historical record', 'Recent form', 'Skill rating');
        break;
      case 'player_performance':
        factors.push('Training frequency', 'Match experience', 'Physical condition');
        break;
      case 'tournament_success':
        factors.push('Player registration', 'Prize pool', 'Marketing efforts');
        break;
      case 'revenue_forecast':
        factors.push('Ticket sales', 'Sponsorship', 'Merchandise sales');
        break;
    }

    return factors;
  }

  private assessImpact(type: PredictiveInsight['type'], data: any): 'high' | 'medium' | 'low' {
    const confidence = this.calculateConfidence(data);
    
    if (confidence > 80) return 'high';
    if (confidence > 60) return 'medium';
    return 'low';
  }

  // Tournament ROI Analysis
  public async calculateTournamentROI(tournamentId: string, data: any): Promise<TournamentROI> {
    const totalInvestment = data.investment || 0;
    const totalRevenue = data.revenue || 0;
    const netProfit = totalRevenue - totalInvestment;
    const roiPercentage = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;

    const roi: TournamentROI = {
      tournamentId,
      totalInvestment,
      totalRevenue,
      netProfit,
      roiPercentage,
      breakEvenPoint: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      projectedProfit: netProfit * 1.2,
      riskFactors: this.identifyRiskFactors(data),
      recommendations: this.generateRecommendations(data)
    };

    this.updateTournamentROI(roi);
    return roi;
  }

  private identifyRiskFactors(data: any): string[] {
    const risks = [];
    
    if (data.playerCount < 16) risks.push('Low player participation');
    if (data.prizePool < 1000) risks.push('Small prize pool');
    if (data.venueCapacity < 100) risks.push('Limited venue capacity');
    
    return risks;
  }

  private generateRecommendations(data: any): string[] {
    const recommendations = [];
    
    if (data.playerCount < 16) recommendations.push('Increase marketing efforts');
    if (data.prizePool < 1000) recommendations.push('Seek additional sponsors');
    if (data.venueCapacity < 100) recommendations.push('Explore larger venues');
    
    return recommendations;
  }

  // Viewership Analytics
  public async trackViewership(metrics: ViewershipMetrics): Promise<void> {
    this.viewershipMetrics.push(metrics);
    this.socket?.emit('analytics:viewership_tracked', metrics);
    this.emit('viewershipUpdate', metrics);
  }

  // Player Performance Trends
  public async analyzePlayerTrend(playerId: string, data: any): Promise<PlayerPerformanceTrend> {
    const trend: PlayerPerformanceTrend = {
      playerId,
      skillRating: data.skillRating || 0,
      winRate: data.winRate || 0,
      averageScore: data.averageScore || 0,
      consistency: this.calculateConsistency(data),
      improvement: this.calculateImprovement(data),
      trend: this.determineTrend(data),
      predictions: {
        nextMatchWinProbability: this.predictNextMatchWin(data),
        tournamentFinish: this.predictTournamentFinish(data),
        skillRatingIn30Days: this.predictSkillRating(data)
      }
    };

    this.playerTrends.push(trend);
    this.socket?.emit('analytics:player_trend_analyzed', trend);
    this.emit('playerTrendUpdate', trend);

    return trend;
  }

  private calculateConsistency(data: any): number {
    // Mock consistency calculation based on performance variance
    const performances = data.recentPerformances || [];
    if (performances.length === 0) return 0;
    
    const mean = performances.reduce((sum: number, p: number) => sum + p, 0) / performances.length;
    const variance = performances.reduce((sum: number, p: number) => sum + Math.pow(p - mean, 2), 0) / performances.length;
    const standardDeviation = Math.sqrt(variance);
    
    return Math.max(0, 100 - (standardDeviation / mean) * 100);
  }

  private calculateImprovement(data: any): number {
    // Mock improvement calculation
    const recentPerformance = data.recentPerformance || 0;
    const historicalAverage = data.historicalAverage || 0;
    
    if (historicalAverage === 0) return 0;
    return ((recentPerformance - historicalAverage) / historicalAverage) * 100;
  }

  private determineTrend(data: any): 'improving' | 'declining' | 'stable' {
    const improvement = this.calculateImprovement(data);
    
    if (improvement > 5) return 'improving';
    if (improvement < -5) return 'declining';
    return 'stable';
  }

  private predictNextMatchWin(data: any): number {
    // Mock win probability prediction
    const baseWinRate = data.winRate || 0.5;
    const opponentStrength = data.opponentStrength || 0.5;
    const recentForm = data.recentForm || 0.5;
    
    return Math.min(95, Math.max(5, (baseWinRate * 0.4 + (1 - opponentStrength) * 0.3 + recentForm * 0.3) * 100));
  }

  private predictTournamentFinish(data: any): number {
    // Mock tournament finish prediction
    const skillRating = data.skillRating || 0;
    const tournamentSize = data.tournamentSize || 16;
    
    // Higher skill rating = better finish position
    const normalizedRating = Math.min(1, skillRating / 2000);
    return Math.max(1, Math.round(tournamentSize * (1 - normalizedRating)));
  }

  private predictSkillRating(data: any): number {
    // Mock skill rating prediction
    const currentRating = data.skillRating || 0;
    const improvement = this.calculateImprovement(data);
    
    return Math.max(0, currentRating + (currentRating * improvement / 100));
  }

  // Automated Reporting
  public async createReportTemplate(template: Omit<ReportTemplate, 'id'>): Promise<ReportTemplate> {
    const newTemplate: ReportTemplate = {
      ...template,
      id: this.generateId()
    };

    this.reportTemplates.push(newTemplate);
    this.socket?.emit('analytics:report_template_created', newTemplate);
    return newTemplate;
  }

  public async generateReport(templateId: string, data: any): Promise<any> {
    const template = this.reportTemplates.find(t => t.id === templateId);
    if (!template) throw new Error('Report template not found');

    const report = {
      id: this.generateId(),
      templateId,
      generatedAt: new Date(),
      data: this.compileReportData(template, data),
      format: template.format
    };

    this.socket?.emit('analytics:report_generated', report);
    this.emit('reportGenerated', report);

    return report;
  }

  private compileReportData(template: ReportTemplate, data: any): any {
    const reportData: any = {};

    template.sections.forEach(section => {
      switch (section) {
        case 'performance':
          reportData.performance = this.getPerformanceSummary();
          break;
        case 'predictions':
          reportData.predictions = this.getPredictiveInsightsSummary();
          break;
        case 'roi':
          reportData.roi = this.getROISummary();
          break;
        case 'viewership':
          reportData.viewership = this.getViewershipSummary();
          break;
        case 'player_trends':
          reportData.playerTrends = this.getPlayerTrendsSummary();
          break;
      }
    });

    return reportData;
  }

  // Data Retrieval Methods
  public getPerformanceMetrics(): PerformanceMetrics[] {
    return [...this.performanceMetrics];
  }

  public getPredictiveInsights(): any {
    return {
      total: this.predictiveInsights.length,
      insights: this.predictiveInsights,
      lastUpdated: new Date()
    };
  }

  public getTournamentROIs(): TournamentROI[] {
    return [...this.tournamentROIs];
  }

  public getViewershipMetrics(): ViewershipMetrics[] {
    return [...this.viewershipMetrics];
  }

  public getPlayerTrends(): PlayerPerformanceTrend[] {
    return [...this.playerTrends];
  }

  public getReportTemplates(): ReportTemplate[] {
    return [...this.reportTemplates];
  }

  public getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  // Utility Methods
  private addPerformanceMetric(metric: PerformanceMetrics): void {
    this.performanceMetrics.push(metric);
  }

  private addPredictiveInsight(insight: PredictiveInsight): void {
    this.predictiveInsights.push(insight);
  }

  private updateTournamentROI(roi: TournamentROI): void {
    const index = this.tournamentROIs.findIndex(r => r.tournamentId === roi.tournamentId);
    if (index !== -1) {
      this.tournamentROIs[index] = roi;
    } else {
      this.tournamentROIs.push(roi);
    }
  }

  private getPerformanceSummary(): any {
    if (this.performanceMetrics.length === 0) return null;

    const latest = this.performanceMetrics[this.performanceMetrics.length - 1];
    const average = this.performanceMetrics.reduce((sum, m) => ({
      cpuUsage: sum.cpuUsage + m.cpuUsage,
      memoryUsage: sum.memoryUsage + m.memoryUsage,
      responseTime: sum.responseTime + m.responseTime,
      errorRate: sum.errorRate + m.errorRate
    }), { cpuUsage: 0, memoryUsage: 0, responseTime: 0, errorRate: 0 });

    const count = this.performanceMetrics.length;
    return {
      current: latest,
      average: {
        cpuUsage: average.cpuUsage / count,
        memoryUsage: average.memoryUsage / count,
        responseTime: average.responseTime / count,
        errorRate: average.errorRate / count
      },
      trend: this.calculatePerformanceTrend()
    };
  }

  private getPredictiveInsightsSummary(): any {
    return {
      total: this.predictiveInsights.length,
      byType: this.predictiveInsights.reduce((acc, insight) => {
        acc[insight.type] = (acc[insight.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recent: this.predictiveInsights.slice(-5)
    };
  }

  private getROISummary(): any {
    if (this.tournamentROIs.length === 0) return null;

    const totalInvestment = this.tournamentROIs.reduce((sum, roi) => sum + roi.totalInvestment, 0);
    const totalRevenue = this.tournamentROIs.reduce((sum, roi) => sum + roi.totalRevenue, 0);
    const totalProfit = this.tournamentROIs.reduce((sum, roi) => sum + roi.netProfit, 0);

    return {
      totalTournaments: this.tournamentROIs.length,
      totalInvestment,
      totalRevenue,
      totalProfit,
      averageROI: totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0,
      topPerformers: this.tournamentROIs
        .sort((a, b) => b.roiPercentage - a.roiPercentage)
        .slice(0, 3)
    };
  }

  private getViewershipSummary(): any {
    if (this.viewershipMetrics.length === 0) return null;

    const latest = this.viewershipMetrics[this.viewershipMetrics.length - 1];
    const average = this.viewershipMetrics.reduce((sum, m) => ({
      peakViewers: sum.peakViewers + m.peakViewers,
      averageViewers: sum.averageViewers + m.averageViewers,
      engagementRate: sum.engagementRate + m.engagementRate
    }), { peakViewers: 0, averageViewers: 0, engagementRate: 0 });

    const count = this.viewershipMetrics.length;
    return {
      current: latest,
      average: {
        peakViewers: average.peakViewers / count,
        averageViewers: average.averageViewers / count,
        engagementRate: average.engagementRate / count
      }
    };
  }

  private getPlayerTrendsSummary(): any {
    if (this.playerTrends.length === 0) return null;

    const improving = this.playerTrends.filter(p => p.trend === 'improving').length;
    const declining = this.playerTrends.filter(p => p.trend === 'declining').length;
    const stable = this.playerTrends.filter(p => p.trend === 'stable').length;

    return {
      totalPlayers: this.playerTrends.length,
      improving,
      declining,
      stable,
      topPerformers: this.playerTrends
        .sort((a, b) => b.skillRating - a.skillRating)
        .slice(0, 5)
    };
  }

  private calculatePerformanceTrend(): 'improving' | 'declining' | 'stable' {
    if (this.performanceMetrics.length < 2) return 'stable';

    const recent = this.performanceMetrics.slice(-5);
    const older = this.performanceMetrics.slice(-10, -5);

    if (recent.length === 0 || older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, m) => sum + m.responseTime, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.responseTime, 0) / older.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (change < -10) return 'improving';
    if (change > 10) return 'declining';
    return 'stable';
  }

  private startMonitoring(): void {
    if (!this.config.realTimeMonitoring) return;

    setInterval(() => {
      this.trackPerformance(this.generateMockPerformanceMetrics());
    }, 30000); // Every 30 seconds

    setInterval(() => {
      this.cleanupExpiredInsights();
    }, 3600000); // Every hour
  }

  private generateMockPerformanceMetrics(): PerformanceMetrics {
    return {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      networkLatency: Math.random() * 1000,
      responseTime: Math.random() * 5000,
      activeConnections: Math.floor(Math.random() * 1000),
      cacheHitRate: Math.random() * 100,
      databaseQueries: Math.floor(Math.random() * 1000),
      errorRate: Math.random() * 10,
      timestamp: Date.now()
    };
  }

  private cleanupExpiredInsights(): void {
    const now = new Date();
    this.predictiveInsights = this.predictiveInsights.filter(insight => 
      insight.expiryDate > now
    );
  }

  private loadMockData(): void {
    this.predictiveInsights = [
      {
        id: 'insight1',
        type: 'match_outcome',
        confidence: 85,
        prediction: 'Player A has 75% chance of winning against Player B',
        factors: ['Historical record', 'Recent form', 'Skill rating'],
        impact: 'high',
        timestamp: new Date(),
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    ];

    this.reportTemplates = [
      {
        id: 'template1',
        name: 'Tournament Performance Report',
        type: 'tournament',
        sections: ['performance', 'roi', 'viewership'],
        schedule: 'weekly',
        recipients: ['admin@dojopool.com'],
        format: 'pdf',
        autoGenerate: true
      }
    ];
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  public getConnectionStatus(): boolean {
    return this._isConnected;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this._isConnected = false;
  }

  private updatePredictiveInsights(insights: PredictiveInsight[]): void {
    this.predictiveInsights = insights;
    this.emit('predictiveInsightsUpdated', insights);
  }

  private updatePerformanceMetrics(metrics: PerformanceMetrics): void {
    this.performanceMetrics.push(metrics);
    this.emit('performanceMetricsUpdated', metrics);
  }
}

export default AdvancedAnalyticsService; 