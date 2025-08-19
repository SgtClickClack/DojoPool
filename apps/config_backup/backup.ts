import { type BackupOptions } from '../types/backup';
import path from 'path';

interface BackupConfig {
  enabled: boolean;
  backupDir: string;
  retentionDays: number;
  compression: boolean;
  encryption: boolean;
  schedules: {
    database: BackupOptions;
    files: BackupOptions;
    configs: BackupOptions;
  };
  storage: {
    local: {
      enabled: boolean;
      path: string;
    };
    s3: {
      enabled: boolean;
      bucket: string;
      prefix: string;
      region: string;
    };
  };
  notifications: {
    email: {
      enabled: boolean;
      recipients: string[];
    };
    slack: {
      enabled: boolean;
      webhook: string;
      channel: string;
    };
  };
}

export const backupConfig: BackupConfig = {
  enabled: process.env.ENABLE_BACKUPS === 'true',
  backupDir: path.join(process.cwd(), 'backups'),
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
  compression: true,
  encryption: process.env.NODE_ENV === 'production',

  schedules: {
    database: {
      type: 'database',
      frequency: 'daily',
      time: '00:00',
      maxBackups: 7,
      include: ['game_data', 'user_data', 'tournament_data'],
      exclude: ['logs', 'sessions'],
    },
    files: {
      type: 'files',
      frequency: 'weekly',
      time: '01:00',
      maxBackups: 4,
      include: ['uploads', 'generated'],
      exclude: ['temp', 'cache'],
    },
    configs: {
      type: 'configs',
      frequency: 'daily',
      time: '00:30',
      maxBackups: 7,
      include: ['.env.production', 'ssl', 'config'],
      exclude: ['.env.development', '.env.local'],
    },
  },

  storage: {
    local: {
      enabled: true,
      path: path.join(process.cwd(), 'backups'),
    },
    s3: {
      enabled: process.env.NODE_ENV === 'production',
      bucket: process.env.BACKUP_S3_BUCKET || '',
      prefix: 'dojopool-backups',
      region: process.env.AWS_REGION || 'us-east-1',
    },
  },

  notifications: {
    email: {
      enabled: process.env.BACKUP_EMAIL_NOTIFICATIONS === 'true',
      recipients: (process.env.BACKUP_EMAIL_RECIPIENTS || '').split(','),
    },
    slack: {
      enabled: process.env.BACKUP_SLACK_NOTIFICATIONS === 'true',
      webhook: process.env.BACKUP_SLACK_WEBHOOK || '',
      channel: process.env.BACKUP_SLACK_CHANNEL || '#backups',
    },
  },
};

// Helper function to validate backup configuration
export function validateBackupConfig(config: BackupConfig): boolean {
  if (!config.enabled) {
    return true;
  }

  // Validate backup directory
  if (!config.backupDir) {
    throw new Error('Backup directory not configured');
  }

  // Validate retention period
  if (config.retentionDays < 1) {
    throw new Error('Invalid retention period');
  }

  // Validate storage configuration
  if (!config.storage.local.enabled && !config.storage.s3.enabled) {
    throw new Error('No storage backend configured');
  }

  // Validate S3 configuration if enabled
  if (config.storage.s3.enabled) {
    if (!config.storage.s3.bucket) {
      throw new Error('S3 bucket not configured');
    }
  }

  // Validate schedules
  for (const [key, schedule] of Object.entries(config.schedules)) {
    if (!schedule.frequency || !schedule.time) {
      throw new Error(`Invalid schedule configuration for ${key}`);
    }
    if (!Array.isArray(schedule.include) || schedule.include.length === 0) {
      throw new Error(`No backup targets configured for ${key}`);
    }
  }

  // Validate notifications if enabled
  if (config.notifications.email.enabled) {
    if (!config.notifications.email.recipients.length) {
      throw new Error('No email recipients configured for notifications');
    }
  }

  if (config.notifications.slack.enabled) {
    if (!config.notifications.slack.webhook) {
      throw new Error('Slack webhook not configured for notifications');
    }
  }

  return true;
}
