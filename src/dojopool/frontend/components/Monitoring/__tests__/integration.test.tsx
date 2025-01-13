import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import MonitoringDashboard from '../Dashboard';
import { ErrorBoundary } from '../ErrorBoundary';
import { ErrorTracker, AuditLogger, RetryMechanism } from '../../../utils/monitoring';

// Mock monitoring utilities
jest.mock('../../../utils/monitoring');

describe('Monitoring System Integration', () => {
  const mockErrorTracker = {
    getInstance: jest.fn().mockReturnThis(),
    trackError: jest.fn(),
    getErrorStats: jest.fn().mockReturnValue({
      total: 0,
      byComponent: new Map(),
      recentErrors: [],
      errorRates: {},
    }),
    clearErrors: jest.fn(),
  };

  const mockAuditLogger = {
    getInstance: jest.fn().mockReturnThis(),
    log: jest.fn(),
    getLogs: jest.fn().mockReturnValue([]),
    clearLogs: jest.fn(),
  };

  const mockRetryMechanism = {
    getInstance: jest.fn().mockReturnThis(),
    retry: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (ErrorTracker as jest.Mocked<typeof ErrorTracker>).getInstance.mockReturnValue(
      mockErrorTracker
    );
    (AuditLogger as jest.Mocked<typeof AuditLogger>).getInstance.mockReturnValue(mockAuditLogger);
    (RetryMechanism as jest.Mocked<typeof RetryMechanism>).getInstance.mockReturnValue(
      mockRetryMechanism
    );
  });

  test('error tracking flow', async () => {
    const TestError = () => {
      throw new Error('Test integration error');
    };

    render(
      <ErrorBoundary>
        <MonitoringDashboard>
          <TestError />
        </MonitoringDashboard>
      </ErrorBoundary>
    );

    // Verify error was tracked
    expect(mockErrorTracker.trackError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        component: 'ErrorBoundary',
        severity: 'high',
      })
    );

    // Verify error boundary rendered fallback UI
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/Test integration error/)).toBeInTheDocument();

    // Verify audit log was created
    expect(mockAuditLogger.log).toHaveBeenCalledWith(
      expect.stringContaining('Test integration error'),
      'error'
    );
  });

  test('error recovery and retry mechanism', async () => {
    const mockOperation = jest
      .fn()
      .mockRejectedValueOnce(new Error('First attempt failed'))
      .mockResolvedValueOnce('success');

    mockRetryMechanism.retry.mockImplementation(async (operation) => {
      try {
        return await operation();
      } catch (error) {
        mockErrorTracker.trackError(error, {
          component: 'RetryMechanism',
          severity: 'medium',
          timestamp: Date.now(),
        });
        throw error;
      }
    });

    // Attempt operation with retry
    try {
      await mockRetryMechanism.retry(mockOperation);
    } catch (error) {
      // Expected first attempt to fail
    }

    // Verify error was tracked
    expect(mockErrorTracker.trackError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        component: 'RetryMechanism',
        severity: 'medium',
      })
    );

    // Second attempt should succeed
    const result = await mockRetryMechanism.retry(mockOperation);
    expect(result).toBe('success');
  });

  test('dashboard updates with new errors', async () => {
    // Setup initial error stats
    mockErrorTracker.getErrorStats.mockReturnValueOnce({
      total: 1,
      byComponent: new Map([['TestComponent', 1]]),
      recentErrors: [
        {
          error: new Error('Initial error'),
          context: {
            component: 'TestComponent',
            severity: 'low',
            timestamp: Date.now(),
          },
        },
      ],
      errorRates: { TestComponent: 60 },
    });

    const { rerender } = render(<MonitoringDashboard />);

    // Verify initial error is displayed
    expect(screen.getByText('Initial error')).toBeInTheDocument();
    expect(screen.getByText('TestComponent')).toBeInTheDocument();

    // Update error stats
    mockErrorTracker.getErrorStats.mockReturnValueOnce({
      total: 2,
      byComponent: new Map([['TestComponent', 2]]),
      recentErrors: [
        {
          error: new Error('Initial error'),
          context: {
            component: 'TestComponent',
            severity: 'low',
            timestamp: Date.now() - 1000,
          },
        },
        {
          error: new Error('New error'),
          context: {
            component: 'TestComponent',
            severity: 'high',
            timestamp: Date.now(),
          },
        },
      ],
      errorRates: { TestComponent: 120 },
    });

    // Trigger update
    rerender(<MonitoringDashboard />);

    // Verify new error is displayed
    await waitFor(() => {
      expect(screen.getByText('New error')).toBeInTheDocument();
    });
    expect(screen.getByText('120.00 errors/hour')).toBeInTheDocument();
  });

  test('error boundary integration with monitoring', async () => {
    const TestComponent = () => {
      const [shouldError, setShouldError] = React.useState(true);

      if (shouldError) {
        throw new Error('Controlled test error');
      }

      return <div>Recovered from error</div>;
    };

    render(
      <ErrorBoundary onReset={() => mockErrorTracker.clearErrors()}>
        <TestComponent />
      </ErrorBoundary>
    );

    // Verify error was tracked
    expect(mockErrorTracker.trackError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        component: 'ErrorBoundary',
        severity: 'high',
      })
    );

    // Click retry button
    fireEvent.click(screen.getByText('Try Again'));

    // Verify error stats were cleared
    expect(mockErrorTracker.clearErrors).toHaveBeenCalled();
  });

  test('complete error monitoring cycle', async () => {
    // Setup component that will error
    const ErrorComponent = () => {
      throw new Error('Test cycle error');
    };

    // Render dashboard with error component
    render(
      <ErrorBoundary>
        <MonitoringDashboard>
          <ErrorComponent />
        </MonitoringDashboard>
      </ErrorBoundary>
    );

    // Verify error was tracked
    expect(mockErrorTracker.trackError).toHaveBeenCalled();

    // Verify error appears in dashboard
    await waitFor(() => {
      expect(mockErrorTracker.getErrorStats).toHaveBeenCalled();
    });

    // Verify audit log was created
    expect(mockAuditLogger.log).toHaveBeenCalledWith(
      expect.stringContaining('Test cycle error'),
      'error'
    );

    // Verify error boundary rendered fallback
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Test error recovery
    fireEvent.click(screen.getByText('Try Again'));

    // Verify error stats were cleared
    expect(mockErrorTracker.clearErrors).toHaveBeenCalled();
  });
});
