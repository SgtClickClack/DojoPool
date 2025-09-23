// Metrics monitoring service
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface AlertData {
  componentName?: string;
  renderTime?: number;
  memoryUsage?: number;
  endpoint?: string;
  duration?: number;
  threshold?: number;
  [key: string]: any;
}

export interface MetricAlert {
  id: string;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  acknowledged?: boolean;
  data?: AlertData;
}

export const metrics_monitor = {
  addAlert: (severity: AlertSeverity, message: string, data?: AlertData) => {
    console.log(`[${severity.toUpperCase()}] ${message}`, data);
  },

  trackMetric: (name: string, value: number) => {
    console.log(`Metric tracked: ${name} = ${value}`);
  },

  getAlerts: (): MetricAlert[] => [],

  acknowledgeAlert: (alertId: string, userId: string) => {
    console.log(`Alert ${alertId} acknowledged by user ${userId}`);
  },
};
