export const MONITORING_CONFIG = {
    METRICS_WINDOW: 3600000, // 1 hour in milliseconds
    UPDATE_INTERVAL: 60000, // 1 minute in milliseconds
    MAX_ERRORS: 100,
    MAX_INCIDENTS: 50,
    MAX_ARCHIVE_SIZE: 1024 * 1024 * 10, // 10MB
    RATE_LIMIT: {
        MAX_REQUESTS: 3,
        WINDOW_MS: 1000
    }
};

export const CACHE_CONFIG = {
    DEFAULT_TTL: 60000, // 1 minute in milliseconds
    MAX_SIZE: 1000, // Maximum number of entries
    CLEANUP_INTERVAL: 300000 // 5 minutes in milliseconds
}; 