export const CACHE_CONFIG = {
  DEFAULT_TTL: 300000, // 5 minutes
  MAX_SIZE: 1000,
  CLEANUP_INTERVAL: 60000, // 1 minute
};

export const LOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0,
};

export const VIOLATION_THRESHOLDS = {
  WARNING: 2,
  SUSPENSION: 4,
  BAN: 6,
};

export const MONITORING_CONFIG = {
  METRICS_WINDOW: 3600000, // 1 hour
  UPDATE_INTERVAL: 5000, // 5 seconds
  MAX_ERRORS: 1000,
  MAX_INCIDENTS: 100,
  RATE_LIMIT: {
    WINDOW: 60000, // 1 minute
    MAX_REQUESTS: 100,
  },
};

export const ERROR_TRACKING_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  ERROR_WINDOW: 3600000, // 1 hour
  MAX_ERRORS_PER_COMPONENT: 100,
};

export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  TIMEOUT: 5000,
  RETRY_COUNT: 3,
};
