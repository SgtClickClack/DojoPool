import { renderHook, act } from '@testing-library/react-hooks';
import axios from 'axios';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('usePerformanceMonitor', () => {
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

    it('should fetch metrics successfully', async () => {
        mockedAxios.get.mockImplementation((url) => {
            switch (url) {
                case '/api/performance/status':
                    return Promise.resolve({ data: mockSystemStatus });
                case '/api/performance/metrics?range=1h':
                    return Promise.resolve({ data: mockMetricsHistory });
                case '/api/performance/recommendations':
                    return Promise.resolve({ data: mockRecommendations });
                default:
                    return Promise.reject(new Error('Not found'));
            }
        });

        const { result } = renderHook(() => usePerformanceMonitor());

        await act(async () => {
            await result.current.fetchMetrics('1h');
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.systemStatus).toEqual(mockSystemStatus);
        expect(result.current.metricsHistory).toEqual(mockMetricsHistory);
        expect(result.current.recommendations).toEqual(mockRecommendations);
    });

    it('should handle fetch metrics error', async () => {
        const errorMessage = 'Network error';
        mockedAxios.get.mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() => usePerformanceMonitor());

        await act(async () => {
            await result.current.fetchMetrics('1h');
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(errorMessage);
    });

    it('should apply optimization successfully', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });
        mockedAxios.get.mockImplementation((url) => {
            switch (url) {
                case '/api/performance/status':
                    return Promise.resolve({ data: mockSystemStatus });
                case '/api/performance/recommendations':
                    return Promise.resolve({ data: mockRecommendations });
                default:
                    return Promise.reject(new Error('Not found'));
            }
        });

        const { result } = renderHook(() => usePerformanceMonitor());

        await act(async () => {
            await result.current.applyOptimization('1');
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(mockedAxios.post).toHaveBeenCalledWith('/api/performance/optimize/1');
    });

    it('should handle apply optimization error', async () => {
        const errorMessage = 'Optimization failed';
        mockedAxios.post.mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() => usePerformanceMonitor());

        await act(async () => {
            await result.current.applyOptimization('1');
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(errorMessage);
    });

    it('should acknowledge recommendation successfully', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });
        mockedAxios.get.mockResolvedValueOnce({ data: mockRecommendations });

        const { result } = renderHook(() => usePerformanceMonitor());

        await act(async () => {
            await result.current.acknowledgeRecommendation('1');
        });

        expect(result.current.error).toBeNull();
        expect(mockedAxios.post).toHaveBeenCalledWith('/api/performance/recommendations/1/acknowledge');
    });

    it('should handle acknowledge recommendation error', async () => {
        const errorMessage = 'Acknowledgment failed';
        mockedAxios.post.mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() => usePerformanceMonitor());

        await act(async () => {
            await result.current.acknowledgeRecommendation('1');
        });

        expect(result.current.error).toBe(errorMessage);
    });
}); 