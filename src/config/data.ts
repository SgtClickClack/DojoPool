import { randomBytes } from 'crypto';

interface DataConfig {
  retentionDays: number;
  sessionKey: Buffer;
  backupKey: Buffer;
  encryptionKeys: {
    user: Buffer;
    game: Buffer;
    tournament: Buffer;
  };
}

export const dataConfig: DataConfig = {
  retentionDays: 90, // Data retention period in days

  // Session encryption key (32 bytes)
  sessionKey: randomBytes(32),

  // Backup encryption key (32 bytes)
  backupKey: randomBytes(32),

  // Feature-specific encryption keys
  encryptionKeys: {
    user: randomBytes(32),
    game: randomBytes(32),
    tournament: randomBytes(32),
  },
}; 