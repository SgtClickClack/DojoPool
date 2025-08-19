export interface ComplianceReport {
  id: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  submissionDate: string;
  dueDate: string;
  type: 'monthly' | 'quarterly' | 'annual' | 'incident';
  description: string;
  attachments: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  complianceScore: number;
}

export interface ComplianceViolation {
  id: string;
  type: 'regulatory' | 'operational' | 'financial' | 'safety';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  date: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  assignedTo?: string;
  resolutionNotes?: string;
  regulation: string;
  section: string;
  fine?: number;
  impact: string;
  mitigation: string;
}

export interface RegulatoryFramework {
  id: string;
  name: string;
  jurisdiction: string;
  version: string;
  effectiveDate: string;
  requirements: string[];
  complianceDeadline: Date;
  status: 'active' | 'pending' | 'deprecated';
  lastReview: Date;
  nextReview: Date;
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
  riskLevel: 'low' | 'medium' | 'high';
  auditStatus: 'pending' | 'in-progress' | 'completed' | 'failed';
  nextDeadline: Date;
  lastAudit: Date;
  nextAudit: Date;
}

export interface ComplianceConfig {
  autoReporting: boolean;
  notificationEmails: string[];
  assessmentFrequency: 'monthly' | 'quarterly' | 'annual';
  escalationThreshold: number;
  auditTrailEnabled: boolean;
  realTimeMonitoring: boolean;
  automatedAssessments: boolean;
  frameworks: string[];
  jurisdictions: string[];
}

class TournamentComplianceService {
  private static instance: TournamentComplianceService;
  private reports: ComplianceReport[] = [];
  private violations: ComplianceViolation[] = [];
  private frameworks: RegulatoryFramework[] = [];
  private metrics!: ComplianceMetrics;
  private config!: ComplianceConfig;

  private constructor() {
    this.initializeMockData();
  }

  public static getInstance(): TournamentComplianceService {
    if (!TournamentComplianceService.instance) {
      TournamentComplianceService.instance = new TournamentComplianceService();
    }
    return TournamentComplianceService.instance;
  }

  private initializeMockData() {
    // Mock compliance reports
    this.reports = [
      {
        id: 'report_001',
        title: 'Q4 2024 Tournament Compliance Report',
        status: 'approved',
        submissionDate: '2024-12-15',
        dueDate: '2024-12-31',
        type: 'quarterly',
        description: 'Quarterly compliance report covering all tournament activities',
        attachments: ['q4_report.pdf', 'financial_summary.xlsx'],
        priority: 'high',
        complianceScore: 92
      },
      {
        id: 'report_002',
        title: 'Annual Regulatory Compliance Assessment',
        status: 'pending',
        submissionDate: '2024-12-20',
        dueDate: '2025-01-15',
        type: 'annual',
        description: 'Annual assessment of regulatory compliance across all venues',
        attachments: ['annual_assessment.pdf'],
        priority: 'critical',
        complianceScore: 88
      }
    ];

    // Mock violations
    this.violations = [
      {
        id: 'violation_001',
        type: 'operational',
        severity: 'medium',
        description: 'Tournament registration deadline not properly communicated',
        date: '2024-12-10',
        status: 'resolved',
        assignedTo: 'venue_manager_001',
        resolutionNotes: 'Updated registration process and added automated reminders',
        regulation: 'Gaming Regulation Act 2024',
        section: 'Section 10.1',
        impact: 'Delayed tournament start',
        mitigation: 'Implemented automated reminders and updated registration process'
      },
      {
        id: 'violation_002',
        type: 'safety',
        severity: 'low',
        description: 'Emergency exit signs partially obscured during tournament setup',
        date: '2024-12-12',
        status: 'open',
        assignedTo: 'safety_officer_001',
        regulation: 'Venue Safety Standards',
        section: 'Section 5.2',
        impact: 'Potential safety hazard',
        mitigation: 'Immediate action to fix signs and ensure accessibility'
      }
    ];

    // Mock regulatory frameworks
    this.frameworks = [
      {
        id: 'framework_001',
        name: 'Gaming Regulation Act 2024',
        jurisdiction: 'Federal',
        version: '1.2',
        effectiveDate: '2024-01-01',
        requirements: [
          'Tournament registration with gaming authority',
          'Financial transparency reporting',
          'Player protection measures',
          'Anti-money laundering compliance'
        ],
        complianceDeadline: new Date('2024-12-31'),
        status: 'active',
        lastReview: new Date('2024-06-01'),
        nextReview: new Date('2025-06-01')
      },
      {
        id: 'framework_002',
        name: 'Venue Safety Standards',
        jurisdiction: 'State',
        version: '3.1',
        effectiveDate: '2024-06-01',
        requirements: [
          'Emergency exit accessibility',
          'Fire safety compliance',
          'Accessibility requirements',
          'Health and safety protocols'
        ],
        complianceDeadline: new Date('2025-06-01'),
        status: 'active',
        lastReview: new Date('2024-09-01'),
        nextReview: new Date('2025-09-01')
      }
    ];

    // Mock metrics
    this.metrics = {
      overallCompliance: 87,
      regulatoryCompliance: 92,
      operationalCompliance: 85,
      securityCompliance: 90,
      financialCompliance: 88,
      openViolations: 1,
      resolvedViolations: 5,
      pendingReports: 2,
      overdueReports: 0,
      riskLevel: 'medium',
      auditStatus: 'completed',
      nextDeadline: new Date('2024-12-31'),
      lastAudit: new Date('2024-12-01'),
      nextAudit: new Date('2025-03-01')
    };

    // Mock config
    this.config = {
      autoReporting: true,
      notificationEmails: ['compliance@dojopool.com', 'legal@dojopool.com'],
      assessmentFrequency: 'quarterly',
      escalationThreshold: 3,
      auditTrailEnabled: true,
      realTimeMonitoring: true,
      automatedAssessments: true,
      frameworks: ['Gaming Regulation Act 2024', 'Venue Safety Standards'],
      jurisdictions: ['Federal', 'State', 'Local']
    };
  }

  public getReports(): ComplianceReport[] {
    return this.reports;
  }

  public getViolations(): ComplianceViolation[] {
    return this.violations;
  }

  public getFrameworks(): RegulatoryFramework[] {
    return this.frameworks;
  }

  public getMetrics(): ComplianceMetrics {
    return this.metrics;
  }

  public getConfig(): ComplianceConfig {
    return this.config;
  }

  public addReport(report: Omit<ComplianceReport, 'id'>): ComplianceReport {
    const newReport: ComplianceReport = {
      ...report,
      id: `report_${Date.now()}`
    };
    this.reports.push(newReport);
    return newReport;
  }

  public updateViolationStatus(violationId: string, status: ComplianceViolation['status'], notes?: string): void {
    const violation = this.violations.find(v => v.id === violationId);
    if (violation) {
      violation.status = status;
      if (notes) {
        violation.resolutionNotes = notes;
      }
    }
  }

  public updateMetrics(newMetrics: Partial<ComplianceMetrics>): void {
    this.metrics = { ...this.metrics, ...newMetrics };
  }

  public updateConfig(newConfig: Partial<ComplianceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export default TournamentComplianceService;
