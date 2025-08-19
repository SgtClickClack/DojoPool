import {
  AlertManager,
  type Alert,
  AlertSeverity,
} from '../../monitoring/AlertManager';
import {
  type ConsistencyMetrics,
  type PerformanceMetrics,
  type NodeMetrics,
} from '../../monitoring/types';
import { type MonitoringConfig } from '../../monitoring/config';

describe('AlertManager', () => {
  let alertManager: AlertManager;
  let config: MonitoringConfig;
  let alerts: Alert[];

  beforeEach(() => {
    config = {
      collectionInterval: 1000,
      retentionPeriod: 3600000,
      maxDataPoints: 1000,
      consistencyThresholds: {
        latency: { warning: 1000, critical: 5000 },
        successRate: { warning: 0.95, critical: 0.9 },
        minNodes: 3,
        maxSyncDelay: 5000,
      },
      performanceThresholds: {
        operationLatency: { warning: 500, critical: 2000 },
        errorRate: { warning: 0.05, critical: 0.1 },
        maxQueueLength: 100,
        minThroughput: 100,
        resourceUsage: {
          cpu: { warning: 70, critical: 90 },
          memory: { warning: 80, critical: 95 },
          network: { warning: 80, critical: 95 },
          disk: { warning: 75, critical: 90 },
        },
      },
      nodeThresholds: {
        heartbeatInterval: 5000,
        maxTermGap: 100,
        maxPendingOperations: 1000,
      },
      networkThresholds: {
        rtt: { warning: 200, critical: 1000 },
        errorRate: { warning: 5, critical: 10 },
        minThroughput: { warning: 50, critical: 10 },
        queueSize: { warning: 100, critical: 500 },
        maxReconnectionAttempts: 5,
        messageTimeout: { warning: 10000, critical: 30000 },
        minStability: { warning: 80, critical: 60 },
      },
    };

    alertManager = new AlertManager(config);
    alerts = [];

    alertManager.on('alert', (alert: Alert) => {
      alerts.push(alert);
    });
  });

  afterEach(() => {
    alerts = [];
  });

  describe('Consistency Metrics', () => {
    it('should emit warning alert when latency exceeds warning threshold', () => {
      const metrics: ConsistencyMetrics = {
        latency: 2000,
        successRate: 1,
        nodes: 4,
        lastSyncTimestamp: Date.now(),
      };

      alertManager.checkConsistencyMetrics(metrics);

      expect(alerts).toHaveLength(2);
      expect(alerts[0]).toMatchObject({
        id: 'consistency-latency',
        severity: 'warning',
        value: 2000,
        threshold: 1000,
      });
    });

    it('should emit critical alert when node count is below minimum', () => {
      const metrics: ConsistencyMetrics = {
        latency: 100,
        successRate: 1,
        nodes: 2,
        lastSyncTimestamp: Date.now(),
      };

      alertManager.checkConsistencyMetrics(metrics);

      expect(alerts).toHaveLength(2);
      expect(alerts.map((a) => a.id)).toContain('consistency-node-count');
      expect(alerts.map((a) => a.id)).toContain('consistency-success-rate');
      expect(alerts).toContainEqual(
        expect.objectContaining({
          id: 'consistency-node-count',
          severity: 'critical',
          value: 2,
          threshold: 3,
        })
      );
    });
  });

  describe('Performance Metrics', () => {
    it('should emit alerts for high resource usage', () => {
      const metrics: PerformanceMetrics = {
        operationLatency: 100,
        errorRate: 0.01,
        queueLength: 50,
        throughput: 120,
        resourceUsage: {
          cpu: 85,
          memory: 90,
          network: 70,
          disk: 60,
        },
      };

      alertManager.checkPerformanceMetrics(metrics);

      expect(alerts).toHaveLength(2);
      expect(alerts.map((a) => a.id)).toContain('resource-cpu');
      expect(alerts.map((a) => a.id)).toContain('resource-memory');
    });

    it('should emit warning alert for long queue length', () => {
      const metrics: PerformanceMetrics = {
        operationLatency: 100,
        errorRate: 0.01,
        queueLength: 150,
        throughput: 110,
        resourceUsage: {
          cpu: 50,
          memory: 60,
          network: 50,
          disk: 45,
        },
      };

      alertManager.checkPerformanceMetrics(metrics);

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        id: 'queue-length',
        severity: 'warning',
        value: 150,
        threshold: 100,
      });
    });
  });

  describe('Node Metrics', () => {
    it('should emit critical alert for failing node', () => {
      const metrics: NodeMetrics = {
        nodeId: 'node1',
        status: 'failing',
        pendingOperations: 10,
        term: 1,
        lastHeartbeat: Date.now(),
        leaderStatus: false,
      };

      alertManager.checkNodeMetrics(metrics);

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        id: 'node-status-node1',
        type: 'node-status',
        severity: 'critical',
      });
    });

    it('should emit warning alert for high pending operations', () => {
      const metrics: NodeMetrics = {
        nodeId: 'node1',
        status: 'healthy',
        pendingOperations: 75,
        term: 1,
        lastHeartbeat: Date.now(),
        leaderStatus: false,
      };

      alertManager.checkNodeMetrics(metrics);

      expect(alerts).toHaveLength(0);
    });
  });

  describe('Alert Resolution', () => {
    it('should resolve alerts when metrics return to normal', () => {
      // First create an alert
      const badMetrics: PerformanceMetrics = {
        operationLatency: 3000,
        errorRate: 0.01,
        queueLength: 50,
        throughput: 90,
        resourceUsage: {
          cpu: 50,
          memory: 60,
          network: 50,
          disk: 40,
        },
      };

      alertManager.checkPerformanceMetrics(badMetrics);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe('critical');

      // Then resolve it
      const goodMetrics: PerformanceMetrics = {
        operationLatency: 100,
        errorRate: 0.01,
        queueLength: 50,
        throughput: 150,
        resourceUsage: {
          cpu: 50,
          memory: 60,
          network: 50,
          disk: 40,
        },
      };

      alerts = [];
      alertManager.checkPerformanceMetrics(goodMetrics);

      expect(alertManager.getActiveAlerts()).toHaveLength(0);
    });
  });
});
