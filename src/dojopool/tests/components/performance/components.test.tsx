import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SystemStatus } from '../../../components/performance/SystemStatus';
import { MetricsChart } from '../../../components/performance/MetricsChart';
import { OptimizationRecommendations } from '../../../components/performance/OptimizationRecommendations';

describe('SystemStatus', () => {
    const mockStatus = {
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

    it('should render system metrics correctly', () => {
        render(<SystemStatus status={mockStatus} />);

        expect(screen.getByText('System Status')).toBeInTheDocument();
        expect(screen.getByText('CPU Usage')).toBeInTheDocument();
        expect(screen.getByText('Memory Usage')).toBeInTheDocument();
        expect(screen.getByText('Disk Usage')).toBeInTheDocument();
        expect(screen.getByText('Network I/O')).toBeInTheDocument();

        expect(screen.getByText(`Process CPU: ${mockStatus.process_metrics.cpu_percent}%`)).toBeInTheDocument();
        expect(screen.getByText(`Process Memory: ${mockStatus.process_metrics.memory_percent}%`)).toBeInTheDocument();
        expect(screen.getByText(`Open Files: ${mockStatus.process_metrics.open_files}`)).toBeInTheDocument();
        expect(screen.getByText(`Active Connections: ${mockStatus.process_metrics.connections}`)).toBeInTheDocument();
    });
});

describe('MetricsChart', () => {
    const mockData = [
        {
            timestamp: '2024-01-01T00:00:00Z',
            cpu_usage: 45.5,
            memory_usage: 60.2,
            disk_usage: 75.8,
            network_io_rate: 1024
        },
        {
            timestamp: '2024-01-01T00:01:00Z',
            cpu_usage: 48.2,
            memory_usage: 62.5,
            disk_usage: 76.1,
            network_io_rate: 1124
        }
    ];

    it('should render chart with data', () => {
        const onTimeRangeChange = jest.fn();
        render(
            <MetricsChart
                data={mockData}
                timeRange="1h"
                onTimeRangeChange={onTimeRangeChange}
            />
        );

        expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
        expect(screen.getByText('1h')).toBeInTheDocument();
        expect(screen.getByText('24h')).toBeInTheDocument();
        expect(screen.getByText('7d')).toBeInTheDocument();
    });

    it('should handle time range changes', () => {
        const onTimeRangeChange = jest.fn();
        render(
            <MetricsChart
                data={mockData}
                timeRange="1h"
                onTimeRangeChange={onTimeRangeChange}
            />
        );

        fireEvent.click(screen.getByText('24h'));
        expect(onTimeRangeChange).toHaveBeenCalledWith('24h');
    });
});

describe('OptimizationRecommendations', () => {
    const mockRecommendations = [
        {
            id: '1',
            type: 'cpu',
            priority: 'high',
            title: 'Optimize CPU Usage',
            description: 'High CPU usage detected',
            impact: 'Improved response time',
            status: 'pending'
        },
        {
            id: '2',
            type: 'memory',
            priority: 'medium',
            title: 'Memory Optimization',
            description: 'Memory usage optimization recommended',
            impact: 'Reduced memory consumption',
            status: 'in_progress'
        }
    ];

    it('should render recommendations correctly', () => {
        render(<OptimizationRecommendations recommendations={mockRecommendations} />);

        expect(screen.getByText('Optimization Recommendations')).toBeInTheDocument();
        expect(screen.getByText('Optimize CPU Usage')).toBeInTheDocument();
        expect(screen.getByText('Memory Optimization')).toBeInTheDocument();
        expect(screen.getByText('High CPU usage detected')).toBeInTheDocument();
        expect(screen.getByText('Memory usage optimization recommended')).toBeInTheDocument();
    });

    it('should display correct priority and status indicators', () => {
        render(<OptimizationRecommendations recommendations={mockRecommendations} />);

        expect(screen.getByText('HIGH')).toBeInTheDocument();
        expect(screen.getByText('MEDIUM')).toBeInTheDocument();
        expect(screen.getByText('PENDING')).toBeInTheDocument();
        expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
    });

    it('should render empty state when no recommendations', () => {
        render(<OptimizationRecommendations recommendations={[]} />);

        expect(screen.getByText('Optimization Recommendations')).toBeInTheDocument();
        expect(screen.queryByText('Optimize CPU Usage')).not.toBeInTheDocument();
    });
}); 