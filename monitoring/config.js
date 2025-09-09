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
      pagerDuty: process.env.PAGERDUTY_INTEGRATION_KEY,
    },
  },

  // Live Service Management
  liveService: {
    // Service Level Objectives (SLOs)
    slos: {
      uptime: 99.9, // 99.9% uptime target
      responseTime: 2000, // P95 < 2 seconds
      errorRate: 0.05, // < 5% error rate
    },

    // Auto-healing configuration
    autoHealing: {
      enabled: true,
      maxRestarts: 3,
      restartDelay: 30000, // 30 seconds
      healthCheckGracePeriod: 60000, // 1 minute
    },

    // Maintenance windows
    maintenance: {
      weekly: 'sunday 02:00-04:00 UTC',
      monthly: 'first-monday 01:00-03:00 UTC',
      emergency: 'as-needed',
    },

    // Feature flags for live service management
    featureFlags: {
      enableMaintenanceMode: false,
      enableDebugLogging: false,
      enablePerformanceMonitoring: true,
      enableUserFeedbackCollection: true,
    },
  },
};

export default monitoringConfig;
