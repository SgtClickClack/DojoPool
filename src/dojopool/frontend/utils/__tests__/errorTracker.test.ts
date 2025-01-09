import { ErrorTracker } from '../monitoring';
import { AuditLogger } from '../monitoring';

// Mock monitoring utilities
jest.mock('../monitoring', () => ({
  AuditLogger: {
    getInstance: jest.fn().mockReturnThis(),
    log: jest.fn(),
  },
}));

describe('ErrorTracker', () => {
  let errorTracker: ErrorTracker;
  const mockAuditLogger = {
    getInstance: jest.fn().mockReturnThis(),
    log: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AuditLogger as jest.Mocked<typeof AuditLogger>).getInstance.mockReturnValue(mockAuditLogger);
    errorTracker = new ErrorTracker();
  });

  describe('Error Tracking', () => {
    test('should track new errors', () => {
      const error = new Error('Test error');
      const context = {
        component: 'TestComponent',
        severity: 'high',
        timestamp: Date.now(),
      };

      errorTracker.trackError(error, context);

      const stats = errorTracker.getErrorStats();
      expect(stats.total).toBe(1);
      expect(stats.byComponent.get('TestComponent')).toBe(1);
      expect(stats.recentErrors).toHaveLength(1);
      expect(stats.recentErrors[0]).toEqual({
        error,
        context,
      });
    });

    test('should group similar errors', () => {
      const error1 = new Error('Test error');
      const error2 = new Error('Test error');
      const context = {
        component: 'TestComponent',
        severity: 'high',
        timestamp: Date.now(),
      };

      errorTracker.trackError(error1, context);
      errorTracker.trackError(error2, context);

      const stats = errorTracker.getErrorStats();
      expect(stats.total).toBe(2);
      expect(stats.byComponent.get('TestComponent')).toBe(2);
      expect(stats.recentErrors).toHaveLength(2);
    });

    test('should track error rates', () => {
      const error = new Error('Test error');
      const context = {
        component: 'TestComponent',
        severity: 'high',
        timestamp: Date.now(),
      };

      // Track multiple errors
      for (let i = 0; i < 5; i++) {
        errorTracker.trackError(error, context);
      }

      const stats = errorTracker.getErrorStats();
      expect(stats.errorRates.TestComponent).toBeGreaterThan(0);
    });
  });

  describe('Error Analysis', () => {
    test('should analyze error trends', () => {
      const error1 = new Error('Type A error');
      const error2 = new Error('Type B error');

      // Track different types of errors
      errorTracker.trackError(error1, {
        component: 'ComponentA',
        severity: 'high',
        timestamp: Date.now() - 3600000, // 1 hour ago
      });

      errorTracker.trackError(error2, {
        component: 'ComponentB',
        severity: 'medium',
        timestamp: Date.now(),
      });

      const trends = errorTracker.analyzeErrorTrends();
      expect(trends.topComponents).toContainEqual({
        component: 'ComponentA',
        count: 1,
      });
      expect(trends.errorRates).toBeDefined();
      expect(trends.timeDistribution).toBeDefined();
    });

    test('should identify error patterns', () => {
      const error = new Error('Pattern error');

      // Create pattern of errors
      for (let i = 0; i < 3; i++) {
        errorTracker.trackError(error, {
          component: 'TestComponent',
          severity: 'high',
          timestamp: Date.now() - i * 1000,
        });
      }

      const patterns = errorTracker.identifyErrorPatterns();
      expect(patterns).toContainEqual(
        expect.objectContaining({
          pattern: 'Recurring error in TestComponent',
          frequency: 3,
        })
      );
    });
  });

  describe('Error Recovery', () => {
    test('should track recovery attempts', () => {
      const error = new Error('Recovery test error');
      const context = {
        component: 'TestComponent',
        severity: 'high',
        timestamp: Date.now(),
        recoveryAttempts: 0,
      };

      errorTracker.trackError(error, context);
      errorTracker.trackRecoveryAttempt(error, true);

      const stats = errorTracker.getErrorStats();
      const recoveryStats = errorTracker.getRecoveryStats();

      expect(recoveryStats.totalAttempts).toBe(1);
      expect(recoveryStats.successfulRecoveries).toBe(1);
    });

    test('should handle failed recovery attempts', () => {
      const error = new Error('Failed recovery error');
      const context = {
        component: 'TestComponent',
        severity: 'high',
        timestamp: Date.now(),
        recoveryAttempts: 0,
      };

      errorTracker.trackError(error, context);
      errorTracker.trackRecoveryAttempt(error, false);

      const recoveryStats = errorTracker.getRecoveryStats();
      expect(recoveryStats.failedRecoveries).toBe(1);
    });
  });

  describe('Error Notifications', () => {
    test('should notify on critical errors', () => {
      const criticalError = new Error('Critical system error');
      const context = {
        component: 'SystemComponent',
        severity: 'critical',
        timestamp: Date.now(),
      };

      const notifyMock = jest.fn();
      errorTracker.onCriticalError(notifyMock);

      errorTracker.trackError(criticalError, context);

      expect(notifyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: criticalError,
          context,
        })
      );
    });

    test('should handle error thresholds', () => {
      const error = new Error('Threshold test error');
      const context = {
        component: 'TestComponent',
        severity: 'high',
        timestamp: Date.now(),
      };

      const thresholdMock = jest.fn();
      errorTracker.onErrorThresholdExceeded(thresholdMock);

      // Generate errors to exceed threshold
      for (let i = 0; i < 10; i++) {
        errorTracker.trackError(error, context);
      }

      expect(thresholdMock).toHaveBeenCalledWith(
        expect.objectContaining({
          component: 'TestComponent',
          errorCount: 10,
        })
      );
    });
  });

  describe('Integration with AuditLogger', () => {
    test('should log tracked errors', () => {
      const error = new Error('Audit test error');
      const context = {
        component: 'TestComponent',
        severity: 'high',
        timestamp: Date.now(),
      };

      errorTracker.trackError(error, context);

      expect(mockAuditLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('Audit test error'),
        'error'
      );
    });

    test('should log recovery attempts', () => {
      const error = new Error('Recovery audit test');
      const context = {
        component: 'TestComponent',
        severity: 'high',
        timestamp: Date.now(),
      };

      errorTracker.trackError(error, context);
      errorTracker.trackRecoveryAttempt(error, true);

      expect(mockAuditLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('Recovery successful'),
        'info'
      );
    });
  });

  describe('Error Stats Management', () => {
    test('should clear error stats', () => {
      const error = new Error('Clear stats test');
      const context = {
        component: 'TestComponent',
        severity: 'high',
        timestamp: Date.now(),
      };

      errorTracker.trackError(error, context);
      errorTracker.clearErrorStats();

      const stats = errorTracker.getErrorStats();
      expect(stats.total).toBe(0);
      expect(stats.byComponent.size).toBe(0);
      expect(stats.recentErrors).toHaveLength(0);
    });

    test('should maintain error history limit', () => {
      const error = new Error('History limit test');
      const context = {
        component: 'TestComponent',
        severity: 'high',
        timestamp: Date.now(),
      };

      // Add more errors than the history limit
      for (let i = 0; i < 1000; i++) {
        errorTracker.trackError(error, context);
      }

      const stats = errorTracker.getErrorStats();
      expect(stats.recentErrors.length).toBeLessThanOrEqual(100); // Assuming 100 is the limit
    });
  });
});
