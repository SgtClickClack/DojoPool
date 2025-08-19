export type BackupFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly';
export type BackupType = 'database' | 'files' | 'configs';

export interface BackupOptions {
  type: BackupType;
  frequency: BackupFrequency;
  time: string;
  maxBackups: number;
  include: string[];
  exclude?: string[];
}

export interface BackupResult {
  success: boolean;
  timestamp: Date;
  type: BackupType;
  size: number;
  location: string;
  error?: string;
}

export interface BackupNotification {
  type: 'success' | 'error';
  message: string;
  details: {
    backupType: BackupType;
    timestamp: Date;
    size?: number;
    location?: string;
    error?: string;
  };
}
