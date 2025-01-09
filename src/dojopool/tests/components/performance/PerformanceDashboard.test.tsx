import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PerformanceDashboard } from '../../../components/performance/PerformanceDashboard';
import { usePerformanceMonitor } from '../../../hooks/usePerformanceMonitor';

jest.mock('../../../hooks/usePerformanceMonitor');
const mockedUsePerformanceMonitor = usePerformanceMonitor as jest.Mock;

describe('PerformanceDashboard', () => {
    const mockSystemStatus = {
        cpu_usage: 45.5,
        memory_usage: 60.2,
        disk_usage: 75.8,
        network_io: {
            bytes_sent: 1024,
            bytes_recv: 2048,
            packets_sent: 100,
            packets_recv: 200
        },
        process_metrics: {
            cpu_percent: 25.5,
            memory_percent: 30.2,
            threads: 8,
            open_files: 12,
            connections: 5
        }
    };

    const mockMetricsHistory = [
        {
            timestamp: '2024-01-01T00:00:00Z',
            cpu_usage: 45.5,
            memory_usage: 60.2,
            disk_usage: 75.8,
            network_io_rate: 1024
        }
    ];

    const mockRecommendations = [
        {
            id: '1',
            type: 'cpu',
            priority: 'high',
            title: 'Optimize CPU Usage',
            description: 'High CPU usage detected',
            impact: 'Improved response time',
            status: 'pending'
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render loading state', () => {
        mockedUsePerformanceMonitor.mockReturnValue({
            loading: true,
            error: null,
            systemStatus: null,
            metricsHistory: [],
            recommendations: [],
            fetchMetrics: jest.fn()
        });

        render(<PerformanceDashboard />);
        expect(screen.getByText('Loading performance metrics...')).toBeInTheDocument();
    });

    it('should render error state', () => {
        const errorMessage = 'Failed to load metrics';
        mockedUsePerformanceMonitor.mockReturnValue({
            loading: false,
            error: errorMessage,
            systemStatus: null,
            metricsHistory: [],
            recommendations: [],
            fetchMetrics: jest.fn()
        });

        render(<PerformanceDashboard />);
        expect(screen.getByText(`Error loading performance metrics: ${errorMessage}`)).toBeInTheDocument();
    });

    it('should render dashboard with data', () => {
        const fetchMetrics = jest.fn();
        mockedUsePerformanceMonitor.mockReturnValue({
            loading: false,
            error: null,
            systemStatus: mockSystemStatus,
            metricsHistory: mockMetricsHistory,
            recommendations: mockRecommendations,
            fetchMetrics
        });

        render(<PerformanceDashboard />);

        // Check system status
        expect(screen.getByText('System Status')).toBeInTheDocument();
        expect(screen.getByText('CPU Usage')).toBeInTheDocument();
        expect(screen.getByText('Memory Usage')).toBeInTheDocument();
        expect(screen.getByText('Disk Usage')).toBeInTheDocument();
        expect(screen.getByText('Network I/O')).toBeInTheDocument();

        // Check metrics chart
        expect(screen.getByText('Performance Metrics')).toBeInTheDocument();

        // Check recommendations
        expect(screen.getByText('Optimization Recommendations')).toBeInTheDocument();
        expect(screen.getByText('Optimize CPU Usage')).toBeInTheDocument();
    });

    it('should fetch metrics on mount and set up polling', () => {
        jest.useFakeTimers();
        const fetchMetrics = jest.fn();
        mockedUsePerformanceMonitor.mockReturnValue({
            loading: false,
            error: null,
            systemStatus: mockSystemStatus,
            metricsHistory: mockMetricsHistory,
            recommendations: mockRecommendations,
            fetchMetrics
        });

        render(<PerformanceDashboard />);

        expect(fetchMetrics).toHaveBeenCalledWith('1h');
        expect(fetchMetrics).toHaveBeenCalledTimes(1);

        // Fast-forward time by 30 seconds
        jest.advanceTimersByTime(30000);

        expect(fetchMetrics).toHaveBeenCalledTimes(2);

        jest.useRealTimers();
    });

    it('should handle time range changes', async () => {
        const fetchMetrics = jest.fn();
        mockedUsePerformanceMonitor.mockReturnValue({
            loading: false,
            error: null,
            systemStatus: mockSystemStatus,
            metricsHistory: mockMetricsHistory,
            recommendations: mockRecommendations,
            fetchMetrics
        });

        render(<PerformanceDashboard />);

        // Find and click the 24h button
        const button24h = screen.getByText('24h');
        fireEvent.click(button24h);

        await waitFor(() => {
            expect(fetchMetrics).toHaveBeenCalledWith('24h');
        });
    });

    it('should cleanup polling on unmount', () => {
        jest.useFakeTimers();
        const fetchMetrics = jest.fn();
        mockedUsePerformanceMonitor.mockReturnValue({
            loading: false,
            error: null,
            systemStatus: mockSystemStatus,
            metricsHistory: mockMetricsHistory,
            recommendations: mockRecommendations,
            fetchMetrics
        });

        const { unmount } = render(<PerformanceDashboard />);

        expect(fetchMetrics).toHaveBeenCalledTimes(1);

        unmount();

        // Fast-forward time
        jest.advanceTimersByTime(30000);

        // Should not call fetchMetrics again after unmount
        expect(fetchMetrics).toHaveBeenCalledTimes(1);

        jest.useRealTimers();
    });
}); 