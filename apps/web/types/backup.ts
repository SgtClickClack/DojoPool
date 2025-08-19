export interface BackupOptions {
  type: string;
  frequency: string;
  time: string;
  maxBackups: number;
  include: string[];
  exclude: string[];
}
