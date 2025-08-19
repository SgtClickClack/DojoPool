export class GameMetricsMonitor {
  private alerts: Alert[] = [];
  private metrics: GameMetrics = {
    completions: 0,
    averageScore: 0,
    averageTime: 0,
  };

  recordGameCompletion(playerId: string, score: number, time: number) {
    this.metrics.completions++;
    this.metrics.averageScore =
      (this.metrics.averageScore * (this.metrics.completions - 1) + score) /
      this.metrics.completions;
    this.metrics.averageTime =
      (this.metrics.averageTime * (this.metrics.completions - 1) + time) /
      this.metrics.completions;
  }

  addAlert(severity: 'info' | 'warning' | 'error', message: string): Alert {
    const alert = {
      id: Date.now().toString(),
      severity,
      message,
      timestamp: new Date(),
      acknowledged: false,
    };
    this.alerts.push(alert);
    return alert;
  }

  acknowledgeAlert(alertId: string) {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  getAlerts(filter?: { severity?: 'info' | 'warning' | 'error' }) {
    let filtered = this.alerts;
    if (filter?.severity) {
      filtered = filtered.filter((a) => a.severity === filter.severity);
    }
    return filtered;
  }

  async getHistoricalMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<GameMetrics[]> {
    // Mock implementation for testing
    return [this.metrics];
  }

  async getMetricsSnapshot(): Promise<GameMetrics> {
    return this.metrics;
  }

  async getArchiveStats(): Promise<{ totalSize: number; oldestDate: Date }> {
    return {
      totalSize: 1000,
      oldestDate: new Date('2024-01-01'),
    };
  }
}

interface GameMetrics {
  completions: number;
  averageScore: number;
  averageTime: number;
}

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}
