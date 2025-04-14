import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme, Theme } from '@mui/material/styles';
import { NetworkMetricsPanel } from '../NetworkMetricsPanel';
import { NetworkMetricsData } from '../../../collectors/NetworkMetricsCollector';
import { MonitoringConfig } from '../../../config';

const theme = createTheme();

const mockMetrics: NetworkMetricsData = {
  messagesSent: 1000,
  messagesReceived: 950,
  bytesTransferred: 5 * 1024 * 1024, // 5MB
  activeConnections: 5,
  errors: 10,
  messageLatency: 150,
  p95Latency: 250,
  messageSuccessRate: 99,
  connectionUptime: 3600000, // 1 hour
  lastHeartbeat: Date.now(),
  reconnectionAttempts: 2,
  pendingMessages: 5,
  bandwidthUsage: 512 * 1024, // 512KB/s
  connectionStability: 95,
  queueSize: 50,
  timestamp: Date.now()
};

const mockConfig: MonitoringConfig = {
  metricsInterval: 10000,
  retentionPeriod: 604800000,
  performanceThresholds: {
    rtt: { warning: 200, critical: 500 },
    errorRate: { warning: 0.05, critical: 0.1 },
    throughput: { warning: 500, critical: 100 },
    stability: { warning: 0.95, critical: 0.9 },
    queueSize: { warning: 10, critical: 20 }
  }
};

const mockHistory: NetworkMetricsData[] = Array.from({ length: 10 }, (_, i) => ({
  ...mockMetrics,
  timestamp: Date.now() - i * 60000, // 1 minute intervals
  messageLatency: 150 + Math.random() * 50,
  p95Latency: 250 + Math.random() * 50,
  bandwidthUsage: (512 + Math.random() * 100) * 1024,
  errors: Math.floor(Math.random() * 5)
}));

describe('NetworkMetricsPanel', () => {
  const renderPanel = () => {
    return render(
      <ThemeProvider theme={theme}>
        <NetworkMetricsPanel
          metrics={mockMetrics}
          config={mockConfig}
          history={mockHistory}
          timeRange={3600000} // 1 hour
        />
      </ThemeProvider>
    );
  };

  it('renders the panel title', () => {
    renderPanel();
    expect(screen.getByText('Network Performance')).toBeInTheDocument();
  });

  describe('Metric Cards', () => {
    it('displays average latency with correct formatting', () => {
      renderPanel();
      const card = screen.getByText('Average Latency').closest('.MuiCard-root');
      expect(within(card!).getByText('150.00 ms')).toBeInTheDocument();
    });

    it('displays P95 latency with correct formatting', () => {
      renderPanel();
      const card = screen.getByText('P95 Latency').closest('.MuiCard-root');
      expect(within(card!).getByText('250.00 ms')).toBeInTheDocument();
    });

    it('displays bandwidth usage with correct formatting', () => {
      renderPanel();
      const card = screen.getByText('Bandwidth Usage').closest('.MuiCard-root');
      expect(within(card!).getByText('512.00 KB/s')).toBeInTheDocument();
    });

    it('displays connection stability with correct formatting', () => {
      renderPanel();
      const card = screen.getByText('Connection Stability').closest('.MuiCard-root');
      expect(within(card!).getByText('95.00%')).toBeInTheDocument();
    });

    it('displays queue size with correct formatting', () => {
      renderPanel();
      const card = screen.getByText('Queue Size').closest('.MuiCard-root');
      expect(within(card!).getByText('50.00 messages')).toBeInTheDocument();
    });

    it('displays error rate with correct formatting', () => {
      renderPanel();
      const card = screen.getByText('Error Rate').closest('.MuiCard-root');
      const errorRate = (mockMetrics.errors / mockMetrics.messagesSent * 100).toFixed(1);
      expect(within(card!).getByText(`${errorRate}%`)).toBeInTheDocument();
    });

    it('applies correct color coding based on thresholds', () => {
      const criticalMetrics: NetworkMetricsData = {
        ...mockMetrics,
        messageLatency: 600,
        errors: 0.15
      };

      render(
        <ThemeProvider theme={theme}>
          <NetworkMetricsPanel
            metrics={criticalMetrics}
            config={mockConfig}
            history={mockHistory}
            timeRange={3600000}
          />
        </ThemeProvider>
      );

      const latencyValue = screen.getByText('600.00 ms').parentElement;
      const errorValue = screen.getByText('15.0 %').parentElement;

      expect(latencyValue).toHaveStyle({ color: theme.palette.error.main });
      expect(errorValue).toHaveStyle({ color: theme.palette.error.main });
    });

    it('applies warning styles when metrics exceed warning thresholds', () => {
      const warningMetrics: NetworkMetricsData = {
        ...mockMetrics,
        messageLatency: 250,
        errors: 0.07
      };

      render(
        <ThemeProvider theme={theme}>
          <NetworkMetricsPanel
            metrics={warningMetrics}
            config={mockConfig}
            history={mockHistory}
            timeRange={3600000}
          />
        </ThemeProvider>
      );

      const latencyValue = screen.getByText('250.00 ms').parentElement;
      const errorValue = screen.getByText('7.0 %').parentElement;

      expect(latencyValue).toHaveStyle({ color: theme.palette.warning.main });
      expect(errorValue).toHaveStyle({ color: theme.palette.warning.main });
    });
  });

  describe('Charts', () => {
    it('renders latency chart with both average and P95 series', () => {
      renderPanel();
      const chart = screen.getByText('Latency Over Time').closest('.MuiCard-root');
      expect(within(chart!).getByText('Average')).toBeInTheDocument();
      expect(within(chart!).getByText('95th Percentile')).toBeInTheDocument();
    });

    it('renders bandwidth usage chart', () => {
      renderPanel();
      const chart = screen.getByText('Bandwidth Usage').closest('.MuiCard-root');
      expect(within(chart!).getByText('Usage')).toBeInTheDocument();
    });

    it('renders error rate chart', () => {
      renderPanel();
      const chart = screen.getByText('Error Rate').closest('.MuiCard-root');
      expect(within(chart!).getByText('Rate')).toBeInTheDocument();
    });
  });

  describe('Threshold Indicators', () => {
    it('shows warning state for metrics near threshold', () => {
      const warningMetrics = {
        ...mockMetrics,
        messageLatency: 180, // Near warning threshold of 200
        queueSize: 90 // Near warning threshold of 100
      };
      render(
        <ThemeProvider theme={theme}>
          <NetworkMetricsPanel
            metrics={warningMetrics}
            config={mockConfig}
            history={mockHistory}
            timeRange={3600000}
          />
        </ThemeProvider>
      );
      
      // Check for warning indicators (yellow color)
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.some(bar => bar.className.includes('MuiLinearProgress-colorWarning'))).toBe(true);
    });

    it('shows critical state for metrics above threshold', () => {
      const criticalMetrics = {
        ...mockMetrics,
        messageLatency: 550, // Above critical threshold of 500
        queueSize: 600 // Above critical threshold of 500
      };
      render(
        <ThemeProvider theme={theme}>
          <NetworkMetricsPanel
            metrics={criticalMetrics}
            config={mockConfig}
            history={mockHistory}
            timeRange={3600000}
          />
        </ThemeProvider>
      );
      
      // Check for critical indicators (red color)
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.some(bar => bar.className.includes('MuiLinearProgress-colorError'))).toBe(true);
    });
  });
}); 