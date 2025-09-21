import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { render as customRender, mockUser, createMockProps, measureRenderTime } from '../../__tests__/test-utils';
import PerformanceDashboard from '../Dashboard/PerformanceDashboard';

// Mock MUI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Card: ({ children, ...props }: any) => (
      <div data-testid="performance-dashboard-card" {...props}>
        {children}
      </div>
    ),
    CardContent: ({ children, ...props }: any) => (
      <div data-testid="performance-dashboard-content" {...props}>
        {children}
      </div>
    ),
    Typography: ({ children, variant, ...props }: any) => (
      <div data-testid={`typography-${variant}`} {...props}>
        {children}
      </div>
    ),
    Button: ({ children, onClick, ...props }: any) => (
      <button data-testid="performance-dashboard-button" onClick={onClick} {...props}>
        {children}
      </button>
    ),
    Chip: ({ label, color, ...props }: any) => (
      <span data-testid={`chip-${color}`} {...props}>
        {label}
      </span>
    ),
    Box: ({ children, ...props }: any) => (
      <div data-testid="performance-dashboard-box" {...props}>
        {children}
      </div>
    ),
    Grid: ({ children, ...props }: any) => (
      <div data-testid="performance-dashboard-grid" {...props}>
        {children}
      </div>
    ),
    LinearProgress: ({ value, ...props }: any) => (
      <div data-testid="performance-dashboard-progress" data-value={value} {...props}>
        Progress: {value}%
      </div>
    ),
  };
});

// Mock icons
vi.mock('@mui/icons-material', () => ({
  Speed: () => <div data-testid="speed-icon">⚡</div>,
  Memory: () => <div data-testid="memory-icon">💾</div>,
  NetworkCheck: () => <div data-testid="network-icon">🌐</div>,
  Warning: () => <div data-testid="warning-icon">⚠️</div>,
  CheckCircle: () => <div data-testid="check-icon">✅</div>,
  Error: () => <div data-testid="error-icon">❌</div>,
}));

describe('PerformanceDashboard Component', () => {
  const mockPerformanceData = {
    cpu: {
      usage: 45,
      cores: 8,
      temperature: 65,
    },
    memory: {
      used: 6.2,
      total: 16,
      percentage: 38.75,
    },
    network: {
      download: 125.5,
      upload: 45.2,
      latency: 12,
    },
    alerts: [
      {
        id: '1',
        type: 'WARNING',
        message: 'High CPU usage detected',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        type: 'INFO',
        message: 'Memory usage is normal',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
  };

  const defaultProps = createMockProps({
    performanceData: mockPerformanceData,
    onRefresh: vi.fn(),
    onAlertClick: vi.fn(),
    onExport: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders performance metrics correctly', () => {
    customRender(<PerformanceDashboard {...defaultProps} />);
    
    expect(screen.getByText('45%')).toBeInTheDocument(); // CPU usage
    expect(screen.getByText('6.2 GB')).toBeInTheDocument(); // Memory used
    expect(screen.getByText('125.5 Mbps')).toBeInTheDocument(); // Network download
  });

  it('displays CPU information', () => {
    customRender(<PerformanceDashboard {...defaultProps} />);
    
    expect(screen.getByText('CPU Usage')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('8 Cores')).toBeInTheDocument();
    expect(screen.getByText('65°C')).toBeInTheDocument();
  });

  it('displays memory information', () => {
    customRender(<PerformanceDashboard {...defaultProps} />);
    
    expect(screen.getByText('Memory Usage')).toBeInTheDocument();
    expect(screen.getByText('6.2 GB / 16 GB')).toBeInTheDocument();
    expect(screen.getByText('38.75%')).toBeInTheDocument();
  });

  it('displays network information', () => {
    customRender(<PerformanceDashboard {...defaultProps} />);
    
    expect(screen.getByText('Network Performance')).toBeInTheDocument();
    expect(screen.getByText('125.5 Mbps')).toBeInTheDocument(); // Download
    expect(screen.getByText('45.2 Mbps')).toBeInTheDocument(); // Upload
    expect(screen.getByText('12 ms')).toBeInTheDocument(); // Latency
  });

  it('renders all required icons', () => {
    customRender(<PerformanceDashboard {...defaultProps} />);
    
    expect(screen.getByTestId('speed-icon')).toBeInTheDocument();
    expect(screen.getByTestId('memory-icon')).toBeInTheDocument();
    expect(screen.getByTestId('network-icon')).toBeInTheDocument();
  });

  it('displays performance alerts', () => {
    customRender(<PerformanceDashboard {...defaultProps} />);
    
    expect(screen.getByText('High CPU usage detected')).toBeInTheDocument();
    expect(screen.getByText('Memory usage is normal')).toBeInTheDocument();
  });

  it('calls onRefresh when refresh button is clicked', () => {
    customRender(<PerformanceDashboard {...defaultProps} />);
    
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    expect(defaultProps.onRefresh).toHaveBeenCalled();
  });

  it('calls onAlertClick when alert is clicked', () => {
    customRender(<PerformanceDashboard {...defaultProps} />);
    
    const alert = screen.getByText('High CPU usage detected');
    fireEvent.click(alert);
    
    expect(defaultProps.onAlertClick).toHaveBeenCalledWith(mockPerformanceData.alerts[0]);
  });

  it('calls onExport when export button is clicked', () => {
    customRender(<PerformanceDashboard {...defaultProps} />);
    
    const exportButton = screen.getByText('Export Data');
    fireEvent.click(exportButton);
    
    expect(defaultProps.onExport).toHaveBeenCalled();
  });

  it('displays progress bars for metrics', () => {
    customRender(<PerformanceDashboard {...defaultProps} />);
    
    const progressBars = screen.getAllByTestId('performance-dashboard-progress');
    expect(progressBars).toHaveLength(3); // CPU, Memory, Network
  });

  it('handles empty performance data', () => {
    const emptyProps = {
      ...defaultProps,
      performanceData: {
        cpu: { usage: 0, cores: 0, temperature: 0 },
        memory: { used: 0, total: 0, percentage: 0 },
        network: { download: 0, upload: 0, latency: 0 },
        alerts: [],
      },
    };
    
    customRender(<PerformanceDashboard {...emptyProps} />);
    
    expect(screen.getByText('0%')).toBeInTheDocument(); // CPU usage
    expect(screen.getByText('0 GB / 0 GB')).toBeInTheDocument(); // Memory
    expect(screen.getByText('0 Mbps')).toBeInTheDocument(); // Network
  });

  it('displays loading state', () => {
    const loadingProps = {
      ...defaultProps,
      loading: true,
    };
    
    customRender(<PerformanceDashboard {...loadingProps} />);
    
    expect(screen.getByText('Loading performance data...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    const errorProps = {
      ...defaultProps,
      error: 'Failed to load performance data',
    };
    
    customRender(<PerformanceDashboard {...errorProps} />);
    
    expect(screen.getByText('Failed to load performance data')).toBeInTheDocument();
  });

  it('renders without crashing with minimal props', () => {
    const minimalProps = {
      performanceData: mockPerformanceData,
      onRefresh: vi.fn(),
    };
    
    expect(() => customRender(<PerformanceDashboard {...minimalProps} />)).not.toThrow();
  });

  it('has proper accessibility attributes', () => {
    customRender(<PerformanceDashboard {...defaultProps} />);
    
    const grid = screen.getByTestId('performance-dashboard-grid');
    expect(grid).toBeInTheDocument();
    
    // Check for proper heading structure
    const heading = screen.getByTestId('typography-h5');
    expect(heading).toBeInTheDocument();
  });

  it('handles disabled state correctly', () => {
    const disabledProps = {
      ...defaultProps,
      disabled: true,
    };
    
    customRender(<PerformanceDashboard {...disabledProps} />);
    
    const refreshButton = screen.getByText('Refresh');
    expect(refreshButton).toBeDisabled();
  });

  it('renders within acceptable performance threshold', async () => {
    const renderTime = await measureRenderTime(() => {
      customRender(<PerformanceDashboard {...defaultProps} />);
    });
    
    // Should render in less than 100ms
    expect(renderTime).toBeLessThan(100);
  });

  it('handles real-time performance updates', () => {
    const { rerender } = customRender(<PerformanceDashboard {...defaultProps} />);
    
    const updatedPerformanceData = {
      ...mockPerformanceData,
      cpu: {
        ...mockPerformanceData.cpu,
        usage: 60, // Updated CPU usage
      },
      memory: {
        ...mockPerformanceData.memory,
        used: 8.5, // Updated memory usage
      },
    };
    
    rerender(<PerformanceDashboard {...defaultProps} performanceData={updatedPerformanceData} />);
    
    // Check if updated values are displayed
    expect(screen.getByText('60%')).toBeInTheDocument(); // Updated CPU usage
    expect(screen.getByText('8.5 GB')).toBeInTheDocument(); // Updated memory usage
  });

  it('displays alert types correctly', () => {
    customRender(<PerformanceDashboard {...defaultProps} />);
    
    // Check if alert types are displayed with correct colors
    expect(screen.getByTestId('chip-warning')).toBeInTheDocument(); // WARNING alert
    expect(screen.getByTestId('chip-info')).toBeInTheDocument(); // INFO alert
  });

  it('handles performance thresholds', () => {
    const highUsageData = {
      ...mockPerformanceData,
      cpu: {
        ...mockPerformanceData.cpu,
        usage: 95, // High CPU usage
      },
      memory: {
        ...mockPerformanceData.memory,
        percentage: 90, // High memory usage
      },
    };
    
    customRender(<PerformanceDashboard {...defaultProps} performanceData={highUsageData} />);
    
    // Check if high usage is displayed
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('displays performance trends', () => {
    customRender(<PerformanceDashboard {...defaultProps} />);
    
    // Check if trend indicators are displayed
    expect(screen.getByTestId('performance-dashboard-progress')).toBeInTheDocument();
  });

  it('handles performance alerts with different severities', () => {
    const alertsWithDifferentSeverities = [
      {
        id: '1',
        type: 'CRITICAL',
        message: 'Critical system failure',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        type: 'WARNING',
        message: 'High resource usage',
        timestamp: new Date().toISOString(),
      },
      {
        id: '3',
        type: 'INFO',
        message: 'System running normally',
        timestamp: new Date().toISOString(),
      },
    ];
    
    const propsWithDifferentAlerts = {
      ...defaultProps,
      performanceData: {
        ...mockPerformanceData,
        alerts: alertsWithDifferentSeverities,
      },
    };
    
    customRender(<PerformanceDashboard {...propsWithDifferentAlerts} />);
    
    expect(screen.getByText('Critical system failure')).toBeInTheDocument();
    expect(screen.getByText('High resource usage')).toBeInTheDocument();
    expect(screen.getByText('System running normally')).toBeInTheDocument();
  });

  it('displays performance metrics with proper formatting', () => {
    customRender(<PerformanceDashboard {...defaultProps} />);
    
    // Check if metrics are formatted correctly
    expect(screen.getByText('45%')).toBeInTheDocument(); // CPU percentage
    expect(screen.getByText('6.2 GB')).toBeInTheDocument(); // Memory with GB
    expect(screen.getByText('125.5 Mbps')).toBeInTheDocument(); // Network with Mbps
    expect(screen.getByText('12 ms')).toBeInTheDocument(); // Latency with ms
  });

  it('handles performance data with missing fields', () => {
    const incompleteData = {
      cpu: { usage: 45, cores: 8, temperature: 65 },
      memory: { used: 6.2, total: 16, percentage: 38.75 },
      network: { download: 125.5, upload: 45.2, latency: 12 },
      alerts: [],
    };
    
    customRender(<PerformanceDashboard {...defaultProps} performanceData={incompleteData} />);
    
    // Should still render without crashing
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('6.2 GB')).toBeInTheDocument();
  });

  it('displays performance dashboard title', () => {
    customRender(<PerformanceDashboard {...defaultProps} />);
    
    expect(screen.getByText('Performance Dashboard')).toBeInTheDocument();
  });

  it('handles performance data updates in real-time', () => {
    const { rerender } = customRender(<PerformanceDashboard {...defaultProps} />);
    
    const updatedData = {
      ...mockPerformanceData,
      cpu: { ...mockPerformanceData.cpu, usage: 50 },
      memory: { ...mockPerformanceData.memory, used: 7.0 },
      network: { ...mockPerformanceData.network, download: 130.0 },
    };
    
    rerender(<PerformanceDashboard {...defaultProps} performanceData={updatedData} />);
    
    // Check if updated values are displayed
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('7.0 GB')).toBeInTheDocument();
    expect(screen.getByText('130.0 Mbps')).toBeInTheDocument();
  });
});
