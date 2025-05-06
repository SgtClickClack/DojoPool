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
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenMaxAttempts: number;
}

interface ErrorRecoveryConfig {
  retry: RetryConfig;
  circuitBreaker: CircuitBreakerConfig;
  messageTimeout: number;
  queueLimit: number;
}

const DEFAULT_CONFIG: ErrorRecoveryConfig = {
  retry: {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    jitter: 0.1,
  },
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeout: 30000,
    halfOpenMaxAttempts: 3,
  },
  messageTimeout: 5000,
  queueLimit: 1000,
};

enum CircuitState {
  CLOSED,
  OPEN,
  HALF_OPEN,
}

interface PendingMessage {
  message: NetworkMessage<any>;
  timestamp: number;
  retries: number;
}

export class NetworkErrorRecovery extends EventEmitter {
  private readonly transport: NetworkTransport;
  private readonly config: ErrorRecoveryConfig;
  private readonly pendingMessages: Map<string, PendingMessage>;
  private readonly failureCount: Map<string, number>;
  private readonly circuitState: Map<string, CircuitState>;
  private readonly circuitTimer: Map<string, NodeJS.Timeout>;
  private readonly halfOpenAttempts: Map<string, number>;
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
    // Clear pending message on response
    if (this.isResponseMessage(message.type)) {
      const requestId = this.getRequestId(message.id);
      this.pendingMessages.delete(requestId);
      this.resetFailureCount(message.source);
    }
  }

  private handleError(error: NetworkError): void {
    const nodeId = this.extractNodeId(error);
    console.log('DEBUG: handleError called with nodeId', nodeId, 'error:', error);
    if (nodeId) {
      this.incrementFailureCount(nodeId);
      this.checkCircuitBreaker(nodeId);
    }
  }

  private handleConnect(nodeId: string): void {
    this.resetFailureCount(nodeId);
    this.closeCircuit(nodeId);
  }

  private handleDisconnect(nodeId: string): void {
    this.incrementFailureCount(nodeId);
    this.checkCircuitBreaker(nodeId);
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

  private extractNodeId(error: NetworkError): string | null {
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

  private calculateRetryDelay(retryCount: number): number {
    const baseDelay = this.config.retry.baseDelay;
    const maxDelay = this.config.retry.maxDelay;
    const jitter = this.config.retry.jitter;

    // Exponential backoff
    let delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);

    // Add jitter
    const min = delay * (1 - jitter);
    const max = delay * (1 + jitter);
    delay = min + Math.random() * (max - min);

    return delay;
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
    // DEBUG: Log failureCount map at the start of send
    console.log('DEBUG: failureCount at send start', Array.from(this.failureCount.entries()));
    // DEBUG: Log circuit breaker state before check
    // @ts-ignore
    console.log('DEBUG: circuitState before check', target, this.circuitState.get(target));
    // Check circuit breaker
    const state = this.circuitState.get(target) || CircuitState.CLOSED;
    if (state === CircuitState.OPEN) {
      console.log('DEBUG: circuit breaker is OPEN, throwing error');
      throw new Error(`Circuit breaker is open for node ${target}`);
    }
    console.log('DEBUG: circuit breaker is not open, proceeding');
    // Check queue limit
    if (this.pendingMessages.size >= this.config.queueLimit) {
      throw new Error("Message queue limit exceeded");
    }
    try {
      console.log('DEBUG: calling transport.send');
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
      });
    } catch (error) {
      this.handleError(error as NetworkError);
      // PATCH: Immediately check if circuit breaker is now open and throw that error if so
      const newState = this.circuitState.get(target) || CircuitState.CLOSED;
      console.log('DEBUG: circuitState after error', target, newState);
      if (newState === CircuitState.OPEN) {
        console.log('DEBUG: circuit breaker is now OPEN after error, throwing error');
        throw new Error(`Circuit breaker is open for node ${target}`);
      }
      throw error;
    }
  }

  public stop(): void {
    this.stopMessageCheck();
    for (const timer of this.circuitTimer.values()) {
      clearTimeout(timer);
    }
    this.circuitTimer.clear();
    this.pendingMessages.clear();
    this.failureCount.clear();
    this.circuitState.clear();
    this.halfOpenAttempts.clear();
  }
}
