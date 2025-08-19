// Application constants to replace magic numbers and hardcoded values
export const CONFIG = {
  // Port configurations
  PORTS: {
    FRONTEND: 3000,
    BACKEND: 8080,
    MCP_START: 3002,
    MCP_END: 3011,
  },

  // Timeout configurations (in milliseconds)
  TIMEOUTS: {
    API_REQUEST: 10000, // 10 seconds
    WEBSOCKET: 5000, // 5 seconds
    DATABASE: 30000, // 30 seconds
    REDIS: 3000, // 3 seconds
    FILE_UPLOAD: 60000, // 60 seconds
  },

  // Rate limiting
  RATE_LIMITS: {
    DEFAULT: '1000/hour',
    AUTH: '100/hour',
    API: '5000/hour',
    UPLOAD: '50/hour',
  },

  // Cache configurations
  CACHE: {
    TTL: 3600, // 1 hour in seconds
    MAX_ITEMS: 10000,
    PREFIX: 'dojopool_',
  },

  // Game mechanics
  GAME: {
    MAX_PLAYERS: 8,
    MIN_PLAYERS: 2,
    POOL_TABLES: 15,
    RATING_SCALE: {
      MIN: 1,
      MAX: 5,
    },
  },

  // Performance thresholds
  PERFORMANCE: {
    CPU_THRESHOLD: 80, // percentage
    MEMORY_THRESHOLD: 80, // percentage
    DISK_THRESHOLD: 80, // percentage
    RESPONSE_TIME_THRESHOLD: 1000, // milliseconds
    FRAME_RATE: {
      TARGET: 60, // fps
      MIN_ACCEPTABLE: 30, // fps
    },
  },

  // UI/UX constants
  UI: {
    ANIMATION_DURATION: 300, // milliseconds
    DEBOUNCE_DELAY: 500, // milliseconds
    PAGINATION_SIZE: 20,
    MAX_FILE_SIZE: 10485760, // 10MB in bytes
    TOAST_DURATION: 5000, // 5 seconds
  },

  // Color scheme (for consistent theming)
  COLORS: {
    PRIMARY_CYAN: '#00FFFF',
    SECONDARY_ORANGE: '#FF8C00',
    BACKGROUND_GRAY: '#1a1a1a',
    SUCCESS_GREEN: '#00FF00',
    ERROR_RED: '#FF0000',
    WARNING_YELLOW: '#FFFF00',
    DOJO_GOLD: '#FFD700',
  },

  // API endpoints
  API: {
    BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
    WEBSOCKET_URL: process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8080',
    SKY_T1_ENDPOINT:
      process.env.REACT_APP_SKY_T1_API_ENDPOINT || '/api/mock/sky-t1/analyze',
  },

  // Database limits
  DATABASE: {
    MAX_CONNECTIONS: 100,
    CONNECTION_POOL: 20,
    QUERY_TIMEOUT: 30000, // 30 seconds
    BATCH_SIZE: 1000,
  },

  // File and upload limits
  FILES: {
    MAX_SIZE: 10485760, // 10MB
    ALLOWED_TYPES: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov'],
    THUMBNAIL_SIZE: 200, // pixels
  },

  // Security settings
  SECURITY: {
    PASSWORD_MIN_LENGTH: 8,
    SESSION_DURATION: 86400, // 24 hours in seconds
    TOKEN_EXPIRY: 3600, // 1 hour in seconds
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 900, // 15 minutes in seconds
  },

  // Tournament settings
  TOURNAMENT: {
    MIN_PARTICIPANTS: 4,
    MAX_PARTICIPANTS: 64,
    REGISTRATION_DEADLINE: 3600, // 1 hour before start in seconds
    MATCH_TIMEOUT: 1800, // 30 minutes in seconds
  },

  // AI service configurations
  AI: {
    CONFIDENCE_THRESHOLD: 0.8,
    MAX_RETRIES: 3,
    ANALYSIS_TIMEOUT: 15000, // 15 seconds
  },

  // Blockchain settings
  BLOCKCHAIN: {
    GAS_LIMIT: 300000,
    GAS_PRICE_MULTIPLIER: 1.2,
    CONFIRMATION_BLOCKS: 12,
    TRANSACTION_TIMEOUT: 60000, // 60 seconds
  },

  // Monitoring and analytics
  MONITORING: {
    METRICS_RETENTION_DAYS: 30,
    ALERT_COOLDOWN: 300, // 5 minutes in seconds
    HEALTH_CHECK_INTERVAL: 60000, // 1 minute
  },

  // Validation patterns
  VALIDATION: {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    USERNAME_REGEX: /^[a-zA-Z0-9_]{3,20}$/,
    PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  },
} as const;

// Export individual sections for convenience
export const { PORTS, TIMEOUTS, COLORS, PERFORMANCE } = CONFIG;

// Environment-specific overrides
export const ENVIRONMENT = {
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_TEST: process.env.NODE_ENV === 'test',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

// Feature flags
export const FEATURES = {
  ENABLE_ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  ENABLE_NOTIFICATIONS: process.env.REACT_APP_ENABLE_NOTIFICATIONS === 'true',
  ENABLE_WEBSOCKETS: process.env.ENABLE_WEBSOCKETS !== 'false', // default true
  ENABLE_CACHING: process.env.ENABLE_CACHING !== 'false', // default true
  ENABLE_ML_FEATURES: process.env.ENABLE_ML_FEATURES === 'true',
  ENABLE_AI_FEATURES: process.env.ENABLE_AI_FEATURES === 'true',
};

export default CONFIG;
