import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import MonitoringDashboard from '../Dashboard';
import { ErrorTracker } from '../../../utils/monitoring';

// Mock ErrorTracker
jest.mock('../../../utils/monitoring', () => ({
  ErrorTracker: {
    getInstance: jest.fn(() => ({
      getErrorStats: jest.fn(() => ({
        total: 5,
        byComponent: new Map([
          ['ComponentA', 2],
          ['ComponentB', 3],
        ]),
        recentErrors: [
          {
            error: new Error('Test error 1'),
            context: {
              component: 'ComponentA',
              severity: 'medium',
              timestamp: Date.now() - 1000,
            },
          },
          {
            error: new Error('Test error 2'),
            context: {
              component: 'ComponentB',
              severity: 'high',
              timestamp: Date.now() - 2000,
            },
          },
        ],
        errorRates: {
          ComponentA: 120,
          ComponentB: 180,
        },
      })),
    })),
  },
}));

describe('MonitoringDashboard', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('renders error overview section', () => {
    render(<MonitoringDashboard />);

    expect(screen.getByText('Error Overview')).toBeInTheDocument();
    expect(screen.getByText('Total Errors')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Components Affected')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('renders error trends chart', () => {
    render(<MonitoringDashboard />);

    expect(screen.getByText('Error Trends')).toBeInTheDocument();
    // Check for chart elements
    expect(document.querySelector('.recharts-surface')).toBeInTheDocument();
  });

  test('renders component filter buttons', () => {
    render(<MonitoringDashboard />);

    expect(screen.getByText('Filter by Component')).toBeInTheDocument();
    expect(screen.getByText('ComponentA')).toBeInTheDocument();
    expect(screen.getByText('ComponentB')).toBeInTheDocument();
  });

  test('renders recent errors list', () => {
    render(<MonitoringDashboard />);

    expect(screen.getByText('Recent Errors')).toBeInTheDocument();
    expect(screen.getByText('Test error 1')).toBeInTheDocument();
    expect(screen.getByText('Test error 2')).toBeInTheDocument();
  });

  test('filters errors by component when clicking filter button', () => {
    render(<MonitoringDashboard />);

    const componentAButton = screen.getByText('ComponentA');
    fireEvent.click(componentAButton);

    expect(screen.getByText('Test error 1')).toBeInTheDocument();
    expect(screen.queryByText('Test error 2')).not.toBeInTheDocument();
  });

  test('updates data periodically', async () => {
    const { rerender } = render(<MonitoringDashboard refreshInterval={1000} />);

    // Fast-forward time
    jest.advanceTimersByTime(1000);

    // Force a re-render
    rerender(<MonitoringDashboard refreshInterval={1000} />);

    await waitFor(() => {
      expect(ErrorTracker.getInstance().getErrorStats).toHaveBeenCalledTimes(2);
    });
  });

  test('displays error rates correctly', () => {
    render(<MonitoringDashboard />);

    expect(screen.getByText('120.00 errors/hour')).toBeInTheDocument();
  });

  test('handles component selection and deselection', () => {
    render(<MonitoringDashboard />);

    const componentAButton = screen.getByText('ComponentA');

    // Select ComponentA
    fireEvent.click(componentAButton);
    expect(componentAButton).toHaveClass('selected');
    expect(screen.getByText('Test error 1')).toBeInTheDocument();
    expect(screen.queryByText('Test error 2')).not.toBeInTheDocument();

    // Deselect ComponentA
    fireEvent.click(componentAButton);
    expect(componentAButton).not.toHaveClass('selected');
    expect(screen.getByText('Test error 1')).toBeInTheDocument();
    expect(screen.getByText('Test error 2')).toBeInTheDocument();
  });

  test('formats timestamps correctly', () => {
    render(<MonitoringDashboard />);

    const timestamps = screen.getAllByText(
      (content, element) => element?.className === 'error-timestamp'
    );

    expect(timestamps.length).toBeGreaterThan(0);
    timestamps.forEach((timestamp) => {
      expect(timestamp.textContent).toMatch(/\d{1,2}\/\d{1,2}\/\d{4},?\s\d{1,2}:\d{2}:\d{2}/);
    });
  });

  test('displays error severity indicators', () => {
    render(<MonitoringDashboard />);

    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  test('cleans up interval on unmount', () => {
    const { unmount } = render(<MonitoringDashboard refreshInterval={1000} />);

    const clearIntervalSpy = jest.spyOn(window, 'clearInterval');
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
