import { io, Socket } from 'socket.io-client';

export interface SecurityAlert {
  id: string;
  type: 'fraud' | 'suspicious_activity' | 'security_breach' | 'unauthorized_access' | 'data_leak';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  source: string;
  affectedUsers?: string[];
  affectedTournaments?: string[];
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  evidence?: string[];
  riskScore: number;
  automatedAction?: string;
}

export interface FraudPattern {
  id: string;
  name: string;
  description: string;
  pattern: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  detectionRules: string[];
  mitigationActions: string[];
  lastDetected?: Date;
  detectionCount: number;
  accuracy: number;
}

export interface SecurityEvent {
  id: string;
  type: 'login' | 'transaction' | 'game_action' | 'api_call' | 'file_access';
  userId?: string;
  tournamentId?: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  location?: string;
  success: boolean;
  details: any;
  riskScore: number;
  flagged: boolean;
}

export interface SecurityMetrics {
  totalAlerts: number;
  openAlerts: number;
  resolvedAlerts: number;
  falsePositives: number;
  averageResponseTime: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  lastIncident?: Date;
  securityScore: number;
  complianceStatus: 'compliant' | 'warning' | 'non_compliant';
}

export interface SecurityConfig {
  fraudDetectionEnabled: boolean;
  realTimeMonitoring: boolean;
  automatedActions: boolean;
  alertThresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  monitoringIntervals: {
    fraud: number;
    security: number;
    compliance: number;
  };
  notificationSettings: {
    email: boolean;
    sms: boolean;
    push: boolean;
    webhook: boolean;
  };
}

class TournamentSecurityService {
  private static instance: TournamentSecurityService;
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;

  // Security state
  private alerts: SecurityAlert[] = [];
  private fraudPatterns: FraudPattern[] = [];
  private securityEvents: SecurityEvent[] = [];
  private metrics: SecurityMetrics = {
    totalAlerts: 0,
    openAlerts: 0,
    resolvedAlerts: 0,
    falsePositives: 0,
    averageResponseTime: 0,
    threatLevel: 'low',
    securityScore: 85,
    complianceStatus: 'compliant'
  };

  // Configuration
  private config: SecurityConfig = {
    fraudDetectionEnabled: true,
    realTimeMonitoring: true,
    automatedActions: true,
    alertThresholds: {
      low: 0.3,
      medium: 0.6,
      high: 0.8,
      critical: 0.9
    },
    monitoringIntervals: {
      fraud: 5000,
      security: 3000,
      compliance: 10000
    },
    notificationSettings: {
      email: true,
      sms: false,
      push: true,
      webhook: true
    }
  };

  private constructor() {
    this.initializeWebSocket();
    this.loadMockData();
    this.startMonitoring();
  }

  public static getInstance(): TournamentSecurityService {
    if (!TournamentSecurityService.instance) {
      TournamentSecurityService.instance = new TournamentSecurityService();
    }
    return TournamentSecurityService.instance;
  }

  private initializeWebSocket(): void {
    try {
      this.socket = io('http://localhost:8080', {
        transports: ['websocket'],
        timeout: 10000
      });

      this.socket.on('connect', () => {
        console.log('🔒 Security service connected to WebSocket');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.socket?.emit('security:join', { service: 'security' });
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Security service disconnected from WebSocket');
        this.isConnected = false;
        this.handleReconnection();
      });

      this.socket.on('security:alert_created', (data: SecurityAlert) => {
        this.addAlert(data);
      });

      this.socket.on('security:event_detected', (data: SecurityEvent) => {
        this.addSecurityEvent(data);
      });

      this.socket.on('security:pattern_updated', (data: FraudPattern) => {
        this.updateFraudPattern(data);
      });

      this.socket.on('security:metrics_update', (data: SecurityMetrics) => {
        this.updateMetrics(data);
      });

    } catch (error) {
      console.error('❌ Failed to initialize security WebSocket:', error);
      this.handleReconnection();
    }
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect security service (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.initializeWebSocket();
      }, this.reconnectInterval);
    } else {
      console.error('❌ Max reconnection attempts reached for security service');
    }
  }

  // Alert Management
  public async createAlert(alert: Omit<SecurityAlert, 'id' | 'timestamp'>): Promise<SecurityAlert> {
    const newAlert: SecurityAlert = {
      ...alert,
      id: this.generateId(),
      timestamp: new Date()
    };

    this.alerts.push(newAlert);
    this.socket?.emit('security:alert_created', newAlert);
    this.recalculateMetrics();

    // Trigger automated actions for high/critical alerts
    if (alert.severity === 'high' || alert.severity === 'critical') {
      this.triggerAutomatedAction(newAlert);
    }

    return newAlert;
  }

  public async updateAlertStatus(alertId: string, status: SecurityAlert['status']): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = status;
      this.socket?.emit('security:alert_updated', alert);
      this.recalculateMetrics();
    }
  }

  public getAlerts(): SecurityAlert[] {
    return [...this.alerts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getAlertById(id: string): SecurityAlert | undefined {
    return this.alerts.find(a => a.id === id);
  }

  public getAlertsBySeverity(severity: SecurityAlert['severity']): SecurityAlert[] {
    return this.alerts.filter(a => a.severity === severity);
  }

  private addAlert(alert: SecurityAlert): void {
    const existingIndex = this.alerts.findIndex(a => a.id === alert.id);
    if (existingIndex !== -1) {
      this.alerts[existingIndex] = alert;
    } else {
      this.alerts.push(alert);
    }
    this.recalculateMetrics();
  }

  // Fraud Pattern Management
  public async createFraudPattern(pattern: Omit<FraudPattern, 'id' | 'detectionCount' | 'accuracy'>): Promise<FraudPattern> {
    const newPattern: FraudPattern = {
      ...pattern,
      id: this.generateId(),
      detectionCount: 0,
      accuracy: 0.85
    };

    this.fraudPatterns.push(newPattern);
    this.socket?.emit('security:pattern_created', newPattern);
    this.recalculateMetrics();

    return newPattern;
  }

  public updateFraudPattern(pattern: FraudPattern): void {
    const index = this.fraudPatterns.findIndex(p => p.id === pattern.id);
    if (index !== -1) {
      this.fraudPatterns[index] = pattern;
    }
  }

  public getFraudPatterns(): FraudPattern[] {
    return [...this.fraudPatterns];
  }

  public getFraudPatternById(id: string): FraudPattern | undefined {
    return this.fraudPatterns.find(p => p.id === id);
  }

  // Security Event Management
  public async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'riskScore' | 'flagged'>): Promise<SecurityEvent> {
    const riskScore = this.calculateRiskScore(event);
    const flagged = riskScore > this.config.alertThresholds.medium;

    const newEvent: SecurityEvent = {
      ...event,
      id: this.generateId(),
      timestamp: new Date(),
      riskScore,
      flagged
    };

    this.securityEvents.push(newEvent);
    this.socket?.emit('security:event_logged', newEvent);

    // Check for fraud patterns
    if (flagged) {
      this.detectFraudPatterns(newEvent);
    }

    return newEvent;
  }

  public getSecurityEvents(): SecurityEvent[] {
    return [...this.securityEvents].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getSecurityEventById(id: string): SecurityEvent | undefined {
    return this.securityEvents.find(e => e.id === id);
  }

  public getFlaggedEvents(): SecurityEvent[] {
    return this.securityEvents.filter(e => e.flagged);
  }

  private addSecurityEvent(event: SecurityEvent): void {
    const existingIndex = this.securityEvents.findIndex(e => e.id === event.id);
    if (existingIndex !== -1) {
      this.securityEvents[existingIndex] = event;
    } else {
      this.securityEvents.push(event);
    }
  }

  // Fraud Detection
  private detectFraudPatterns(event: SecurityEvent): void {
    this.fraudPatterns.forEach(pattern => {
      if (this.matchesPattern(event, pattern)) {
        this.createAlert({
          type: 'fraud',
          severity: pattern.riskLevel,
          title: `Fraud Pattern Detected: ${pattern.name}`,
          description: `Detected suspicious activity matching pattern: ${pattern.description}`,
          source: event.type,
          affectedUsers: event.userId ? [event.userId] : undefined,
          affectedTournaments: event.tournamentId ? [event.tournamentId] : undefined,
          status: 'open',
          evidence: [event.id],
          riskScore: event.riskScore,
          automatedAction: pattern.mitigationActions[0]
        });

        // Update pattern statistics
        pattern.detectionCount++;
        pattern.lastDetected = new Date();
        this.updateFraudPattern(pattern);
      }
    });
  }

  private matchesPattern(event: SecurityEvent, pattern: FraudPattern): boolean {
    // Simple pattern matching - in real implementation, this would be more sophisticated
    const eventDetails = JSON.stringify(event.details).toLowerCase();
    return pattern.pattern.toLowerCase().includes(eventDetails) || 
           eventDetails.includes(pattern.pattern.toLowerCase());
  }

  private calculateRiskScore(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'riskScore' | 'flagged'>): number {
    let score = 0;

    // Base score based on event type
    switch (event.type) {
      case 'login':
        score += 0.2;
        break;
      case 'transaction':
        score += 0.4;
        break;
      case 'game_action':
        score += 0.3;
        break;
      case 'api_call':
        score += 0.5;
        break;
      case 'file_access':
        score += 0.6;
        break;
    }

    // Location-based scoring
    if (event.location && this.isSuspiciousLocation(event.location)) {
      score += 0.3;
    }

    // Time-based scoring
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      score += 0.2;
    }

    // Success/failure scoring
    if (!event.success) {
      score += 0.4;
    }

    // User agent scoring
    if (this.isSuspiciousUserAgent(event.userAgent)) {
      score += 0.3;
    }

    return Math.min(score, 1.0);
  }

  private isSuspiciousLocation(location: string): boolean {
    const suspiciousLocations = ['unknown', 'vpn', 'proxy', 'tor'];
    return suspiciousLocations.some(loc => location.toLowerCase().includes(loc));
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousAgents = ['bot', 'crawler', 'scraper', 'automated'];
    return suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent));
  }

  // Automated Actions
  private async triggerAutomatedAction(alert: SecurityAlert): Promise<void> {
    if (!this.config.automatedActions) return;

    switch (alert.type) {
      case 'fraud':
        if (alert.affectedUsers) {
          // Temporarily suspend affected users
          this.socket?.emit('security:suspend_users', alert.affectedUsers);
        }
        break;
      case 'security_breach':
        // Trigger emergency protocols
        this.socket?.emit('security:emergency_protocol', { alertId: alert.id });
        break;
      case 'unauthorized_access':
        // Block IP addresses
        this.socket?.emit('security:block_ips', { alertId: alert.id });
        break;
    }
  }

  // Metrics Management
  public getMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  private updateMetrics(metrics: SecurityMetrics): void {
    this.metrics = metrics;
    this.socket?.emit('security:metrics_update', metrics);
  }

  private recalculateMetrics(): void {
    // Recalculate metrics based on current data
    const totalAlerts = this.alerts.length;
    const openAlerts = this.alerts.filter(a => a.status === 'open').length;
    const resolvedAlerts = this.alerts.filter(a => a.status === 'resolved').length;
    const falsePositives = this.alerts.filter(a => a.status === 'false_positive').length;
    
    const recentAlerts = this.alerts.filter(a => 
      Date.now() - a.timestamp.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    );
    
    const averageResponseTime = recentAlerts.length > 0 
      ? recentAlerts.reduce((sum, alert) => sum + (alert.riskScore || 0), 0) / recentAlerts.length
      : 0;

    const threatLevel = this.calculateThreatLevel();
    const securityScore = this.calculateSecurityScore();
    const complianceStatus = this.calculateComplianceStatus();

    const updatedMetrics: SecurityMetrics = {
      totalAlerts,
      openAlerts,
      resolvedAlerts,
      falsePositives,
      averageResponseTime,
      threatLevel,
      lastIncident: this.alerts.length > 0 ? this.alerts[0].timestamp : undefined,
      securityScore,
      complianceStatus
    };

    this.metrics = updatedMetrics;
    this.socket?.emit('security:metrics_update', updatedMetrics);
  }

  private calculateThreatLevel(): 'low' | 'medium' | 'high' | 'critical' {
    const highSeverityAlerts = this.alerts.filter(a => 
      a.severity === 'high' || a.severity === 'critical'
    ).length;

    if (highSeverityAlerts > 5) return 'critical';
    if (highSeverityAlerts > 2) return 'high';
    if (highSeverityAlerts > 0) return 'medium';
    return 'low';
  }

  private calculateSecurityScore(): number {
    const totalAlerts = this.alerts.length;
    const resolvedAlerts = this.alerts.filter(a => a.status === 'resolved').length;
    const falsePositives = this.alerts.filter(a => a.status === 'false_positive').length;
    
    if (totalAlerts === 0) return 100;
    
    const resolutionRate = resolvedAlerts / totalAlerts;
    const falsePositiveRate = falsePositives / totalAlerts;
    
    return Math.max(0, Math.min(100, (resolutionRate * 80) + ((1 - falsePositiveRate) * 20)));
  }

  private calculateComplianceStatus(): 'compliant' | 'warning' | 'non_compliant' {
    const securityScore = this.calculateSecurityScore();
    const threatLevel = this.calculateThreatLevel();
    
    if (securityScore >= 80 && threatLevel === 'low') return 'compliant';
    if (securityScore >= 60 && threatLevel !== 'critical') return 'warning';
    return 'non_compliant';
  }

  // Configuration Management
  public getConfig(): SecurityConfig {
    return { ...this.config };
  }

  public async updateConfig(newConfig: Partial<SecurityConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    this.socket?.emit('security:config_updated', this.config);
  }

  // Monitoring
  private startMonitoring(): void {
    if (!this.config.realTimeMonitoring) return;

    setInterval(() => {
      this.performSecurityScan();
    }, this.config.monitoringIntervals.security);

    setInterval(() => {
      this.performFraudScan();
    }, this.config.monitoringIntervals.fraud);

    setInterval(() => {
      this.performComplianceCheck();
    }, this.config.monitoringIntervals.compliance);
  }

  private performSecurityScan(): void {
    // Simulate security scan
    const recentEvents = this.securityEvents.filter(e => 
      Date.now() - e.timestamp.getTime() < 60000 // Last minute
    );

    if (recentEvents.length > 10) {
      this.createAlert({
        type: 'suspicious_activity',
        severity: 'medium',
        title: 'High Activity Detected',
        description: `Detected ${recentEvents.length} security events in the last minute`,
        source: 'security_scan',
        riskScore: 0.6,
        status: 'open'
      });
    }
  }

  private performFraudScan(): void {
    // Simulate fraud scan
    const recentTransactions = this.securityEvents.filter(e => 
      e.type === 'transaction' && Date.now() - e.timestamp.getTime() < 300000 // Last 5 minutes
    );

    if (recentTransactions.length > 5) {
      this.createAlert({
        type: 'fraud',
        severity: 'high',
        title: 'Suspicious Transaction Pattern',
        description: `Detected ${recentTransactions.length} transactions in the last 5 minutes`,
        source: 'fraud_scan',
        riskScore: 0.8,
        status: 'open'
      });
    }
  }

  private performComplianceCheck(): void {
    // Simulate compliance check
    if (this.metrics.securityScore < 70) {
      this.createAlert({
        type: 'security_breach',
        severity: 'high',
        title: 'Compliance Violation',
        description: 'Security score has dropped below compliance threshold',
        source: 'compliance_check',
        riskScore: 0.7,
        status: 'open'
      });
    }
  }

  // Utility Methods
  public getOnlineStatus(): boolean {
    return this.isConnected;
  }

  public getConnectionStatus(): { connected: boolean; reconnectAttempts: number } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private loadMockData(): void {
    // Mock alerts
    const mockAlerts: SecurityAlert[] = [
      {
        id: 'alert1',
        type: 'fraud',
        severity: 'high',
        title: 'Suspicious Login Pattern',
        description: 'Multiple failed login attempts detected from unusual location',
        timestamp: new Date(Date.now() - 3600000),
        source: 'login_monitor',
        affectedUsers: ['user123'],
        status: 'investigating',
        riskScore: 0.8
      },
      {
        id: 'alert2',
        type: 'suspicious_activity',
        severity: 'medium',
        title: 'Unusual Transaction Volume',
        description: 'Transaction volume increased by 300% in the last hour',
        timestamp: new Date(Date.now() - 1800000),
        source: 'transaction_monitor',
        status: 'open',
        riskScore: 0.6
      }
    ];

    this.alerts = mockAlerts;

    // Mock fraud patterns
    this.fraudPatterns = [
      {
        id: 'pattern1',
        name: 'Rapid Transaction Pattern',
        description: 'Multiple transactions in quick succession',
        pattern: 'transaction',
        riskLevel: 'high',
        detectionRules: ['time_between_transactions < 30s', 'amount_variance > 50%'],
        mitigationActions: ['temporary_suspension', 'manual_review'],
        detectionCount: 5,
        accuracy: 0.92
      },
      {
        id: 'pattern2',
        name: 'Geographic Anomaly',
        description: 'Login from unusual geographic location',
        pattern: 'location',
        riskLevel: 'medium',
        detectionRules: ['distance_from_last_login > 1000km', 'time_between_logins < 1h'],
        mitigationActions: ['require_2fa', 'email_notification'],
        detectionCount: 12,
        accuracy: 0.85
      }
    ];

    // Mock security events
    this.securityEvents = [
      {
        id: 'event1',
        type: 'login',
        userId: 'user123',
        timestamp: new Date(Date.now() - 300000),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        location: 'New York, US',
        success: false,
        details: { attempts: 3 },
        riskScore: 0.7,
        flagged: true
      }
    ];

    this.recalculateMetrics();
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }
}

export default TournamentSecurityService; 