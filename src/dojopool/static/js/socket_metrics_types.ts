/**
 * TypeScript interfaces for WebSocket metrics.
 */

export interface MessageMetrics {
  timestamp: number;
  type: string;
  size: number;
  latency?: number;
}

export interface ConnectionMetrics {
  connectTime: number;
  disconnectTime: number;
  duration: number;
  reconnectAttempts: number;
}

export interface MessageStats {
  totalMessages: number;
  averageLatency: number;
  averageSize: number;
  messagesByType: { [key: string]: number };
}

export interface ConnectionStats {
  totalConnections: number;
  averageDuration: number;
  totalReconnects: number;
}

export interface MetricsCollector {
  trackMessageSent(type: string, payload: any): string;
  trackMessageReceived(messageId: string, type: string, payload: any): void;
  trackConnection(metrics: Partial<ConnectionMetrics>): void;
  getMessageMetrics(): MessageStats;
  getConnectionMetrics(): ConnectionStats;
  clear(): void;
}
