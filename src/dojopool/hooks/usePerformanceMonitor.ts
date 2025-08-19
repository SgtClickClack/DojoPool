import { useState, useCallback } from 'react';
import axios from 'axios';

interface SystemStatus {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_io: {
    bytes_sent: number;
    bytes_recv: number;
    packets_sent: number;
    packets_recv: number;
  };
  process_metrics: {
    cpu_percent: number;
    memory_percent: number;
    threads: number;
    open_files: number;
    connections: number;
  };
}

interface MetricDataPoint {
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_io_rate: number;
}

interface Recommendation {
  id: string;
  type: 'cpu' | 'memory' | 'disk' | 'network';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export const usePerformanceMonitor = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<MetricDataPoint[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async (timeRange: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current system status
      const statusResponse = await axios.get('/api/performance/status');
      setSystemStatus(statusResponse.data);

      // Fetch metrics history
      const metricsResponse = await axios.get(
        `/api/performance/metrics?range=${timeRange}`
      );
      setMetricsHistory(metricsResponse.data);

      // Fetch optimization recommendations
      const recommendationsResponse = await axios.get(
        '/api/performance/recommendations'
      );
      setRecommendations(recommendationsResponse.data);

      setLoading(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while fetching performance metrics'
      );
      setLoading(false);
    }
  }, []);

  const applyOptimization = useCallback(async (recommendationId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Apply the optimization
      await axios.post(`/api/performance/optimize/${recommendationId}`);

      // Refresh metrics after optimization
      const statusResponse = await axios.get('/api/performance/status');
      setSystemStatus(statusResponse.data);

      // Update recommendation status
      const recommendationsResponse = await axios.get(
        '/api/performance/recommendations'
      );
      setRecommendations(recommendationsResponse.data);

      setLoading(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while applying optimization'
      );
      setLoading(false);
    }
  }, []);

  const acknowledgeRecommendation = useCallback(
    async (recommendationId: string) => {
      try {
        await axios.post(
          `/api/performance/recommendations/${recommendationId}/acknowledge`
        );

        // Refresh recommendations after acknowledgment
        const recommendationsResponse = await axios.get(
          '/api/performance/recommendations'
        );
        setRecommendations(recommendationsResponse.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'An error occurred while acknowledging recommendation'
        );
      }
    },
    []
  );

  return {
    systemStatus,
    metricsHistory,
    recommendations,
    loading,
    error,
    fetchMetrics,
    applyOptimization,
    acknowledgeRecommendation,
  };
};
