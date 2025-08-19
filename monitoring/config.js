const monitoringConfig = {
  // Error Tracking (Sentry)
  sentry: {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    release: process.env.npm_package_version,
  },

  // Performance Monitoring (New Relic)
  newRelic: {
    licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
    appName: 'DojoPool',
    distributedTracing: {
      enabled: true,
    },
    transactionTracer: {
      enabled: true,
      transactionThreshold: 'apdex_f',
      recordSql: 'obfuscated',
    },
  },

  // Application Metrics (Datadog)
  datadog: {
    apiKey: process.env.DATADOG_API_KEY,
    site: 'datadoghq.com',
    service: 'dojopool',
    env: process.env.NODE_ENV,
    logLevel: process.env.LOG_LEVEL || 'info',
  },

  // Health Checks
  healthChecks: {
    interval: 30000, // 30 seconds
    timeout: 5000, // 5 seconds
    endpoints: [
      {
        name: 'api',
        url: '/api/health',
        method: 'GET',
        expectedStatus: 200,
      },
      {
        name: 'database',
        url: '/api/health/db',
        method: 'GET',
        expectedStatus: 200,
      },
      {
        name: 'redis',
        url: '/api/health/redis',
        method: 'GET',
        expectedStatus: 200,
      },
    ],
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    filePath: process.env.LOG_FILE_PATH || '/var/log/dojopool',
    maxSize: '100m',
    maxFiles: '14d',
  },

  // Alerting Configuration
  alerts: {
    errorThreshold: 5, // Number of errors before alert
    responseTimeThreshold: 1000, // Response time threshold in ms
    notificationChannels: {
      email: process.env.ALERT_EMAIL,
      slack: process.env.SLACK_WEBHOOK_URL,
    },
  },
};

export default monitoringConfig;
