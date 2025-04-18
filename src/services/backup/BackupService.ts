import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createGzip } from "zlib";
import { createCipheriv, randomBytes } from "crypto";
import { createReadStream, createWriteStream } from "fs";
import { mkdir, readdir, unlink } from "fs/promises";
import path from "path";
import { pipeline } from "stream/promises";
import { backupConfig, validateBackupConfig } from "../../config/backup";
import {
  BackupType,
  BackupResult,
  BackupNotification,
} from "../../types/backup";
import { prisma } from "../../lib/prisma";
import { logger } from "../../utils/logger";

export class BackupService {
  private s3Client: S3Client | null = null;
  private encryptionKey: Buffer;

  constructor() {
    this.validateConfig();
    this.initializeS3Client();
    this.encryptionKey = Buffer.from(
      process.env.BACKUP_ENCRYPTION_KEY || randomBytes(32),
    );
  }

  private validateConfig() {
    try {
      validateBackupConfig(backupConfig);
    } catch (error) {
      logger.error("Invalid backup configuration:", error);
      throw error;
    }
  }

  private initializeS3Client() {
    if (backupConfig.storage.s3.enabled) {
      this.s3Client = new S3Client({
        region: backupConfig.storage.s3.region,
      });
    }
  }

  public async performBackup(type: BackupType): Promise<BackupResult> {
    try {
      const timestamp = new Date();
      const backupFileName = this.generateBackupFileName(type, timestamp);
      const backupPath = path.join(backupConfig.backupDir, backupFileName);

      // Create backup directory if it doesn't exist
      await mkdir(backupConfig.backupDir, { recursive: true });

      // Perform backup based on type
      let size = 0;
      switch (type) {
        case "database":
          size = await this.backupDatabase(backupPath);
          break;
        case "files":
          size = await this.backupFiles(backupPath);
          break;
        case "configs":
          size = await this.backupConfigs(backupPath);
          break;
        default:
          throw new Error(`Unsupported backup type: ${type}`);
      }

      // Upload to S3 if enabled
      if (backupConfig.storage.s3.enabled && this.s3Client) {
        await this.uploadToS3(backupPath, backupFileName);
      }

      // Clean up old backups
      await this.cleanupOldBackups(type);

      // Send notification
      await this.sendNotification({
        type: "success",
        message: `Backup completed successfully: ${type}`,
        details: {
          backupType: type,
          timestamp,
          size,
          location: backupPath,
        },
      });

      return {
        success: true,
        timestamp,
        type,
        size,
        location: backupPath,
      };
    } catch (error) {
      logger.error(`Backup failed for type ${type}:`, error);

      // Send error notification
      await this.sendNotification({
        type: "error",
        message: `Backup failed: ${type}`,
        details: {
          backupType: type,
          timestamp: new Date(),
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  private async backupDatabase(outputPath: string): Promise<number> {
    const dumpStream =
      await prisma.$queryRaw`pg_dump $${process.env.DATABASE_URL}`;
    return this.processBackupStream(dumpStream, outputPath);
  }

  private async backupFiles(outputPath: string): Promise<number> {
    // Implementation for file backup
    const { tar } = await import("tar");
    const { include } = backupConfig.schedules.files;

    await tar.create(
      {
        gzip: backupConfig.compression,
        file: outputPath,
        cwd: process.cwd(),
      },
      include,
    );

    return (await import("fs")).statSync(outputPath).size;
  }

  private async backupConfigs(outputPath: string): Promise<number> {
    const { tar } = await import("tar");
    const { include } = backupConfig.schedules.configs;

    await tar.create(
      {
        gzip: backupConfig.compression,
        file: outputPath,
        cwd: process.cwd(),
      },
      include,
    );

    return (await import("fs")).statSync(outputPath).size;
  }

  private async processBackupStream(
    inputStream: NodeJS.ReadableStream,
    outputPath: string,
  ): Promise<number> {
    const gzip = createGzip();
    const output = createWriteStream(outputPath);
    let size = 0;

    if (backupConfig.encryption) {
      const iv = randomBytes(16);
      const cipher = createCipheriv("aes-256-gcm", this.encryptionKey, iv);

      // Prepend IV to the output file
      output.write(iv);

      await pipeline(inputStream, gzip, cipher, output);
    } else {
      await pipeline(inputStream, gzip, output);
    }

    size = (await import("fs")).statSync(outputPath).size;
    return size;
  }

  private async uploadToS3(filePath: string, fileName: string): Promise<void> {
    if (!this.s3Client) {
      throw new Error("S3 client not initialized");
    }

    const fileStream = createReadStream(filePath);
    const command = new PutObjectCommand({
      Bucket: backupConfig.storage.s3.bucket,
      Key: `${backupConfig.storage.s3.prefix}/${fileName}`,
      Body: fileStream,
    });

    await this.s3Client.send(command);
  }

  private async cleanupOldBackups(type: BackupType): Promise<void> {
    const maxBackups = backupConfig.schedules[type].maxBackups;
    const typePattern = new RegExp(`^${type}-.*\\.tar\\.gz$`);

    const files = await readdir(backupConfig.backupDir);
    const typeFiles = files
      .filter((file) => typePattern.test(file))
      .map((file) => ({
        name: file,
        path: path.join(backupConfig.backupDir, file),
        time: (async () => {
          const stats = await import("fs/promises").then((fs) =>
            fs.stat(path.join(backupConfig.backupDir, file)),
          );
          return stats.mtime.getTime();
        })(),
      }));

    // Sort by time descending
    const sortedFiles = await Promise.all(typeFiles);
    sortedFiles.sort((a, b) => b.time - a.time);

    // Remove excess backups
    for (const file of sortedFiles.slice(maxBackups)) {
      await unlink(file.path);
    }
  }

  private generateBackupFileName(type: BackupType, timestamp: Date): string {
    const dateStr = timestamp
      .toISOString()
      .replace(/[:.]/g, "-")
      .replace("T", "_")
      .slice(0, -5);
    return `${type}-${dateStr}.tar.gz`;
  }

  private async sendNotification(
    notification: BackupNotification,
  ): Promise<void> {
    try {
      // Send email notification if enabled
      if (backupConfig.notifications.email.enabled) {
        // Implementation for email notification
        // You would typically use a service like nodemailer here
      }

      // Send Slack notification if enabled
      if (backupConfig.notifications.slack.enabled) {
        const { webhook, channel } = backupConfig.notifications.slack;
        await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel,
            text: notification.message,
            attachments: [
              {
                color: notification.type === "success" ? "good" : "danger",
                fields: Object.entries(notification.details).map(
                  ([key, value]) => ({
                    title: key,
                    value: String(value),
                    short: true,
                  }),
                ),
              },
            ],
          }),
        });
      }
    } catch (error) {
      logger.error("Failed to send backup notification:", error);
    }
  }
}
