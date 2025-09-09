// Analytics Data Transfer Objects (DTOs) for SSE streaming
export interface AnalyticsData {
  dau: number;
  mau: number;
  totalUsers: number;
  totalEvents: number;
  topEvents: Array<{
    eventName: string;
    count: number;
  }>;
  userEngagement: Array<{
    date: string;
    activeUsers: number;
    sessions: number;
    avgSessionLength: number;
  }>;
  featureUsage: Array<{
    feature: string;
    usageCount: number;
    uniqueUsers: number;
  }>;
  systemPerformance: {
    avgResponseTime: number;
    errorRate: number;
    uptime: number;
  };
  economyMetrics: {
    totalTransactions: number;
    totalVolume: number;
    avgTransactionValue: number;
  };
}

export interface RealtimeMetrics {
  dau: number;
  totalEvents: number;
  topEvents: Array<{ eventName: string; count: number }>;
  systemPerformance: {
    avgResponseTime: number;
    errorRate: number;
    uptime: number;
  };
  economyMetrics: {
    totalTransactions: number;
    totalVolume: number;
    avgTransactionValue: number;
  };
}

export interface AnalyticsSSEEvent {
  type: 'analytics_update' | 'realtime_update' | 'error';
  data:
    | AnalyticsData
    | RealtimeMetrics
    | { message: string; timestamp: string };
  timestamp: string;
}

export interface AnalyticsFilter {
  startDate: Date;
  endDate: Date;
  timeRange: '7d' | '30d' | '90d';
}
