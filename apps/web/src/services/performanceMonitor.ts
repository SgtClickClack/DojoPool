// Performance monitoring service
export interface PerformanceMetrics {
  memoryUsage: number; // percentage
  memoryAvailable: number; // GB
  cpuUsage: number; // percentage
  processCount: number;
  threadCount: number;
  networkSent: number; // MB
  networkReceived: number; // MB
  timestamp: Date;
}

export const performance_monitor = {
  getCurrentMetrics: (): PerformanceMetrics => {
    // Mock performance data for development
    // In a real implementation, this would collect actual system metrics
    return {
      memoryUsage: Math.random() * 100,
      memoryAvailable: 8 - Math.random() * 4, // 4-8 GB available
      cpuUsage: Math.random() * 100,
      processCount: Math.floor(Math.random() * 200) + 50,
      threadCount: Math.floor(Math.random() * 1000) + 200,
      networkSent: Math.random() * 1000,
      networkReceived: Math.random() * 1000,
      timestamp: new Date(),
    };
  },

  startMonitoring: () => {
    console.log('Performance monitoring started');
  },

  stopMonitoring: () => {
    console.log('Performance monitoring stopped');
  },

  getMetricsHistory: (timeRange: number = 3600000): PerformanceMetrics[] => {
    // Mock historical data
    const history: PerformanceMetrics[] = [];
    const now = new Date();

    for (let i = 0; i < 60; i++) {
      const timestamp = new Date(now.getTime() - i * 60000); // 1 minute intervals
      history.push({
        memoryUsage: Math.random() * 100,
        memoryAvailable: 8 - Math.random() * 4,
        cpuUsage: Math.random() * 100,
        processCount: Math.floor(Math.random() * 200) + 50,
        threadCount: Math.floor(Math.random() * 1000) + 200,
        networkSent: Math.random() * 1000,
        networkReceived: Math.random() * 1000,
        timestamp,
      });
    }

    return history.reverse(); // Oldest first
  },

  trackPerformance: (componentName: string, renderTime: number) => {
    console.log(
      `Performance tracked: ${componentName} rendered in ${renderTime}ms`
    );
  },

  getPerformanceReport: () => {
    return {
      averageMemoryUsage: Math.random() * 100,
      averageCpuUsage: Math.random() * 100,
      peakMemoryUsage: Math.random() * 100,
      peakCpuUsage: Math.random() * 100,
      totalNetworkTraffic: Math.random() * 2000,
      uptime: Date.now() - Math.random() * 86400000, // Random uptime up to 24 hours
    };
  },
};
