export const CACHE_CONFIG = {
  DEFAULT_TTL: 300000, // 5 minutes
  MAX_SIZE: 1000,
  CLEANUP_INTERVAL: 60000, // 1 minute
  MAX_MEMORY_MB: 100, // 100 MB maximum memory usage
  INVALIDATION_STRATEGY: 'lru' as const, // LRU by default
  PERSISTENCE: {
    ENABLED: true,
    SYNC_INTERVAL: 300000, // 5 minutes
  },
  STATS_TRACKING: {
    ENABLED: true,
    DETAILED: true,
    RETENTION_DAYS: 7,
  },
  CACHE_TYPES: {
    ASSETS: {
      name: 'assets',
      version: 1,
      maxAge: 86400000, // 24 hours
      maxItems: 500,
      maxMemoryMB: 50,
      persistToStorage: true,
      invalidationStrategy: 'lru' as const,
    },
    API: {
      name: 'api',
      version: 1,
      maxAge: 300000, // 5 minutes
      maxItems: 200,
      maxMemoryMB: 20,
      persistToStorage: false,
      invalidationStrategy: 'lfu' as const,
    },
    USER: {
      name: 'user',
      version: 1,
      maxAge: 1800000, // 30 minutes
      maxItems: 100,
      maxMemoryMB: 10,
      persistToStorage: true,
      invalidationStrategy: 'fifo' as const,
    },
    TEMP: {
      name: 'temp',
      version: 1,
      maxAge: 60000, // 1 minute
      maxItems: 50,
      maxMemoryMB: 5,
      persistToStorage: false,
      invalidationStrategy: 'lru' as const,
    },
  },
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
