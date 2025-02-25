// Metrics Worker Configuration

// Memory management
export const MEMORY_CONFIG = {
  MAX_HEAP_SIZE: 512 * 1024 * 1024, // 512MB
  CLEANUP_THRESHOLD: 0.8, // 80% usage triggers cleanup
  GC_INTERVAL: 60000, // 1 minute
};

// Data processing
export const PROCESSING_CONFIG = {
  CHUNK_SIZE: 1000,
  MAX_BATCH_SIZE: 50,
  MAX_CACHE_SIZE: 10000,
  MAX_HISTORICAL_POINTS: 10000,
  COMPRESSION_THRESHOLD: 1024, // 1KB
};

// WebSocket
export const WEBSOCKET_CONFIG = {
  RECONNECT_DELAY: 1000,
  MAX_RECONNECT_ATTEMPTS: 5,
  HEARTBEAT_INTERVAL: 30000,
  MESSAGE_TIMEOUT: 5000,
};

// Cache
export const CACHE_CONFIG = {
  VERSION: '1.0.0',
  TTL: 5 * 60 * 1000, // 5 minutes
  MAX_SIZE: 100 * 1024 * 1024, // 100MB
  CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutes
};

// Analytics
export const ANALYTICS_CONFIG = {
  ANOMALY_ZSCORE_THRESHOLD: 2,
  CRITICAL_ZSCORE_THRESHOLD: 3,
  FORECAST_POINTS: 24,
  MIN_CONFIDENCE: 0.6,
  MAX_CONFIDENCE: 0.95,
};

// Performance optimization
export const PERFORMANCE_CONFIG = {
  DEBOUNCE_DELAY: 100,
  THROTTLE_DELAY: 1000,
  MIN_UPDATE_INTERVAL: 1000,
  MAX_UPDATE_INTERVAL: 30000,
  LAZY_LOAD_CHUNK_SIZE: 20,
};

// Error handling
export const ERROR_CONFIG = {
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  MAX_ERROR_LOGS: 1000,
  ERROR_RETENTION_DAYS: 7,
};

// Resource monitoring
export const RESOURCE_CONFIG = {
  CHECK_INTERVAL: 60000, // 1 minute
  WARNING_THRESHOLD: 0.8, // 80% usage
  CRITICAL_THRESHOLD: 0.9, // 90% usage
  MAX_CPU_USAGE: 0.9, // 90% CPU usage
};

// Data sampling
export const SAMPLING_CONFIG = {
  DEFAULT_SAMPLE_SIZE: 1000,
  MIN_POINTS_FOR_SAMPLING: 100,
  SAMPLING_METHODS: {
    SIMPLE: 'simple',
    LTTB: 'largest-triangle-three-buckets',
    MIPS: 'min-max-importance-sampling',
  } as const,
  DEFAULT_METHOD: 'largest-triangle-three-buckets' as const,
};

// Export all configurations
export const MetricsConfig = {
  MEMORY: MEMORY_CONFIG,
  PROCESSING: PROCESSING_CONFIG,
  WEBSOCKET: WEBSOCKET_CONFIG,
  CACHE: CACHE_CONFIG,
  ANALYTICS: ANALYTICS_CONFIG,
  PERFORMANCE: PERFORMANCE_CONFIG,
  ERROR: ERROR_CONFIG,
  RESOURCE: RESOURCE_CONFIG,
  SAMPLING: SAMPLING_CONFIG,
} as const;

export type SamplingMethod = typeof SAMPLING_CONFIG.SAMPLING_METHODS[keyof typeof SAMPLING_CONFIG.SAMPLING_METHODS];

export default MetricsConfig; 