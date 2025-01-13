import { useState, useCallback } from 'react';
import axios from 'axios';

interface MetricsParams {
  userId?: number;
  metricType?: string;
  period?: string;
  startDate?: string;
  endDate?: string;
}

interface AggregatedMetricsParams extends MetricsParams {
  dimension: string;
  dimensionId?: number;
}

interface Metric {
  id: number;
  metric_type: string;
  value: number;
  period: string;
  date: string;
  created_at: string;
}

interface AggregatedMetric extends Metric {
  dimension: string;
  dimension_id?: number;
  count: number;
  sum: number;
  avg: number;
  min?: number;
  max?: number;
  percentile_90?: number;
}

export const useAnalytics = () => {
  const [metrics, setMetrics] = useState<Metric[] | AggregatedMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async (params: MetricsParams) => {
    try {
      setLoading(true);
      setError(null);

      const { userId, ...queryParams } = params;
      const response = await axios.get(`/api/analytics/user/${userId}/metrics`, {
        params: queryParams,
      });

      setMetrics(response.data.metrics);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch metrics');
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAggregatedMetrics = useCallback(async (params: AggregatedMetricsParams) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('/api/analytics/aggregated', {
        params,
      });

      setMetrics(response.data.metrics);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch aggregated metrics');
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFeatureUsage = useCallback(async (params: MetricsParams) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('/api/analytics/feature-usage', {
        params,
      });

      setMetrics(response.data.stats);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch feature usage stats');
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPerformanceMetrics = useCallback(
    async (
      params: MetricsParams & {
        endpoint?: string;
        component?: string;
      }
    ) => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get('/api/analytics/performance', {
          params,
        });

        setMetrics(response.data.metrics);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch performance metrics');
        setMetrics([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const trackMetric = useCallback(
    async (type: 'user' | 'game' | 'venue' | 'feature' | 'performance', data: any) => {
      try {
        setError(null);

        const response = await axios.post(`/api/analytics/track/${type}-metric`, data);
        return response.data;
      } catch (err) {
        setError(err.response?.data?.error || `Failed to track ${type} metric`);
        throw err;
      }
    },
    []
  );

  const aggregateMetrics = useCallback(
    async (data: {
      metricType: string;
      dimension: string;
      period?: string;
      startDate?: string;
      endDate?: string;
      dimensionId?: number;
    }) => {
      try {
        setError(null);

        const response = await axios.post('/api/analytics/aggregate', data);
        return response.data;
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to aggregate metrics');
        throw err;
      }
    },
    []
  );

  return {
    metrics,
    loading,
    error,
    fetchMetrics,
    fetchAggregatedMetrics,
    fetchFeatureUsage,
    fetchPerformanceMetrics,
    trackMetric,
    aggregateMetrics,
  };
};
