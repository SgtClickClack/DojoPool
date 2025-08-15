import { EventEmitter } from "events";
import { NetworkTransport } from "./NetworkTransport";
import {
  NetworkError,
  NetworkMessage,
  NetworkMessageType,
  NetworkStats,
} from "./types";

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  jitter: number;
  retryBudget: number; // Maximum retries per time window
  retryWindow: number; // Time window for retry budget in ms
  adaptiveDelay: boolean; // Whether to use adaptive delays based on error types
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenMaxAttempts: number;
  successThreshold: number; // Required success rate in half-open state
  slidingWindowSize: number; // Size of sliding window for failure counting
  errorRateThreshold: number; // Error rate threshold for opening circuit
}

interface ErrorRecoveryConfig {
  retry: RetryConfig;
  circuitBreaker: CircuitBreakerConfig;
  messageTimeout: number;
  queueLimit: number;
  criticalMessageTypes: NetworkMessageType[]; // Message types that get priority retries
}

interface CircuitBreakerMetrics {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastStateChange: number;
  errorRate: number;
  retryBudget: number;
  retryBudgetReset: number;
}

const DEFAULT_CONFIG: ErrorRecoveryConfig = {
  retry: {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    jitter: 0.1,
    retryBudget: 100,
    retryWindow: 60000, // 1 minute
    adaptiveDelay: true,
  },
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeout: 30000,
    halfOpenMaxAttempts: 3,
    successThreshold: 0.5, // 50% success rate required
    slidingWindowSize: 100, // Last 100 requests
    errorRateThreshold: 0.5, // 50% error rate threshold
  },
  messageTimeout: 5000,
  queueLimit: 1000,
  criticalMessageTypes: [
    NetworkMessageType.STATE_SYNC,
    NetworkMessageType.APPEND_ENTRIES,
    NetworkMessageType.REQUEST_VOTE,
  ],
};

enum CircuitState {
  CLOSED,
  OPEN,
  HALF_OPEN,
  FORCED_OPEN, // Manually opened circuit
}

interface PendingMessage {
  message: NetworkMessage<any>;
  timestamp: number;
  retries: number;
  priority: number; // Higher number = higher priority
}

export class NetworkErrorRecovery extends EventEmitter {
  private readonly transport: NetworkTransport;
  private readonly config: ErrorRecoveryConfig;
  private readonly pendingMessages: Map<string, PendingMessage>;
  private readonly failureCount: Map<string, number>;
  private readonly circuitState: Map<string, CircuitState>;
  private readonly circuitTimer: Map<string, NodeJS.Timeout>;
  private readonly halfOpenAttempts: Map<string, number>;
  private readonly circuitMetrics: Map<string, CircuitBreakerMetrics>;
  private readonly failureWindow: Map<string, Array<{ timestamp: number; success: boolean }>>;
  private readonly retryBudget: Map<string, { count: number; resetTime: number }>;
  private checkTimer: NodeJS.Timeout | null = null;

  constructor(
    transport: NetworkTransport,
    config: Partial<ErrorRecoveryConfig> = {},
  ) {
    super();
    this.transport = transport;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.pendingMessages = new Map();
    this.failureCount = new Map();
    this.circuitState = new Map();
    this.circuitTimer = new Map();
    this.halfOpenAttempts = new Map();
    this.circuitMetrics = new Map();
    this.failureWindow = new Map();
    this.retryBudget = new Map();

    this.setupEventHandlers();
    this.startMessageCheck();
  }

  private setupEventHandlers(): void {
    this.transport.on("message", this.handleMessage.bind(this));
    this.transport.on("error", this.handleError.bind(this));
    this.transport.on("connect", this.handleConnect.bind(this));
    this.transport.on("disconnect", this.handleDisconnect.bind(this));
  }

  private handleMessage(message: NetworkMessage<any>): void {
    // Update metrics
    const metrics = this.getOrCreateMetrics(message.source);
    metrics.successCount++;
    this.updateFailureWindow(message.source, true);

    // Clear pending message on response
    if (this.isResponseMessage(message.type)) {
      const requestId = this.getRequestId(message.id);
      this.pendingMessages.delete(requestId);
      this.resetFailureCount(message.source);
    }

    // Emit metrics
    this.emitMetrics(message.source);
  }

  private handleError(error: NetworkError): void {
    const target = this.getTargetFromError(error);
    if (!target) return;

    // Update metrics
    const metrics = this.getOrCreateMetrics(target);
    metrics.failureCount++;
    this.updateFailureWindow(target, false);

    // Update circuit state
    const errorRate = this.calculateErrorRate(target);
    if (errorRate > this.config.circuitBreaker.errorRateThreshold) {
      this.openCircuit(target);
    }

    // Emit metrics
    this.emitMetrics(target);
  }

  private handleConnect(nodeId: string): void {
    this.resetFailureCount(nodeId);
    this.closeCircuit(nodeId);
    this.resetRetryBudget(nodeId);
    this.emitMetrics(nodeId);
  }

  private handleDisconnect(nodeId: string): void {
    this.openCircuit(nodeId);
    this.emitMetrics(nodeId);
  }

  private getOrCreateMetrics(nodeId: string): CircuitBreakerMetrics {
    let metrics = this.circuitMetrics.get(nodeId);
    if (!metrics) {
      metrics = {
        state: CircuitState.CLOSED,
        failureCount: 0,
        successCount: 0,
        lastStateChange: Date.now(),
        errorRate: 0,
        retryBudget: this.config.retry.retryBudget,
        retryBudgetReset: Date.now() + this.config.retry.retryWindow,
      };
      this.circuitMetrics.set(nodeId, metrics);
    }
    return metrics;
  }

  private updateFailureWindow(nodeId: string, success: boolean): void {
    const window = this.failureWindow.get(nodeId) || [];
    const now = Date.now();
    window.push({ timestamp: now, success });
    
    // Remove old entries
    while (window.length > 0 && now - window[0].timestamp > this.config.circuitBreaker.slidingWindowSize) {
      window.shift();
    }
    
    this.failureWindow.set(nodeId, window);
  }

  private calculateErrorRate(nodeId: string): number {
    const window = this.failureWindow.get(nodeId) || [];
    if (window.length === 0) return 0;
    
    const failures = window.filter(entry => !entry.success).length;
    return failures / window.length;
  }

  private resetRetryBudget(nodeId: string): void {
    this.retryBudget.set(nodeId, {
      count: this.config.retry.retryBudget,
      resetTime: Date.now() + this.config.retry.retryWindow,
    });
  }

  private checkRetryBudget(nodeId: string): boolean {
    const budget = this.retryBudget.get(nodeId);
    if (!budget) {
      this.resetRetryBudget(nodeId);
      return true;
    }

    // Reset budget if window expired
    if (Date.now() > budget.resetTime) {
      this.resetRetryBudget(nodeId);
      return true;
    }

    return budget.count > 0;
  }

  private decrementRetryBudget(nodeId: string): void {
    const budget = this.retryBudget.get(nodeId);
    if (budget) {
      budget.count--;
    }
  }

  private calculateRetryDelay(retryCount: number, errorType?: string): number {
    const baseDelay = this.config.retry.baseDelay;
    const maxDelay = this.config.retry.maxDelay;
    const jitter = this.config.retry.jitter;

    // Adaptive delay based on error type
    let multiplier = 1;
    if (this.config.retry.adaptiveDelay && errorType) {
      switch (errorType) {
        case "TIMEOUT":
          multiplier = 1.5; // Longer delay for timeouts
          break;
        case "CONNECTION_ERROR":
          multiplier = 2; // Even longer for connection errors
          break;
        case "RATE_LIMIT":
          multiplier = 3; // Much longer for rate limits
          break;
      }
    }

    // Exponential backoff with multiplier
    let delay = Math.min(baseDelay * Math.pow(2, retryCount) * multiplier, maxDelay);

    // Add jitter
    const min = delay * (1 - jitter);
    const max = delay * (1 + jitter);
    delay = min + Math.random() * (max - min);

    return delay;
  }

  private emitMetrics(nodeId: string): void {
    const metrics = this.circuitMetrics.get(nodeId);
    if (metrics) {
      this.emit("metrics", {
        nodeId,
        ...metrics,
        errorRate: this.calculateErrorRate(nodeId),
        pendingMessages: this.pendingMessages.size,
        timestamp: Date.now(),
      });
    }
  }

  private isResponseMessage(type: NetworkMessageType): boolean {
    return (
      type === NetworkMessageType.APPEND_ENTRIES_RESPONSE ||
      type === NetworkMessageType.REQUEST_VOTE_RESPONSE ||
      type === NetworkMessageType.STATE_SYNC_RESPONSE
    );
  }

  private getRequestId(messageId: string): string {
    return messageId.replace("_RESPONSE", "");
  }

  private getTargetFromError(error: NetworkError): string | null {
    // Try to extract nodeId from error details
    try {
      const details = JSON.parse(error.details);
      return details.nodeId || null;
    } catch {
      return null;
    }
  }

  private incrementFailureCount(nodeId: string): void {
    const count = (this.failureCount.get(nodeId) || 0) + 1;
    this.failureCount.set(nodeId, count);
    console.log('DEBUG: incrementFailureCount', nodeId, 'new count:', count, 'full map:', Array.from(this.failureCount.entries()));
  }

  private resetFailureCount(nodeId: string): void {
    this.failureCount.set(nodeId, 0);
    console.log('DEBUG: resetFailureCount', nodeId, 'full map:', Array.from(this.failureCount.entries()));
  }

  private checkCircuitBreaker(nodeId: string): void {
    const failures = this.failureCount.get(nodeId) || 0;
    const state = this.circuitState.get(nodeId) || CircuitState.CLOSED;

    if (
      state === CircuitState.CLOSED &&
      failures >= this.config.circuitBreaker.failureThreshold
    ) {
      this.openCircuit(nodeId);
    } else if (state === CircuitState.HALF_OPEN) {
      const attempts = this.halfOpenAttempts.get(nodeId) || 0;
      if (attempts >= this.config.circuitBreaker.halfOpenMaxAttempts) {
        this.openCircuit(nodeId);
      } else {
        this.halfOpenAttempts.set(nodeId, attempts + 1);
      }
    }
  }

  private openCircuit(nodeId: string): void {
    this.circuitState.set(nodeId, CircuitState.OPEN);
    const timer = setTimeout(() => {
      this.halfOpenCircuit(nodeId);
    }, this.config.circuitBreaker.resetTimeout);
    this.circuitTimer.set(nodeId, timer);
  }

  private halfOpenCircuit(nodeId: string): void {
    this.circuitState.set(nodeId, CircuitState.HALF_OPEN);
    this.halfOpenAttempts.set(nodeId, 0);
  }

  private closeCircuit(nodeId: string): void {
    this.circuitState.set(nodeId, CircuitState.CLOSED);
    this.halfOpenAttempts.delete(nodeId);
    const timer = this.circuitTimer.get(nodeId);
    if (timer) {
      clearTimeout(timer);
      this.circuitTimer.delete(nodeId);
    }
  }

  private startMessageCheck(): void {
    if (this.checkTimer) return;
    this.checkTimer = setInterval(() => {
      this.checkPendingMessages();
    }, 1000);
  }

  private stopMessageCheck(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  private checkPendingMessages(): void {
    const now = Date.now();
    for (const [messageId, pending] of this.pendingMessages.entries()) {
      if (now - pending.timestamp > this.config.messageTimeout) {
        if (pending.retries < this.config.retry.maxRetries) {
          this.retryMessage(messageId, pending);
        } else {
          this.handleMessageFailure(messageId, pending);
        }
      }
    }
  }

  private async retryMessage(
    messageId: string,
    pending: PendingMessage,
  ): Promise<void> {
    const delay = this.calculateRetryDelay(pending.retries);
    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      await this.transport.send(
        pending.message.target,
        pending.message.type,
        pending.message.payload,
      );
      this.pendingMessages.set(messageId, {
        ...pending,
        retries: pending.retries + 1,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.handleMessageFailure(messageId, pending);
    }
  }

  private handleMessageFailure(
    messageId: string,
    pending: PendingMessage,
  ): void {
    this.pendingMessages.delete(messageId);
    const error: NetworkError = {
      code: "MESSAGE_TIMEOUT",
      message: `Message ${messageId} failed after ${pending.retries} retries`,
      timestamp: Date.now(),
      details: JSON.stringify({
        messageId,
        target: pending.message.target,
        type: pending.message.type,
        retries: pending.retries,
      }),
    };
    this.emit("error", error);
  }

  public async send<T>(
    target: string,
    type: NetworkMessageType,
    payload: T,
  ): Promise<void> {
    // Check circuit breaker state
    const state = this.circuitState.get(target) || CircuitState.CLOSED;
    if (state === CircuitState.OPEN || state === CircuitState.FORCED_OPEN) {
      throw new Error(`Circuit breaker is open for node ${target}`);
    }

    // Check retry budget
    if (!this.checkRetryBudget(target)) {
      throw new Error(`Retry budget exceeded for node ${target}`);
    }

    // Calculate message priority
    const priority = this.config.criticalMessageTypes.includes(type) ? 2 : 1;

    try {
      await this.transport.send(target, type, payload);
      const message: NetworkMessage<T> = {
        id: `${this.transport["nodeId"]}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        source: this.transport["nodeId"],
        target,
        payload,
        timestamp: Date.now(),
      };
      this.pendingMessages.set(message.id, {
        message,
        timestamp: Date.now(),
        retries: 0,
        priority,
      });
      this.decrementRetryBudget(target);
    } catch (error) {
      this.handleError(error as NetworkError);
      throw error;
    }
  }

  public forceOpenCircuit(nodeId: string): void {
    this.circuitState.set(nodeId, CircuitState.FORCED_OPEN);
    this.emitMetrics(nodeId);
  }

  public forceCloseCircuit(nodeId: string): void {
    this.circuitState.set(nodeId, CircuitState.CLOSED);
    this.resetFailureCount(nodeId);
    this.emitMetrics(nodeId);
  }

  public getMetrics(nodeId: string): CircuitBreakerMetrics | undefined {
    return this.circuitMetrics.get(nodeId);
  }

  public stop(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  public onError(handler: (err: Error) => void): void {
    this.on('error', handler);
  }
}
