import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

export interface ErrorEvent {
  id: string;
  timestamp: Date;
  error: Error;
  context: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    url?: string;
    method?: string;
    userAgent?: string;
    ipAddress?: string;
    component?: string;
    action?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'runtime' | 'network' | 'database' | 'security' | 'validation' | 'performance';
  stack?: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface ErrorPattern {
  pattern: string;
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  autoResolve: boolean;
  resolution?: string;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  averageResolutionTime: number;
  unresolvedErrors: number;
  criticalErrors: number;
  errorRate: number;
  lastCalculated: Date;
}

export interface RecoveryAction {
  id: string;
  type: 'retry' | 'fallback' | 'circuit_breaker' | 'graceful_degradation' | 'restart';
  description: string;
  conditions: string[];
  actions: string[];
  successRate: number;
  lastUsed: Date;
  enabled: boolean;
}

export interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  lastFailureTime: Date;
  threshold: number;
  timeout: number;
  resetTime: Date;
}

class ErrorHandlingService extends EventEmitter {
  private static instance: ErrorHandlingService;
  private errors: ErrorEvent[] = [];
  private patterns: Map<string, ErrorPattern> = new Map();
  private recoveryActions: Map<string, RecoveryAction> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private metrics: ErrorMetrics | null = null;
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initializeService();
  }

  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  private initializeService(): void {
    console.log('Error Handling Service initialized');
    this.setupGlobalErrorHandlers();
    this.loadRecoveryActions();
    this.startMonitoring();
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      this.handleError(error, {
        category: 'runtime',
        severity: 'critical',
        component: 'process'
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      this.handleError(error, {
        category: 'runtime',
        severity: 'high',
        component: 'promise'
      });
    });

    // Handle process warnings
    process.on('warning', (warning: Error) => {
      this.handleError(warning, {
        category: 'runtime',
        severity: 'medium',
        component: 'process'
      });
    });
  }

  /**
   * Handle and log errors
   */
  public handleError(
    error: Error, 
    options: {
      category?: string;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      component?: string;
      context?: any;
    } = {}
  ): ErrorEvent {
    const errorEvent: ErrorEvent = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      error,
      context: {
        component: options.component,
        ...options.context
      },
      severity: options.severity || 'medium',
      category: options.category || 'runtime',
      stack: error.stack,
      resolved: false
    };

    this.errors.push(errorEvent);
    this.analyzeErrorPattern(errorEvent);
    this.checkRecoveryActions(errorEvent);
    this.updateMetrics();

    this.emit('errorLogged', errorEvent);
    logger.error(`Error handled: ${error.message}`, error, errorEvent.context);

    return errorEvent;
  }

  /**
   * Analyze error patterns for automatic resolution
   */
  private analyzeErrorPattern(errorEvent: ErrorEvent): void {
    const pattern = this.extractErrorPattern(errorEvent.error);
    const existingPattern = this.patterns.get(pattern);

    if (existingPattern) {
      existingPattern.count++;
      existingPattern.lastOccurrence = errorEvent.timestamp;
      
      // Auto-resolve if pattern occurs frequently
      if (existingPattern.count >= 10 && existingPattern.autoResolve) {
        this.autoResolvePattern(existingPattern);
      }
    } else {
      const newPattern: ErrorPattern = {
        pattern,
        count: 1,
        firstOccurrence: errorEvent.timestamp,
        lastOccurrence: errorEvent.timestamp,
        severity: errorEvent.severity,
        category: errorEvent.category,
        autoResolve: this.shouldAutoResolve(errorEvent)
      };
      this.patterns.set(pattern, newPattern);
    }
  }

  private extractErrorPattern(error: Error): string {
    // Extract meaningful pattern from error
    const message = error.message.toLowerCase();
    const stack = error.stack || '';
    
    // Look for common patterns
    if (message.includes('timeout')) return 'timeout_error';
    if (message.includes('connection')) return 'connection_error';
    if (message.includes('validation')) return 'validation_error';
    if (message.includes('permission')) return 'permission_error';
    if (message.includes('not found')) return 'not_found_error';
    if (message.includes('database')) return 'database_error';
    
    // Default to message hash
    return this.hashString(message);
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `pattern_${Math.abs(hash)}`;
  }

  private shouldAutoResolve(errorEvent: ErrorEvent): boolean {
    // Auto-resolve low severity errors
    if (errorEvent.severity === 'low') return true;
    
    // Auto-resolve common network errors
    if (errorEvent.category === 'network' && errorEvent.severity !== 'critical') return true;
    
    return false;
  }

  private autoResolvePattern(pattern: ErrorPattern): void {
    pattern.resolution = 'Auto-resolved due to frequency';
    this.emit('patternAutoResolved', pattern);
  }

  /**
   * Check and execute recovery actions
   */
  private checkRecoveryActions(errorEvent: ErrorEvent): void {
    for (const [actionId, action] of this.recoveryActions) {
      if (!action.enabled) continue;

      const shouldExecute = this.shouldExecuteRecoveryAction(action, errorEvent);
      if (shouldExecute) {
        this.executeRecoveryAction(action, errorEvent);
      }
    }
  }

  private shouldExecuteRecoveryAction(action: RecoveryAction, errorEvent: ErrorEvent): boolean {
    // Check if error matches action conditions
    const errorMessage = errorEvent.error.message.toLowerCase();
    const errorCategory = errorEvent.category;
    const errorSeverity = errorEvent.severity;

    return action.conditions.some(condition => {
      if (condition.includes('category:') && condition.includes(errorCategory)) return true;
      if (condition.includes('severity:') && condition.includes(errorSeverity)) return true;
      if (condition.includes('message:') && errorMessage.includes(condition.split(':')[1])) return true;
      return false;
    });
  }

  private async executeRecoveryAction(action: RecoveryAction, errorEvent: ErrorEvent): Promise<void> {
    try {
      this.emit('recoveryActionExecuting', { action, errorEvent });

      switch (action.type) {
        case 'retry':
          await this.executeRetryAction(action, errorEvent);
          break;
        case 'fallback':
          await this.executeFallbackAction(action, errorEvent);
          break;
        case 'circuit_breaker':
          await this.executeCircuitBreakerAction(action, errorEvent);
          break;
        case 'graceful_degradation':
          await this.executeGracefulDegradationAction(action, errorEvent);
          break;
        case 'restart':
          await this.executeRestartAction(action, errorEvent);
          break;
      }

      action.lastUsed = new Date();
      this.emit('recoveryActionCompleted', { action, errorEvent });
    } catch (error) {
      this.emit('recoveryActionFailed', { action, errorEvent, error });
    }
  }

  private async executeRetryAction(action: RecoveryAction, errorEvent: ErrorEvent): Promise<void> {
    // Implement retry logic
    logger.info(`Executing retry action: ${action.description}`);
  }

  private async executeFallbackAction(action: RecoveryAction, errorEvent: ErrorEvent): Promise<void> {
    // Implement fallback logic
    logger.info(`Executing fallback action: ${action.description}`);
  }

  private async executeCircuitBreakerAction(action: RecoveryAction, errorEvent: ErrorEvent): Promise<void> {
    // Implement circuit breaker logic
    logger.info(`Executing circuit breaker action: ${action.description}`);
  }

  private async executeGracefulDegradationAction(action: RecoveryAction, errorEvent: ErrorEvent): Promise<void> {
    // Implement graceful degradation logic
    logger.info(`Executing graceful degradation action: ${action.description}`);
  }

  private async executeRestartAction(action: RecoveryAction, errorEvent: ErrorEvent): Promise<void> {
    // Implement restart logic
    logger.info(`Executing restart action: ${action.description}`);
  }

  /**
   * Circuit breaker implementation
   */
  public getCircuitBreaker(key: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(key)) {
      this.circuitBreakers.set(key, {
        isOpen: false,
        failureCount: 0,
        lastFailureTime: new Date(),
        threshold: 5,
        timeout: 60000, // 1 minute
        resetTime: new Date()
      });
    }
    return this.circuitBreakers.get(key)!;
  }

  public recordFailure(key: string): void {
    const breaker = this.getCircuitBreaker(key);
    breaker.failureCount++;
    breaker.lastFailureTime = new Date();

    if (breaker.failureCount >= breaker.threshold) {
      breaker.isOpen = true;
      breaker.resetTime = new Date(Date.now() + breaker.timeout);
      this.emit('circuitBreakerOpened', { key, breaker });
    }
  }

  public recordSuccess(key: string): void {
    const breaker = this.getCircuitBreaker(key);
    breaker.failureCount = 0;
    breaker.isOpen = false;
    this.emit('circuitBreakerClosed', { key, breaker });
  }

  public isCircuitBreakerOpen(key: string): boolean {
    const breaker = this.getCircuitBreaker(key);
    
    if (!breaker.isOpen) return false;
    
    // Check if timeout has passed
    if (Date.now() > breaker.resetTime.getTime()) {
      breaker.isOpen = false;
      breaker.failureCount = 0;
      return false;
    }
    
    return true;
  }

  /**
   * Error resolution
   */
  public resolveError(errorId: string, resolvedBy: string, resolution?: string): void {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      error.resolvedAt = new Date();
      error.resolvedBy = resolvedBy;
      
      this.emit('errorResolved', { error, resolvedBy, resolution });
    }
  }

  /**
   * Metrics and monitoring
   */
  private updateMetrics(): void {
    const now = new Date();
    const recentErrors = this.errors.filter(e => 
      now.getTime() - e.timestamp.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    const errorsByCategory: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};

    recentErrors.forEach(error => {
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    });

    const resolvedErrors = recentErrors.filter(e => e.resolved);
    const averageResolutionTime = resolvedErrors.length > 0 
      ? resolvedErrors.reduce((sum, e) => {
          const resolutionTime = e.resolvedAt!.getTime() - e.timestamp.getTime();
          return sum + resolutionTime;
        }, 0) / resolvedErrors.length
      : 0;

    this.metrics = {
      totalErrors: recentErrors.length,
      errorsByCategory,
      errorsBySeverity,
      averageResolutionTime,
      unresolvedErrors: recentErrors.filter(e => !e.resolved).length,
      criticalErrors: recentErrors.filter(e => e.severity === 'critical').length,
      errorRate: recentErrors.length / 24, // errors per hour
      lastCalculated: now
    };

    this.emit('metricsUpdated', this.metrics);
  }

  private startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.cleanupOldErrors();
    }, 60000); // Every minute

    console.log('Error monitoring started');
  }

  private cleanupOldErrors(): void {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    this.errors = this.errors.filter(error => error.timestamp > cutoff);
  }

  /**
   * Load predefined recovery actions
   */
  private loadRecoveryActions(): void {
    const actions: RecoveryAction[] = [
      {
        id: 'network_retry',
        type: 'retry',
        description: 'Retry network requests with exponential backoff',
        conditions: ['category:network', 'severity:medium'],
        actions: ['Wait 1 second', 'Retry request', 'Log retry attempt'],
        successRate: 0.8,
        lastUsed: new Date(),
        enabled: true
      },
      {
        id: 'database_fallback',
        type: 'fallback',
        description: 'Use cached data when database is unavailable',
        conditions: ['category:database', 'message:connection'],
        actions: ['Check cache', 'Return cached data', 'Log fallback'],
        successRate: 0.9,
        lastUsed: new Date(),
        enabled: true
      },
      {
        id: 'api_circuit_breaker',
        type: 'circuit_breaker',
        description: 'Open circuit breaker for failing API endpoints',
        conditions: ['category:network', 'severity:high'],
        actions: ['Open circuit breaker', 'Return cached response', 'Monitor health'],
        successRate: 0.7,
        lastUsed: new Date(),
        enabled: true
      },
      {
        id: 'graceful_degradation',
        type: 'graceful_degradation',
        description: 'Reduce functionality when system is under load',
        conditions: ['severity:critical', 'message:timeout'],
        actions: ['Disable non-essential features', 'Show maintenance message', 'Queue requests'],
        successRate: 0.6,
        lastUsed: new Date(),
        enabled: true
      }
    ];

    actions.forEach(action => {
      this.recoveryActions.set(action.id, action);
    });
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public getter methods
  public getErrors(): ErrorEvent[] {
    return [...this.errors];
  }

  public getErrorPatterns(): ErrorPattern[] {
    return Array.from(this.patterns.values());
  }

  public getRecoveryActions(): RecoveryAction[] {
    return Array.from(this.recoveryActions.values());
  }

  public getCircuitBreakers(): Map<string, CircuitBreakerState> {
    return new Map(this.circuitBreakers);
  }

  public getMetrics(): ErrorMetrics | null {
    return this.metrics;
  }

  public isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('Error monitoring stopped');
  }
}

export default ErrorHandlingService; 