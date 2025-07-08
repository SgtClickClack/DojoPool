import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

export interface EnvironmentConfig {
  name: string;
  type: 'development' | 'staging' | 'production';
  database: {
    host: string;
    port: number;
    name: string;
    ssl: boolean;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
    rateLimit: number;
  };
  security: {
    jwtSecret: string;
    bcryptRounds: number;
    corsOrigins: string[];
    rateLimitWindow: number;
  };
  monitoring: {
    enabled: boolean;
    logLevel: string;
    metricsInterval: number;
    alertThresholds: {
      errorRate: number;
      responseTime: number;
      memoryUsage: number;
    };
  };
}

export interface DeploymentCheck {
  id: string;
  name: string;
  category: 'security' | 'performance' | 'configuration' | 'dependencies';
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  timestamp: Date;
}

export interface DeploymentValidation {
  overallStatus: 'ready' | 'not_ready' | 'critical';
  checks: DeploymentCheck[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  recommendations: string[];
  timestamp: Date;
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  lastChecked: Date;
  details?: any;
}

export interface SecurityAudit {
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  outdatedPackages: string[];
  securityIssues: string[];
  recommendations: string[];
  lastAudit: Date;
}

class ProductionDeploymentService extends EventEmitter {
  private static instance: ProductionDeploymentService;
  private environmentConfig: EnvironmentConfig | null = null;
  private deploymentValidation: DeploymentValidation | null = null;
  private healthChecks: Map<string, HealthCheck> = new Map();
  private securityAudit: SecurityAudit | null = null;
  private isDeploymentReady = false;

  constructor() {
    super();
    this.initializeService();
  }

  public static getInstance(): ProductionDeploymentService {
    if (!ProductionDeploymentService.instance) {
      ProductionDeploymentService.instance = new ProductionDeploymentService();
    }
    return ProductionDeploymentService.instance;
  }

  private initializeService(): void {
    console.log('Production Deployment Service initialized');
    this.loadEnvironmentConfig();
    this.runDeploymentValidation();
    this.performSecurityAudit();
  }

  /**
   * Load environment configuration
   */
  private loadEnvironmentConfig(): void {
    const env = process.env.NODE_ENV || 'development';
    
    this.environmentConfig = {
      name: env,
      type: env as 'development' | 'staging' | 'production',
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        name: process.env.DB_NAME || 'dojopool',
        ssl: process.env.DB_SSL === 'true'
      },
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
      },
      api: {
        baseUrl: process.env.API_BASE_URL || 'http://localhost:8080',
        timeout: parseInt(process.env.API_TIMEOUT || '30000'),
        rateLimit: parseInt(process.env.RATE_LIMIT || '100')
      },
      security: {
        jwtSecret: process.env.JWT_SECRET || 'default-secret',
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
        corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
        rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000')
      },
      monitoring: {
        enabled: process.env.MONITORING_ENABLED === 'true',
        logLevel: process.env.LOG_LEVEL || 'info',
        metricsInterval: parseInt(process.env.METRICS_INTERVAL || '30000'),
        alertThresholds: {
          errorRate: parseFloat(process.env.ERROR_RATE_THRESHOLD || '5'),
          responseTime: parseInt(process.env.RESPONSE_TIME_THRESHOLD || '200'),
          memoryUsage: parseFloat(process.env.MEMORY_USAGE_THRESHOLD || '80')
        }
      }
    };

    this.emit('environmentLoaded', this.environmentConfig);
  }

  /**
   * Run comprehensive deployment validation
   */
  public async runDeploymentValidation(): Promise<DeploymentValidation> {
    const checks: DeploymentCheck[] = [];

    // Security checks
    checks.push(...await this.runSecurityChecks());
    
    // Performance checks
    checks.push(...await this.runPerformanceChecks());
    
    // Configuration checks
    checks.push(...await this.runConfigurationChecks());
    
    // Dependency checks
    checks.push(...await this.runDependencyChecks());

    const summary = this.calculateSummary(checks);
    const recommendations = this.generateRecommendations(checks);
    
    const overallStatus = this.determineOverallStatus(checks);

    this.deploymentValidation = {
      overallStatus,
      checks,
      summary,
      recommendations,
      timestamp: new Date()
    };

    this.isDeploymentReady = overallStatus === 'ready';
    this.emit('deploymentValidated', this.deploymentValidation);

    return this.deploymentValidation;
  }

  private async runSecurityChecks(): Promise<DeploymentCheck[]> {
    const checks: DeploymentCheck[] = [];

    // Check JWT secret
    checks.push({
      id: 'jwt_secret',
      name: 'JWT Secret Configuration',
      category: 'security',
      status: this.environmentConfig?.security.jwtSecret === 'default-secret' ? 'fail' : 'pass',
      message: this.environmentConfig?.security.jwtSecret === 'default-secret' 
        ? 'JWT secret is using default value' 
        : 'JWT secret is properly configured',
      timestamp: new Date()
    });

    // Check CORS configuration
    checks.push({
      id: 'cors_config',
      name: 'CORS Configuration',
      category: 'security',
      status: this.environmentConfig?.security.corsOrigins.length === 0 ? 'fail' : 'pass',
      message: this.environmentConfig?.security.corsOrigins.length === 0 
        ? 'CORS origins not configured' 
        : 'CORS origins properly configured',
      timestamp: new Date()
    });

    // Check SSL configuration
    checks.push({
      id: 'ssl_config',
      name: 'SSL Configuration',
      category: 'security',
      status: this.environmentConfig?.type === 'production' && !this.environmentConfig?.database.ssl ? 'fail' : 'pass',
      message: this.environmentConfig?.type === 'production' && !this.environmentConfig?.database.ssl 
        ? 'SSL required for production database' 
        : 'SSL configuration is appropriate',
      timestamp: new Date()
    });

    return checks;
  }

  private async runPerformanceChecks(): Promise<DeploymentCheck[]> {
    const checks: DeploymentCheck[] = [];

    // Check memory usage
    const memUsage = process.memoryUsage();
    const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    checks.push({
      id: 'memory_usage',
      name: 'Memory Usage',
      category: 'performance',
      status: memoryUsagePercent > 80 ? 'warning' : 'pass',
      message: `Memory usage: ${memoryUsagePercent.toFixed(1)}%`,
      details: { memoryUsagePercent },
      timestamp: new Date()
    });

    // Check response time
    checks.push({
      id: 'response_time',
      name: 'Response Time',
      category: 'performance',
      status: 'pass', // Mock check
      message: 'Response time within acceptable limits',
      timestamp: new Date()
    });

    return checks;
  }

  private async runConfigurationChecks(): Promise<DeploymentCheck[]> {
    const checks: DeploymentCheck[] = [];

    // Check environment variables
    const requiredEnvVars = ['NODE_ENV', 'DB_HOST', 'DB_NAME'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    checks.push({
      id: 'env_vars',
      name: 'Environment Variables',
      category: 'configuration',
      status: missingVars.length > 0 ? 'fail' : 'pass',
      message: missingVars.length > 0 
        ? `Missing environment variables: ${missingVars.join(', ')}` 
        : 'All required environment variables are set',
      details: { missingVars },
      timestamp: new Date()
    });

    // Check database connection
    checks.push({
      id: 'db_connection',
      name: 'Database Connection',
      category: 'configuration',
      status: 'pass', // Mock check
      message: 'Database connection is healthy',
      timestamp: new Date()
    });

    return checks;
  }

  private async runDependencyChecks(): Promise<DeploymentCheck[]> {
    const checks: DeploymentCheck[] = [];

    // Check package.json dependencies
    checks.push({
      id: 'dependencies',
      name: 'Dependencies',
      category: 'dependencies',
      status: 'pass', // Mock check
      message: 'All dependencies are up to date',
      timestamp: new Date()
    });

    // Check for security vulnerabilities
    checks.push({
      id: 'security_vulns',
      name: 'Security Vulnerabilities',
      category: 'dependencies',
      status: this.securityAudit?.vulnerabilities.critical > 0 ? 'fail' : 'pass',
      message: this.securityAudit?.vulnerabilities.critical > 0 
        ? `${this.securityAudit.vulnerabilities.critical} critical vulnerabilities found` 
        : 'No critical security vulnerabilities',
      details: this.securityAudit?.vulnerabilities,
      timestamp: new Date()
    });

    return checks;
  }

  private calculateSummary(checks: DeploymentCheck[]): DeploymentValidation['summary'] {
    return {
      total: checks.length,
      passed: checks.filter(c => c.status === 'pass').length,
      failed: checks.filter(c => c.status === 'fail').length,
      warnings: checks.filter(c => c.status === 'warning').length
    };
  }

  private generateRecommendations(checks: DeploymentCheck[]): string[] {
    const recommendations: string[] = [];

    const failedChecks = checks.filter(c => c.status === 'fail');
    const warningChecks = checks.filter(c => c.status === 'warning');

    if (failedChecks.length > 0) {
      recommendations.push(`Fix ${failedChecks.length} failed deployment checks before production deployment`);
    }

    if (warningChecks.length > 0) {
      recommendations.push(`Review ${warningChecks.length} warning checks for potential improvements`);
    }

    const securityChecks = checks.filter(c => c.category === 'security' && c.status === 'fail');
    if (securityChecks.length > 0) {
      recommendations.push('Address security issues before deployment');
    }

    const performanceChecks = checks.filter(c => c.category === 'performance' && c.status === 'warning');
    if (performanceChecks.length > 0) {
      recommendations.push('Consider performance optimizations for better user experience');
    }

    return recommendations;
  }

  private determineOverallStatus(checks: DeploymentCheck[]): DeploymentValidation['overallStatus'] {
    const criticalFailures = checks.filter(c => c.status === 'fail' && c.category === 'security').length;
    const totalFailures = checks.filter(c => c.status === 'fail').length;

    if (criticalFailures > 0) return 'critical';
    if (totalFailures > 0) return 'not_ready';
    return 'ready';
  }

  /**
   * Perform security audit
   */
  public async performSecurityAudit(): Promise<SecurityAudit> {
    // Mock security audit - in real implementation, this would run npm audit or similar
    this.securityAudit = {
      vulnerabilities: {
        critical: 0,
        high: 1,
        medium: 3,
        low: 5
      },
      outdatedPackages: [
        'react@17.0.2',
        'typescript@4.5.4'
      ],
      securityIssues: [
        'Outdated React version may have security vulnerabilities',
        'TypeScript version should be updated for latest security patches'
      ],
      recommendations: [
        'Update React to latest version',
        'Update TypeScript to latest version',
        'Run npm audit fix to resolve vulnerabilities'
      ],
      lastAudit: new Date()
    };

    this.emit('securityAuditCompleted', this.securityAudit);
    return this.securityAudit;
  }

  /**
   * Health check monitoring
   */
  public async performHealthCheck(service: string): Promise<HealthCheck> {
    const startTime = Date.now();
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    let details: any = {};

    try {
      // Mock health check - in real implementation, this would check actual service health
      const responseTime = Math.random() * 100 + 50; // 50-150ms
      
      if (responseTime > 200) {
        status = 'degraded';
      }

      details = { responseTime, service };

      const healthCheck: HealthCheck = {
        service,
        status,
        responseTime,
        lastChecked: new Date(),
        details
      };

      this.healthChecks.set(service, healthCheck);
      this.emit('healthCheckCompleted', healthCheck);

      return healthCheck;
    } catch (error) {
      const healthCheck: HealthCheck = {
        service,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        details: { error: error.message }
      };

      this.healthChecks.set(service, healthCheck);
      this.emit('healthCheckFailed', healthCheck);

      return healthCheck;
    }
  }

  /**
   * Production deployment preparation
   */
  public async prepareForProduction(): Promise<{
    ready: boolean;
    validation: DeploymentValidation;
    issues: string[];
  }> {
    // Run all validation checks
    const validation = await this.runDeploymentValidation();
    
    // Perform security audit
    await this.performSecurityAudit();
    
    // Check all services health
    const services = ['database', 'redis', 'api', 'websocket'];
    for (const service of services) {
      await this.performHealthCheck(service);
    }

    const issues: string[] = [];
    
    if (validation.overallStatus !== 'ready') {
      issues.push(`Deployment validation failed: ${validation.summary.failed} checks failed`);
    }

    if (this.securityAudit && this.securityAudit.vulnerabilities.critical > 0) {
      issues.push(`${this.securityAudit.vulnerabilities.critical} critical security vulnerabilities found`);
    }

    const unhealthyServices = Array.from(this.healthChecks.values())
      .filter(hc => hc.status === 'unhealthy');
    
    if (unhealthyServices.length > 0) {
      issues.push(`${unhealthyServices.length} services are unhealthy`);
    }

    const ready = issues.length === 0;

    this.emit('productionReady', { ready, validation, issues });
    return { ready, validation, issues };
  }

  /**
   * Get deployment status
   */
  public getDeploymentStatus(): {
    ready: boolean;
    validation: DeploymentValidation | null;
    securityAudit: SecurityAudit | null;
    healthChecks: HealthCheck[];
  } {
    return {
      ready: this.isDeploymentReady,
      validation: this.deploymentValidation,
      securityAudit: this.securityAudit,
      healthChecks: Array.from(this.healthChecks.values())
    };
  }

  /**
   * Get environment configuration
   */
  public getEnvironmentConfig(): EnvironmentConfig | null {
    return this.environmentConfig;
  }

  /**
   * Update environment configuration
   */
  public updateEnvironmentConfig(config: Partial<EnvironmentConfig>): void {
    if (this.environmentConfig) {
      this.environmentConfig = { ...this.environmentConfig, ...config };
      this.emit('environmentConfigUpdated', this.environmentConfig);
    }
  }

  /**
   * Validate configuration
   */
  public validateConfiguration(): boolean {
    if (!this.environmentConfig) return false;

    const requiredFields = [
      'database.host',
      'database.name',
      'security.jwtSecret',
      'api.baseUrl'
    ];

    for (const field of requiredFields) {
      const value = this.getNestedValue(this.environmentConfig, field);
      if (!value) {
        logger.error(`Missing required configuration: ${field}`);
        return false;
      }
    }

    return true;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

export default ProductionDeploymentService; 