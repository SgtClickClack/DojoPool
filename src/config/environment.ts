export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 8080,
  DATABASE_URL: process.env.DATABASE_URL || 'sqlite:./dojopool.db',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  S3_BUCKET: process.env.S3_BUCKET || 'dojopool-assets',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  SOCKET_CORS_ORIGIN: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  API_RATE_LIMIT: process.env.API_RATE_LIMIT || 100,
  SESSION_SECRET: process.env.SESSION_SECRET || 'dojopool-session-secret',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'dojopool-encryption-key-32-chars',
  BACKUP_ENABLED: process.env.BACKUP_ENABLED === 'true',
  BACKUP_SCHEDULE: process.env.BACKUP_SCHEDULE || '0 2 * * *',
  MONITORING_ENABLED: process.env.MONITORING_ENABLED === 'true',
  ALERT_WEBHOOK_URL: process.env.ALERT_WEBHOOK_URL || '',
  WEBSOCKET_URL: process.env.WEBSOCKET_URL || 'ws://localhost:8080',
  FEATURE_FLAGS: {
    AI_COMMENTARY: process.env.AI_COMMENTARY_ENABLED === 'true',
    AI_REFEREE: process.env.AI_REFEREE_ENABLED === 'true',
    REAL_TIME_TRACKING: process.env.REAL_TIME_TRACKING_ENABLED === 'true',
    TERRITORY_CONTROL: process.env.TERRITORY_CONTROL_ENABLED === 'true',
    CHALLENGE_SYSTEM: process.env.CHALLENGE_SYSTEM_ENABLED === 'true',
    MATCH_REPLAY: process.env.MATCH_REPLAY_ENABLED === 'true',
    ANALYTICS: process.env.ANALYTICS_ENABLED === 'true',
  },
  AI_SERVICES: {
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4',
    COMMENTARY_STYLE: process.env.COMMENTARY_STYLE || 'professional',
    REFEREE_STRICTNESS: process.env.REFEREE_STRICTNESS || 'moderate',
    ANALYSIS_DEPTH: process.env.ANALYSIS_DEPTH || 'detailed',
  },
  GAME_SETTINGS: {
    DEFAULT_MATCH_DURATION: parseInt(process.env.DEFAULT_MATCH_DURATION || '1800'), // 30 minutes
    MAX_PLAYERS_PER_MATCH: parseInt(process.env.MAX_PLAYERS_PER_MATCH || '2'),
    MIN_CHALLENGE_AMOUNT: parseInt(process.env.MIN_CHALLENGE_AMOUNT || '10'),
    MAX_CHALLENGE_AMOUNT: parseInt(process.env.MAX_CHALLENGE_AMOUNT || '1000'),
    TERRITORY_CONTROL_DURATION: parseInt(process.env.TERRITORY_CONTROL_DURATION || '86400'), // 24 hours
    REWARD_MULTIPLIER: parseFloat(process.env.REWARD_MULTIPLIER || '1.0'),
  },
  SECURITY: {
    PASSWORD_MIN_LENGTH: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
    SESSION_TIMEOUT: parseInt(process.env.SESSION_TIMEOUT || '3600000'), // 1 hour
    MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
    ACCOUNT_LOCKOUT_DURATION: parseInt(process.env.ACCOUNT_LOCKOUT_DURATION || '900000'), // 15 minutes
  },
  PERFORMANCE: {
    CACHE_TTL: parseInt(process.env.CACHE_TTL || '300'), // 5 minutes
    MAX_CONCURRENT_REQUESTS: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '100'),
    REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT || '30000'), // 30 seconds
    WEBSOCKET_HEARTBEAT: parseInt(process.env.WEBSOCKET_HEARTBEAT || '30000'), // 30 seconds
  },
};

export const environment = env;
export default env; 