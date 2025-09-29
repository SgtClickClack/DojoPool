import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@/components/__tests__/test-utils';
import PerformanceDashboard from '../PerformanceDashboard';
import { performance_monitor } from '@/services/performanceMonitor';
import { metrics_monitor, AlertSeverity } from '@/services/metricsMonitor';

vi.mock('@/services/performanceMonitor');
vi.mock('@/services/metricsMonitor');

const mockMetrics = {
  memoryUsage: 42,
  memoryAvailable: 6,
  cpuUsage: 55,
  processCount: 120,
  threadCount: 600,
  networkSent: 256,
  networkReceived: 512,
  timestamp: new Date(),
};

const mockAlerts = [
  {
    id: 'alert-1',
    severity: AlertSeverity.ERROR,
    message: 'Critical failure',
    timestamp: new Date(),
    acknowledged: false,
    data: { componentName: 'ComponentA' },
  },
];

const mockedPerformanceMonitor = vi.mocked(performance_monitor);
const mockedMetricsMonitor = vi.mocked(metrics_monitor);

describe('PerformanceDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedPerformanceMonitor.getCurrentMetrics.mockReturnValue(mockMetrics);
    mockedMetricsMonitor.getAlerts.mockReturnValue(mockAlerts as any);
  });

  it('renders primary dashboard sections', () => {
    render(<PerformanceDashboard />);

    expect(screen.getByRole('heading', { name: /Performance Dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/Memory Usage/i)).toBeInTheDocument();
    expect(screen.getByText(/CPU Usage/i)).toBeInTheDocument();
    expect(screen.getByText(/Recent Alerts/i)).toBeInTheDocument();
  });

  it('refreshes metrics when refresh button is clicked', () => {
    render(<PerformanceDashboard />);

    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));

    expect(mockedPerformanceMonitor.getCurrentMetrics).toHaveBeenCalled();
    expect(mockedPerformanceMonitor.getCurrentMetrics.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(mockedMetricsMonitor.getAlerts).toHaveBeenCalled();
    expect(mockedMetricsMonitor.getAlerts.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('acknowledges alerts through metrics monitor', () => {
    mockedMetricsMonitor.acknowledgeAlert.mockImplementation(() => undefined);

    render(<PerformanceDashboard />);

    fireEvent.click(screen.getByRole('button', { name: /Acknowledge Alert/i }));

    expect(mockedMetricsMonitor.acknowledgeAlert).toHaveBeenCalledWith('alert-1', 'current-user');
  });
});
