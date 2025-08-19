export const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
export const WEBSOCKET_BASE_URL =
  process.env.REACT_APP_WEBSOCKET_URL || '/socket.io';

// Cache configuration
export const CACHE_CONFIG = {
  defaultTTL: 300000, // 5 minutes
  maxSize: 1000,
  cleanupInterval: 60000, // 1 minute
};

// Monitoring configuration
export const MONITORING_CONFIG = {
  metricsInterval: 5000, // 5 seconds
  alertThresholds: {
    cpu: 80,
    memory: 85,
    disk: 90,
  },
  retentionDays: 30,
};

// Validation thresholds
export const VIOLATION_THRESHOLDS = {
  maxLoginAttempts: 5,
  maxRequestRate: 100, // requests per minute
  maxFileSize: 10 * 1024 * 1024, // 10MB
};
