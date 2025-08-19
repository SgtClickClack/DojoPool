export const notificationConfig = {
  email: {
    enabled: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
    recipients: (process.env.EMAIL_NOTIFICATION_RECIPIENTS || '')
      .split(',')
      .filter(Boolean),
    smtpConfig: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    },
  },
  slack: {
    enabled: process.env.ENABLE_SLACK_NOTIFICATIONS === 'true',
    webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
    channel: process.env.SLACK_CHANNEL || '#performance-alerts',
  },
  sns: {
    enabled: process.env.ENABLE_SNS_NOTIFICATIONS === 'true',
    topicArn: process.env.SNS_TOPIC_ARN || '',
    region: process.env.AWS_REGION || 'us-east-1',
  },
  alertThresholds: {
    regressionSeverity: {
      error: parseFloat(process.env.REGRESSION_ERROR_THRESHOLD || '20'),
      warning: parseFloat(process.env.REGRESSION_WARNING_THRESHOLD || '10'),
    },
    consecutiveFailures: parseInt(
      process.env.CONSECUTIVE_FAILURES_THRESHOLD || '3',
      10
    ),
    minTimeBetweenAlerts: parseInt(
      process.env.MIN_TIME_BETWEEN_ALERTS || '3600000',
      10
    ), // 1 hour in milliseconds
  },
  batchingConfig: {
    enabled: process.env.ENABLE_ALERT_BATCHING === 'true',
    interval: parseInt(process.env.ALERT_BATCHING_INTERVAL || '300000', 10), // 5 minutes in milliseconds
    maxBatchSize: parseInt(process.env.MAX_BATCH_SIZE || '10', 10),
  },
};
