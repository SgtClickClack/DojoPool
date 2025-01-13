import { GameMetricsMonitor, ErrorTracker, AuditLogger, RetryMechanism } from '../monitoring';

describe('GameMetricsMonitor', () => {
  let monitor: GameMetricsMonitor;

  beforeEach(() => {
    monitor = new GameMetricsMonitor();
  });

  afterEach(() => {
    monitor.destroy();
  });

  test('records and retrieves metrics correctly', () => {
    monitor.recordMetric('fps', 60);
    monitor.recordMetric('fps', 55);
    monitor.recordMetric('fps', 58);

    expect(monitor.getMetric('fps')).toBeCloseTo(57.67, 1);
  });

  test('handles non-existent metrics', () => {
    expect(monitor.getMetric('nonexistent')).toBe(0);
  });

  test('clears metrics correctly', () => {
    monitor.recordMetric('fps', 60);
    monitor.clearMetrics();
    expect(monitor.getMetric('fps')).toBe(0);
  });

  test('returns all metrics', () => {
    monitor.recordMetric('fps', 60);
    monitor.recordMetric('latency', 100);

    const metrics = monitor.getMetrics();
    expect(metrics).toHaveProperty('fps');
    expect(metrics).toHaveProperty('latency');
  });
});

describe('ErrorTracker', () => {
  let errorTracker: ErrorTracker;

  beforeEach(() => {
    errorTracker = ErrorTracker.getInstance();
    errorTracker.clearErrors();
  });

  test('tracks errors correctly', () => {
    const error = new Error('Test error');
    const context = {
      component: 'TestComponent',
      severity: 'medium' as const,
      timestamp: Date.now(),
    };

    errorTracker.trackError(error, context);
    const stats = errorTracker.getErrorStats();

    expect(stats.total).toBe(1);
    expect(stats.byComponent.get('TestComponent')).toBe(1);
    expect(stats.recentErrors).toHaveLength(1);
    expect(stats.recentErrors[0].error).toBe(error);
    expect(stats.recentErrors[0].context).toBe(context);
  });

  test('calculates error rates correctly', () => {
    const error = new Error('Test error');
    const context = {
      component: 'TestComponent',
      severity: 'medium' as const,
      timestamp: Date.now(),
    };

    // Add multiple errors
    for (let i = 0; i < 5; i++) {
      errorTracker.trackError(error, context);
    }

    const stats = errorTracker.getErrorStats();
    expect(stats.errorRates['TestComponent']).toBeGreaterThan(0);
  });

  test('clears errors correctly', () => {
    const error = new Error('Test error');
    const context = {
      component: 'TestComponent',
      severity: 'medium' as const,
      timestamp: Date.now(),
    };

    errorTracker.trackError(error, context);
    errorTracker.clearErrors();

    const stats = errorTracker.getErrorStats();
    expect(stats.total).toBe(0);
    expect(stats.byComponent.size).toBe(0);
    expect(stats.recentErrors).toHaveLength(0);
    expect(Object.keys(stats.errorRates)).toHaveLength(0);
  });
});

describe('AuditLogger', () => {
  let auditLogger: AuditLogger;

  beforeEach(() => {
    auditLogger = AuditLogger.getInstance();
    auditLogger.clearLogs();
  });

  test('logs messages correctly', () => {
    auditLogger.log('Test message', 'info');
    const logs = auditLogger.getLogs();

    expect(logs).toHaveLength(1);
    expect(logs[0].message).toBe('Test message');
    expect(logs[0].level).toBe('info');
    expect(logs[0].timestamp).toBeDefined();
  });

  test('maintains log order', () => {
    auditLogger.log('First message', 'info');
    auditLogger.log('Second message', 'warning');
    auditLogger.log('Third message', 'error');

    const logs = auditLogger.getLogs();
    expect(logs).toHaveLength(3);
    expect(logs[0].message).toBe('First message');
    expect(logs[1].message).toBe('Second message');
    expect(logs[2].message).toBe('Third message');
  });

  test('clears logs correctly', () => {
    auditLogger.log('Test message');
    auditLogger.clearLogs();
    expect(auditLogger.getLogs()).toHaveLength(0);
  });
});

describe('RetryMechanism', () => {
  let retryMechanism: RetryMechanism;

  beforeEach(() => {
    retryMechanism = RetryMechanism.getInstance();
  });

  test('retries failed operations', async () => {
    let attempts = 0;
    const operation = jest.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Operation failed');
      }
      return Promise.resolve('success');
    });

    const result = await retryMechanism.retry(operation);
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  test('throws error after max attempts', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Operation failed'));

    await expect(retryMechanism.retry(operation, 3)).rejects.toThrow('Operation failed');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  test('succeeds immediately if operation succeeds', async () => {
    const operation = jest.fn().mockResolvedValue('success');

    const result = await retryMechanism.retry(operation);
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
