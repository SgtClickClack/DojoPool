import { io, Socket } from 'socket.io-client';

export interface ComplianceReport {
  id: string;
  type: 'financial' | 'operational' | 'security' | 'regulatory' | 'audit';
  title: string;
  description: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: Date;
  submittedDate?: Date;
  approvedDate?: Date;
  submittedBy?: string;
  approvedBy?: string;
  data: any;
  attachments: string[];
  complianceScore: number;
  violations: ComplianceViolation[];
  recommendations: string[];
}

export interface ComplianceViolation {
  id: string;
  type: 'regulatory' | 'operational' | 'security' | 'financial';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  regulation: string;
  section: string;
  detectedDate: Date;
  resolvedDate?: Date;
  status: 'open' | 'investigating' | 'resolved' | 'waived';
  impact: string;
  mitigation: string;
  fine?: number;
  penalty?: string;
}

export interface RegulatoryFramework {
  id: string;
  name: string;
  jurisdiction: string;
  version: string;
  effectiveDate: Date;
  expiryDate?: Date;
  status: 'active' | 'pending' | 'expired' | 'superseded';
  requirements: RegulatoryRequirement[];
  complianceDeadline: Date;
  lastReview: Date;
  nextReview: Date;
}

export interface RegulatoryRequirement {
  id: string;
  code: string;
  title: string;
  description: string;
  category: 'financial' | 'operational' | 'security' | 'data_protection' | 'anti_money_laundering';
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline: Date;
  status: 'compliant' | 'non_compliant' | 'pending' | 'exempt';
  evidence: string[];
  lastAssessment: Date;
  nextAssessment: Date;
  riskScore: number;
}

export interface ComplianceMetrics {
  overallCompliance: number;
  regulatoryCompliance: number;
  operationalCompliance: number;
  securityCompliance: number;
  financialCompliance: number;
  openViolations: number;
  resolvedViolations: number;
  pendingReports: number;
  overdueReports: number;
  nextDeadline: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  auditStatus: 'clean' | 'minor_issues' | 'major_issues' | 'critical_issues';
  lastAudit: Date;
  nextAudit: Date;
}

export interface ComplianceConfig {
  autoReporting: boolean;
  realTimeMonitoring: boolean;
  automatedAssessments: boolean;
  notificationSettings: {
    email: boolean;
    sms: boolean;
    push: boolean;
    webhook: boolean;
  };
  reportingIntervals: {
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
    quarterly: boolean;
    annually: boolean;
  };
  frameworks: string[];
  jurisdictions: string[];
}

class TournamentComplianceService {
  private static instance: TournamentComplianceService;
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;

  // Compliance state
  private reports: ComplianceReport[] = [];
  private violations: ComplianceViolation[] = [];
  private frameworks: RegulatoryFramework[] = [];
  private requirements: RegulatoryRequirement[] = [];
  private metrics: ComplianceMetrics = {
    overallCompliance: 85,
    regulatoryCompliance: 90,
    operationalCompliance: 80,
    securityCompliance: 85,
    financialCompliance: 88,
    openViolations: 3,
    resolvedViolations: 12,
    pendingReports: 2,
    overdueReports: 1,
    nextDeadline: new Date(Date.now() + 86400000 * 7),
    riskLevel: 'medium',
    auditStatus: 'clean',
    lastAudit: new Date(Date.now() - 86400000 * 30),
    nextAudit: new Date(Date.now() + 86400000 * 90)
  };

  // Configuration
  private config: ComplianceConfig = {
    autoReporting: true,
    realTimeMonitoring: true,
    automatedAssessments: true,
    notificationSettings: {
      email: true,
      sms: false,
      push: true,
      webhook: true
    },
    reportingIntervals: {
      daily: false,
      weekly: true,
      monthly: true,
      quarterly: true,
      annually: true
    },
    frameworks: ['GDPR', 'SOX', 'PCI-DSS', 'ISO-27001'],
    jurisdictions: ['US', 'EU', 'UK', 'Canada']
  };

  private constructor() {
    this.initializeWebSocket();
    this.loadMockData();
    this.startMonitoring();
  }

  public static getInstance(): TournamentComplianceService {
    if (!TournamentComplianceService.instance) {
      TournamentComplianceService.instance = new TournamentComplianceService();
    }
    return TournamentComplianceService.instance;
  }

  private initializeWebSocket(): void {
    try {
      this.socket = io('http://localhost:8080', {
        transports: ['websocket'],
        timeout: 10000
      });

      this.socket.on('connect', () => {
        console.log('📋 Compliance service connected to WebSocket');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.socket?.emit('compliance:join', { service: 'compliance' });
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Compliance service disconnected from WebSocket');
        this.isConnected = false;
        this.handleReconnection();
      });

      this.socket.on('compliance:report_created', (data: ComplianceReport) => {
        this.addReport(data);
      });

      this.socket.on('compliance:violation_detected', (data: ComplianceViolation) => {
        this.addViolation(data);
      });

      this.socket.on('compliance:framework_updated', (data: RegulatoryFramework) => {
        this.updateFramework(data);
      });

      this.socket.on('compliance:metrics_update', (data: ComplianceMetrics) => {
        this.updateMetrics(data);
      });

    } catch (error) {
      console.error('❌ Failed to initialize compliance WebSocket:', error);
      this.handleReconnection();
    }
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect compliance service (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.initializeWebSocket();
      }, this.reconnectInterval);
    } else {
      console.error('❌ Max reconnection attempts reached for compliance service');
    }
  }

  // Report Management
  public async createReport(report: Omit<ComplianceReport, 'id' | 'status' | 'complianceScore' | 'violations' | 'recommendations'>): Promise<ComplianceReport> {
    const newReport: ComplianceReport = {
      ...report,
      id: this.generateId(),
      status: 'draft',
      complianceScore: this.calculateComplianceScore(report.data),
      violations: [],
      recommendations: []
    };

    this.reports.push(newReport);
    this.updateMetrics();
    this.socket?.emit('compliance:report_created', newReport);

    return newReport;
  }

  public async submitReport(reportId: string, submittedBy: string): Promise<void> {
    const report = this.reports.find(r => r.id === reportId);
    if (report) {
      report.status = 'pending';
      report.submittedBy = submittedBy;
      report.submittedDate = new Date();
      this.updateMetrics();
      this.socket?.emit('compliance:report_submitted', report);
    }
  }

  public async approveReport(reportId: string, approvedBy: string): Promise<void> {
    const report = this.reports.find(r => r.id === reportId);
    if (report) {
      report.status = 'approved';
      report.approvedBy = approvedBy;
      report.approvedDate = new Date();
      this.updateMetrics();
      this.socket?.emit('compliance:report_approved', report);
    }
  }

  public async rejectReport(reportId: string, reason: string): Promise<void> {
    const report = this.reports.find(r => r.id === reportId);
    if (report) {
      report.status = 'rejected';
      report.recommendations.push(`Rejected: ${reason}`);
      this.updateMetrics();
      this.socket?.emit('compliance:report_rejected', report);
    }
  }

  public getReports(): ComplianceReport[] {
    return [...this.reports].sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());
  }

  public getReportById(id: string): ComplianceReport | undefined {
    return this.reports.find(r => r.id === id);
  }

  public getReportsByStatus(status: ComplianceReport['status']): ComplianceReport[] {
    return this.reports.filter(r => r.status === status);
  }

  public getOverdueReports(): ComplianceReport[] {
    const now = new Date();
    return this.reports.filter(r => r.dueDate < now && r.status !== 'approved');
  }

  private addReport(report: ComplianceReport): void {
    const existingIndex = this.reports.findIndex(r => r.id === report.id);
    if (existingIndex !== -1) {
      this.reports[existingIndex] = report;
    } else {
      this.reports.push(report);
    }
    this.updateMetrics();
  }

  // Violation Management
  public async createViolation(violation: Omit<ComplianceViolation, 'id' | 'detectedDate' | 'status'>): Promise<ComplianceViolation> {
    const newViolation: ComplianceViolation = {
      ...violation,
      id: this.generateId(),
      detectedDate: new Date(),
      status: 'open'
    };

    this.violations.push(newViolation);
    this.updateMetrics();
    this.socket?.emit('compliance:violation_created', newViolation);

    return newViolation;
  }

  public async resolveViolation(violationId: string, mitigation: string): Promise<void> {
    const violation = this.violations.find(v => v.id === violationId);
    if (violation) {
      violation.status = 'resolved';
      violation.resolvedDate = new Date();
      violation.mitigation = mitigation;
      this.updateMetrics();
      this.socket?.emit('compliance:violation_resolved', violation);
    }
  }

  public getViolations(): ComplianceViolation[] {
    return [...this.violations].sort((a, b) => b.detectedDate.getTime() - a.detectedDate.getTime());
  }

  public getViolationById(id: string): ComplianceViolation | undefined {
    return this.violations.find(v => v.id === id);
  }

  public getOpenViolations(): ComplianceViolation[] {
    return this.violations.filter(v => v.status === 'open');
  }

  private addViolation(violation: ComplianceViolation): void {
    const existingIndex = this.violations.findIndex(v => v.id === violation.id);
    if (existingIndex !== -1) {
      this.violations[existingIndex] = violation;
    } else {
      this.violations.push(violation);
    }
    this.updateMetrics();
  }

  // Framework Management
  public async addFramework(framework: Omit<RegulatoryFramework, 'id' | 'lastReview' | 'nextReview'>): Promise<RegulatoryFramework> {
    const newFramework: RegulatoryFramework = {
      ...framework,
      id: this.generateId(),
      lastReview: new Date(),
      nextReview: new Date(Date.now() + 86400000 * 90) // 90 days from now
    };

    this.frameworks.push(newFramework);
    this.socket?.emit('compliance:framework_added', newFramework);

    return newFramework;
  }

  private updateFramework(framework: RegulatoryFramework): void {
    const index = this.frameworks.findIndex(f => f.id === framework.id);
    if (index !== -1) {
      this.frameworks[index] = framework;
    }
  }

  public getFrameworks(): RegulatoryFramework[] {
    return [...this.frameworks];
  }

  public getFrameworkById(id: string): RegulatoryFramework | undefined {
    return this.frameworks.find(f => f.id === id);
  }

  // Requirement Management
  public async addRequirement(requirement: Omit<RegulatoryRequirement, 'id' | 'lastAssessment' | 'nextAssessment'>): Promise<RegulatoryRequirement> {
    const newRequirement: RegulatoryRequirement = {
      ...requirement,
      id: this.generateId(),
      lastAssessment: new Date(),
      nextAssessment: new Date(Date.now() + 86400000 * 30) // 30 days from now
    };

    this.requirements.push(newRequirement);
    this.socket?.emit('compliance:requirement_added', newRequirement);

    return newRequirement;
  }

  public async assessRequirement(requirementId: string, status: RegulatoryRequirement['status'], evidence: string[]): Promise<void> {
    const requirement = this.requirements.find(r => r.id === requirementId);
    if (requirement) {
      requirement.status = status;
      requirement.lastAssessment = new Date();
      requirement.nextAssessment = new Date(Date.now() + 86400000 * 30);
      requirement.evidence = evidence;
      this.updateMetrics();
      this.socket?.emit('compliance:requirement_assessed', requirement);
    }
  }

  public getRequirements(): RegulatoryRequirement[] {
    return [...this.requirements];
  }

  public getRequirementById(id: string): RegulatoryRequirement | undefined {
    return this.requirements.find(r => r.id === id);
  }

  public getNonCompliantRequirements(): RegulatoryRequirement[] {
    return this.requirements.filter(r => r.status === 'non_compliant');
  }

  // Metrics Management
  public getMetrics(): ComplianceMetrics {
    return { ...this.metrics };
  }

  private updateMetrics(data?: any): void {
    if (data) {
      // Update with provided data
      this.metrics = {
        ...this.metrics,
        ...data
      };
    } else {
      // Recalculate metrics based on current data
      this.metrics = {
        overallCompliance: this.calculateOverallCompliance(),
        regulatoryCompliance: this.calculateRegulatoryCompliance(),
        operationalCompliance: this.calculateOperationalCompliance(),
        securityCompliance: this.calculateSecurityCompliance(),
        financialCompliance: this.calculateFinancialCompliance(),
        openViolations: this.getOpenViolations().length,
        resolvedViolations: this.violations.filter(v => v.status === 'resolved').length,
        pendingReports: this.getReportsByStatus('pending').length,
        overdueReports: this.getOverdueReports().length,
        nextDeadline: this.getNextDeadline(),
        riskLevel: this.calculateRiskLevel(),
        auditStatus: this.calculateAuditStatus(),
        lastAudit: new Date(Date.now() - 86400000 * 30),
        nextAudit: new Date(Date.now() + 86400000 * 90)
      };
    }
    this.socket?.emit('compliance:metrics_update', this.metrics);
  }

  private calculateOverallCompliance(): number {
    const scores = [
      this.calculateRegulatoryCompliance(),
      this.calculateOperationalCompliance(),
      this.calculateSecurityCompliance(),
      this.calculateFinancialCompliance()
    ];
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  private calculateRegulatoryCompliance(): number {
    const totalRequirements = this.requirements.length;
    if (totalRequirements === 0) return 100;
    const compliantRequirements = this.requirements.filter(r => r.status === 'compliant').length;
    return Math.round((compliantRequirements / totalRequirements) * 100);
  }

  private calculateOperationalCompliance(): number {
    const operationalReports = this.reports.filter(r => r.type === 'operational');
    if (operationalReports.length === 0) return 100;
    const approvedReports = operationalReports.filter(r => r.status === 'approved').length;
    return Math.round((approvedReports / operationalReports.length) * 100);
  }

  private calculateSecurityCompliance(): number {
    const securityReports = this.reports.filter(r => r.type === 'security');
    if (securityReports.length === 0) return 100;
    const approvedReports = securityReports.filter(r => r.status === 'approved').length;
    return Math.round((approvedReports / securityReports.length) * 100);
  }

  private calculateFinancialCompliance(): number {
    const financialReports = this.reports.filter(r => r.type === 'financial');
    if (financialReports.length === 0) return 100;
    const approvedReports = financialReports.filter(r => r.status === 'approved').length;
    return Math.round((approvedReports / financialReports.length) * 100);
  }

  private calculateRiskLevel(): 'low' | 'medium' | 'high' | 'critical' {
    const openViolations = this.getOpenViolations();
    const criticalViolations = openViolations.filter(v => v.severity === 'critical').length;
    const highViolations = openViolations.filter(v => v.severity === 'high').length;
    
    if (criticalViolations > 0) return 'critical';
    if (highViolations > 2) return 'high';
    if (openViolations.length > 5) return 'medium';
    return 'low';
  }

  private calculateAuditStatus(): 'clean' | 'minor_issues' | 'major_issues' | 'critical_issues' {
    const openViolations = this.getOpenViolations();
    const criticalViolations = openViolations.filter(v => v.severity === 'critical').length;
    const highViolations = openViolations.filter(v => v.severity === 'high').length;
    const mediumViolations = openViolations.filter(v => v.severity === 'medium').length;
    
    if (criticalViolations > 0) return 'critical_issues';
    if (highViolations > 0) return 'major_issues';
    if (mediumViolations > 2) return 'minor_issues';
    return 'clean';
  }

  private getNextDeadline(): Date {
    const deadlines = [
      ...this.reports.map(r => r.dueDate),
      ...this.requirements.map(r => r.deadline),
      ...this.frameworks.map(f => f.complianceDeadline)
    ].filter(d => d > new Date());

    if (deadlines.length === 0) {
      return new Date(Date.now() + 86400000 * 7); // Default to 7 days from now
    }

    return new Date(Math.min(...deadlines.map(d => d.getTime())));
  }

  private calculateComplianceScore(data: any): number {
    // Simple compliance score calculation based on data completeness
    let score = 100;
    
    if (!data.financialRecords) score -= 20;
    if (!data.securityAudit) score -= 15;
    if (!data.operationalMetrics) score -= 10;
    if (!data.regulatoryChecks) score -= 15;
    if (!data.documentation) score -= 10;

    return Math.max(score, 0);
  }

  // Configuration Management
  public getConfig(): ComplianceConfig {
    return { ...this.config };
  }

  public async updateConfig(newConfig: Partial<ComplianceConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    this.socket?.emit('compliance:config_updated', this.config);
  }

  // Monitoring
  private startMonitoring(): void {
    if (!this.config.realTimeMonitoring) return;

    setInterval(() => {
      this.performComplianceCheck();
    }, 60000); // Every minute

    setInterval(() => {
      this.generateAutomatedReports();
    }, 86400000); // Daily
  }

  private performComplianceCheck(): void {
    // Check for overdue reports
    const overdueReports = this.getOverdueReports();
    if (overdueReports.length > 0) {
      this.createViolation({
        type: 'regulatory',
        severity: 'high',
        description: `${overdueReports.length} compliance report(s) overdue`,
        regulation: 'Internal Compliance Policy',
        section: 'Reporting Requirements',
        impact: 'Potential regulatory penalties and audit issues',
        mitigation: 'Submit overdue reports immediately'
      });
    }

    // Check for non-compliant requirements
    const nonCompliantRequirements = this.getNonCompliantRequirements();
    if (nonCompliantRequirements.length > 0) {
      this.createViolation({
        type: 'regulatory',
        severity: 'medium',
        description: `${nonCompliantRequirements.length} regulatory requirement(s) non-compliant`,
        regulation: 'Regulatory Framework',
        section: 'Compliance Requirements',
        impact: 'Regulatory scrutiny and potential fines',
        mitigation: 'Address non-compliant requirements'
      });
    }
  }

  private generateAutomatedReports(): void {
    if (!this.config.autoReporting) return;

    // Generate weekly compliance summary
    if (this.config.reportingIntervals.weekly) {
      this.createReport({
        type: 'operational',
        title: 'Weekly Compliance Summary',
        description: 'Automated weekly compliance status report',
        priority: 'medium',
        dueDate: new Date(Date.now() + 86400000 * 7),
        data: {
          weeklyMetrics: this.metrics,
          violations: this.getOpenViolations(),
          reports: this.getReportsByStatus('pending')
        },
        attachments: []
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
    // Mock reports
    const mockReports: ComplianceReport[] = [
      {
        id: 'report1',
        type: 'financial',
        title: 'Q4 Financial Compliance Report',
        description: 'Quarterly financial compliance and regulatory reporting',
        status: 'pending',
        priority: 'high',
        dueDate: new Date(Date.now() + 86400000 * 7),
        submittedDate: new Date(Date.now() - 86400000),
        submittedBy: 'compliance_officer',
        data: {
          financialRecords: true,
          securityAudit: true,
          operationalMetrics: true,
          regulatoryChecks: true,
          documentation: true
        },
        attachments: ['financial_summary.pdf', 'audit_report.pdf'],
        complianceScore: 95,
        violations: [],
        recommendations: ['Continue monitoring financial transactions', 'Schedule next audit']
      },
      {
        id: 'report2',
        type: 'security',
        title: 'Annual Security Compliance Assessment',
        description: 'Annual security compliance and data protection assessment',
        status: 'draft',
        priority: 'medium',
        dueDate: new Date(Date.now() + 86400000 * 30),
        data: {
          financialRecords: true,
          securityAudit: false,
          operationalMetrics: true,
          regulatoryChecks: true,
          documentation: false
        },
        attachments: [],
        complianceScore: 75,
        violations: [],
        recommendations: ['Complete security audit', 'Update documentation']
      }
    ];

    this.reports = mockReports;

    // Mock violations
    const mockViolations: ComplianceViolation[] = [
      {
        id: 'violation1',
        type: 'regulatory',
        severity: 'medium',
        description: 'Missing quarterly financial disclosure',
        regulation: 'Financial Reporting Standards',
        section: 'Section 4.2',
        detectedDate: new Date(Date.now() - 86400000 * 3),
        status: 'open',
        impact: 'Potential regulatory fines and audit issues',
        mitigation: 'Submit missing disclosure within 30 days'
      },
      {
        id: 'violation2',
        type: 'operational',
        severity: 'low',
        description: 'Incomplete operational documentation',
        regulation: 'Operational Standards',
        section: 'Section 2.1',
        detectedDate: new Date(Date.now() - 86400000 * 7),
        status: 'resolved',
        resolvedDate: new Date(Date.now() - 86400000 * 2),
        impact: 'Minor operational inefficiencies',
        mitigation: 'Documentation completed and reviewed'
      }
    ];

    this.violations = mockViolations;

    // Mock frameworks
    this.frameworks = [
      {
        id: 'framework1',
        name: 'GDPR Compliance Framework',
        jurisdiction: 'EU',
        version: '2.1',
        effectiveDate: new Date('2023-01-01'),
        status: 'active',
        requirements: [],
        complianceDeadline: new Date(Date.now() + 86400000 * 90),
        lastReview: new Date(Date.now() - 86400000 * 30),
        nextReview: new Date(Date.now() + 86400000 * 60)
      },
      {
        id: 'framework2',
        name: 'SOX Compliance Framework',
        jurisdiction: 'US',
        version: '1.0',
        effectiveDate: new Date('2023-06-01'),
        status: 'active',
        requirements: [],
        complianceDeadline: new Date(Date.now() + 86400000 * 180),
        lastReview: new Date(Date.now() - 86400000 * 15),
        nextReview: new Date(Date.now() + 86400000 * 75)
      }
    ];

    // Mock requirements
    this.requirements = [
      {
        id: 'req1',
        code: 'GDPR-001',
        title: 'Data Protection Impact Assessment',
        description: 'Conduct regular DPIA for high-risk data processing activities',
        category: 'data_protection',
        priority: 'high',
        deadline: new Date(Date.now() + 86400000 * 30),
        status: 'compliant',
        evidence: ['dpia_report_2024.pdf'],
        lastAssessment: new Date(Date.now() - 86400000 * 15),
        nextAssessment: new Date(Date.now() + 86400000 * 15),
        riskScore: 0.2
      },
      {
        id: 'req2',
        code: 'SOX-001',
        title: 'Financial Controls Assessment',
        description: 'Implement and maintain effective financial controls',
        category: 'financial',
        priority: 'critical',
        deadline: new Date(Date.now() + 86400000 * 60),
        status: 'non_compliant',
        evidence: [],
        lastAssessment: new Date(Date.now() - 86400000 * 7),
        nextAssessment: new Date(Date.now() + 86400000 * 23),
        riskScore: 0.8
      }
    ];

    this.updateMetrics();
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }
}

export default TournamentComplianceService; 