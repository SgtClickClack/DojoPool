import { EventEmitter } from 'events';
import { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import Logger, { logger } from '../../utils/Logger';

/**
 * Standard configuration interface for all services
 */
export interface BaseServiceConfig {
  enabled: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  timeout?: number;
  apiEndpoint?: string;
  websocketUrl?: string;
}

/**
 * Standard metrics interface for all services
 */
export interface BaseServiceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastActivity: Date;
  isConnected: boolean;
  uptime: number;
}

/**
 * Base service class that provides common functionality for all DojoPool services
 * Includes WebSocket management, error handling, metrics, and logging
 */
export abstract class BaseService extends EventEmitter {
  protected logger: Logger;
  protected socket: Socket | null = null;
  protected isConnected = false;
  protected reconnectAttempts = 0;
  protected maxReconnectAttempts = 5;
  protected reconnectInterval = 5000;
  protected startTime: Date;
  protected metrics: BaseServiceMetrics;
  protected config: BaseServiceConfig;

  constructor(
    protected serviceName: string,
    config: Partial<BaseServiceConfig> = {}
  ) {
    super();
    this.logger = Logger.createLogger(serviceName);
    this.startTime = new Date();
    
    // Default configuration
    this.config = {
      enabled: true,
      reconnectAttempts: 5,
      reconnectInterval: 5000,
      timeout: 10000,
      websocketUrl: 'http://localhost:8080',
      ...config
    };

    // Initialize metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastActivity: new Date(),
      isConnected: false,
      uptime: 0
    };

    this.maxReconnectAttempts = this.config.reconnectAttempts || 5;
    this.reconnectInterval = this.config.reconnectInterval || 5000;

    this.logger.info(`${serviceName} service initialized`, { config: this.config });
    
    // Initialize WebSocket if URL provided
    if (this.config.websocketUrl) {
      this.initializeWebSocket();
    }

    // Start metrics collection
    this.startMetricsCollection();
  }

  /**
   * Initialize WebSocket connection
   */
  protected initializeWebSocket(): void {
    if (!this.config.websocketUrl) return;

    try {
      this.socket = io(this.config.websocketUrl, {
        transports: ['websocket'],
        timeout: this.config.timeout
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        this.metrics.isConnected = true;
        this.reconnectAttempts = 0;
        this.logger.info(`${this.serviceName} WebSocket connected`);
        this.emit('connected');
        this.onWebSocketConnected();
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        this.metrics.isConnected = false;
        this.logger.warn(`${this.serviceName} WebSocket disconnected`);
        this.handleReconnection();
        this.emit('disconnected');
        this.onWebSocketDisconnected();
      });

             this.socket.on('error', (error: Error) => {
         this.logger.error(`${this.serviceName} WebSocket error`, error);
         this.emit('error', error);
         this.onWebSocketError(error);
       });

    } catch (error) {
      this.logger.error(`Failed to initialize ${this.serviceName} WebSocket`, error as Error);
      this.isConnected = false;
      this.metrics.isConnected = false;
    }
  }

  /**
   * Handle WebSocket reconnection
   */
  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.logger.info(`Attempting to reconnect ${this.serviceName} (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.initializeWebSocket();
      }, this.reconnectInterval);
    } else {
      this.logger.error(`${this.serviceName} max reconnection attempts reached`);
      this.emit('maxReconnectAttemptsReached');
    }
  }

  /**
   * Make an API request with automatic metrics tracking
   */
  protected async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const startTime = performance.now();
    this.metrics.totalRequests++;
    this.metrics.lastActivity = new Date();

    try {
      const url = this.config.apiEndpoint ? `${this.config.apiEndpoint}${endpoint}` : endpoint;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const duration = performance.now() - startTime;
      this.updateResponseTime(duration);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.metrics.successfulRequests++;
      
      this.logger.apiRequest(
        options.method || 'GET',
        url,
        Math.round(duration),
        response.status
      );

      return data;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.updateResponseTime(duration);
      this.metrics.failedRequests++;
      
      this.logger.error(
        `API request failed: ${endpoint}`,
        error as Error,
        { endpoint, duration: Math.round(duration) }
      );
      
      throw error;
    }
  }

  /**
   * Emit WebSocket event with error handling
   */
  protected emitSocketEvent(event: string, data?: any): void {
    if (this.socket && this.isConnected) {
      try {
        this.socket.emit(event, data);
        this.logger.debug(`Socket event emitted: ${event}`, { event, data });
      } catch (error) {
        this.logger.error(`Failed to emit socket event: ${event}`, error as Error);
      }
    } else {
      this.logger.warn(`Cannot emit socket event ${event}: not connected`);
    }
  }

  /**
   * Update average response time
   */
  private updateResponseTime(duration: number): void {
    const totalRequests = this.metrics.totalRequests;
    const currentAverage = this.metrics.averageResponseTime;
    this.metrics.averageResponseTime = 
      (currentAverage * (totalRequests - 1) + duration) / totalRequests;
  }

  /**
   * Start metrics collection timer
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      this.metrics.uptime = Date.now() - this.startTime.getTime();
    }, 1000);
  }

  /**
   * Generate unique ID for entities
   */
  protected generateId(): string {
    return `${this.serviceName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate required configuration
   */
  protected validateConfig(requiredFields: string[]): void {
    const missingFields = requiredFields.filter(field => !this.config[field as keyof BaseServiceConfig]);
    
    if (missingFields.length > 0) {
      const error = new Error(`Missing required configuration fields: ${missingFields.join(', ')}`);
      this.logger.error('Configuration validation failed', error);
      throw error;
    }
  }

  /**
   * Safe async operation with error handling
   */
  protected async safeAsync<T>(
    operation: () => Promise<T>,
    fallback?: T,
    operationName = 'operation'
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      this.logger.error(`${operationName} failed`, error as Error);
      return fallback;
    }
  }

  /**
   * Throttle function execution
   */
  protected throttle<T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ): T {
    let lastExecution = 0;
    return ((...args: any[]) => {
      const now = Date.now();
      if (now - lastExecution >= delay) {
        lastExecution = now;
        return func(...args);
      }
    }) as T;
  }

  /**
   * Debounce function execution
   */
  protected debounce<T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ): T {
    let timeoutId: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    }) as T;
  }

  // Abstract methods to be implemented by child classes
  protected abstract onWebSocketConnected(): void;
  protected abstract onWebSocketDisconnected(): void;
  protected abstract onWebSocketError(error: Error): void;

  // Public API methods
  public getMetrics(): BaseServiceMetrics {
    return { ...this.metrics };
  }

  public getConfig(): BaseServiceConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<BaseServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info(`${this.serviceName} configuration updated`, { newConfig });
    this.emit('configUpdated', this.config);
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.metrics.isConnected = false;
    this.logger.info(`${this.serviceName} service disconnected`);
  }

  public async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const health = {
        service: this.serviceName,
        connected: this.isConnected,
        uptime: this.metrics.uptime,
        metrics: this.metrics,
        config: { ...this.config, apiEndpoint: this.config.apiEndpoint ? '[REDACTED]' : undefined }
      };

      return {
        status: this.isConnected && this.config.enabled ? 'healthy' : 'unhealthy',
        details: health
      };
    } catch (error) {
      this.logger.error('Health check failed', error as Error);
      return {
        status: 'unhealthy',
        details: { error: (error as Error).message }
      };
    }
  }
}