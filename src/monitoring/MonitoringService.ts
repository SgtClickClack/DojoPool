import { EventEmitter } from 'events';
import { AlertManager, Alert } from './alerts/AlertManager';
import { MonitoringConfig, DEFAULT_MONITORING_CONFIG } from './config';
import { ConsistencyMetrics, PerformanceMetrics, NodeMetrics } from './types';
import { ConsistencyMetricsCollector } from './collectors/ConsistencyMetricsCollector';
import { PerformanceMetricsCollector } from './collectors/PerformanceMetricsCollector';
import { NodeMetricsCollector } from './collectors/NodeMetricsCollector';
import { ConsensusProtocol } from '../core/consensus/ConsensusProtocol';
import { NetworkTransport } from '../core/network/NetworkTransport';
import { MetricsCollector, MetricsData } from './collectors/MetricsCollector';

export interface MonitoringEvents {
  'metrics': (data: { name: string; timestamp: number; metrics: MetricsData }) => void;
  'error': (data: { name: string; timestamp: number; error: string }) => void;
  'alert': (alert: Alert) => void;
}

export declare interface MonitoringService {
  on<K extends keyof MonitoringEvents>(event: K, listener: MonitoringEvents[K]): this;
  emit<K extends keyof MonitoringEvents>(event: K, ...args: Parameters<MonitoringEvents[K]>): boolean;
}

interface MetricsHistory<T extends MetricsData> {
  timestamp: number;
  metrics: T;
}

export class MonitoringService extends EventEmitter {
  public readonly config: MonitoringConfig;
  private readonly collectors: Map<string, MetricsCollector<MetricsData>>;
  private readonly metricsHistory: Map<string, MetricsHistory<MetricsData>[]>;
  private readonly alertManager: AlertManager;
  private collectionTimer?: NodeJS.Timeout;
  private isRunning: boolean = false;
  private readonly performanceCollector: PerformanceMetricsCollector;

  constructor(
    networkTransport: NetworkTransport,
    consensusProtocol: ConsensusProtocol,
    config: Partial<MonitoringConfig> = {}
  ) {
    super();
    this.config = {
      ...DEFAULT_MONITORING_CONFIG,
      ...config
    };

    this.alertManager = new AlertManager(this.config);
    this.collectors = new Map();
    this.metricsHistory = new Map();

    // Initialize collectors
    this.performanceCollector = new PerformanceMetricsCollector();
    const consistencyCollector = new ConsistencyMetricsCollector(consensusProtocol);
    const nodeCollector = new NodeMetricsCollector();

    this.collectors.set('performance', this.performanceCollector);
    this.collectors.set('consistency', consistencyCollector);
    this.collectors.set('node', nodeCollector);

    // Initialize metrics history
    for (const [name] of this.collectors) {
      this.metricsHistory.set(name, []);
    }

    // Set up event listeners for collectors
    for (const [name, collector] of this.collectors) {
      collector.on('metrics', (metrics: MetricsData) => {
        this.addMetricsToHistory(name, Date.now(), metrics);
        this.emit('metrics', { name, timestamp: Date.now(), metrics });
      });
    }

    // Forward alert events from AlertManager
    this.alertManager.on('alert', (alert: Alert) => {
      this.emit('alert', alert);
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    await this.collectMetrics();
    this.startCollection();
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.stopCollection();
  }

  private startCollection(): void {
    this.collectionTimer = setInterval(
      () => this.collectMetrics(),
      this.config.collectionInterval
    );
  }

  private stopCollection(): void {
    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
      this.collectionTimer = undefined;
    }
  }

  private async collectMetrics(): Promise<void> {
    const timestamp = Date.now();

    for (const [name, collector] of this.collectors) {
      try {
        const metrics = await collector.collect();
        this.addMetricsToHistory(name, timestamp, metrics);
        this.emit('metrics', { name, timestamp, metrics });
      } catch (error) {
        this.emit('error', {
          name,
          timestamp,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    this.pruneOldMetrics();
  }

  private addMetricsToHistory(name: string, timestamp: number, metrics: MetricsData): void {
    const history = this.metricsHistory.get(name);
    if (!history) return;

    history.push({ timestamp, metrics });

    // Enforce max data points limit
    if (history.length > this.config.maxDataPoints) {
      const excess = history.length - this.config.maxDataPoints;
      history.splice(0, excess);
    }
  }

  private pruneOldMetrics(): void {
    const cutoffTime = Date.now() - this.config.retentionPeriod;

    for (const [name, history] of this.metricsHistory) {
      const prunedHistory = history.filter(entry => entry.timestamp >= cutoffTime);
      this.metricsHistory.set(name, prunedHistory);
    }
  }

  getMetricsHistory(name: string): MetricsHistory<MetricsData>[] {
    return this.metricsHistory.get(name) ?? [];
  }

  getLatestMetrics(name: string): MetricsHistory<MetricsData> | null {
    const history = this.metricsHistory.get(name);
    if (!history || history.length === 0) return null;
    return history[history.length - 1];
  }

  resetCollector(name: string): void {
    const collector = this.collectors.get(name);
    if (collector) {
      collector.reset();
      this.metricsHistory.set(name, []);
    }
  }

  resetAllCollectors(): void {
    for (const [name] of this.collectors) {
      this.resetCollector(name);
    }
  }

  public recordOperationTime(timeMs: number): void {
    this.performanceCollector.recordOperationTime(timeMs);
  }

  public recordError(): void {
    this.performanceCollector.recordError();
  }

  public updateQueueLength(size: number): void {
    this.performanceCollector.updateQueueLength(size);
  }

  getActiveAlerts(): Alert[] {
    return this.alertManager.getActiveAlerts();
  }
} 