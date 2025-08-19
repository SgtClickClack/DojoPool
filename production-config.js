const path = require('path');

module.exports = {
  // Production server configuration
  server: {
    port: process.env.PORT || 8080,
    host: process.env.HOST || '0.0.0.0',
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  },

  // Database configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/dojopool',
    pool: {
      min: 2,
      max: 10,
    },
  },

  // Security configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    bcryptRounds: 12,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    },
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'combined',
    file: {
      filename: 'logs/app.log',
      maxSize: '10m',
      maxFiles: 5,
    },
  },

  // Performance configuration
  performance: {
    compression: true,
    cache: {
      maxAge: 86400000, // 24 hours
      etag: true,
    },
    gzip: {
      threshold: 1024,
      level: 6,
    },
  },

  // Environment-specific settings
  environment: process.env.NODE_ENV || 'development',

  // Feature flags
  features: {
    aiCommentary: true,
    clanWars: true,
    tournaments: true,
    avatarProgression: true,
    territoryControl: true,
  },

  // API configuration
  api: {
    version: 'v1',
    baseUrl: '/api',
    timeout: 30000,
  },

  // WebSocket configuration
  websocket: {
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  },

  // File upload configuration
  upload: {
    maxSize: '10mb',
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
    destination: 'uploads/',
  },

  // Monitoring configuration
  monitoring: {
    healthCheck: {
      interval: 30000, // 30 seconds
      timeout: 5000,
    },
    metrics: {
      enabled: true,
      port: 9090,
    },
  },
};
