// Core configuration constants
export const CACHE_CONFIG = {
  maxSize: 1000,
  ttl: 300000, // 5 minutes
  cleanupInterval: 60000, // 1 minute
};

export const MONITORING_CONFIG = {
  metricsInterval: 5000, // 5 seconds
  alertThresholds: {
    cpu: 80,
    memory: 85,
    disk: 90,
  },
  retentionDays: 30,
};

export const VIOLATION_THRESHOLDS = {
  maxRetries: 3,
  timeoutMs: 5000,
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000,
  },
};
