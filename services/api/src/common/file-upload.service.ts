import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface UploadedFile {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  path: string;
}

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly uploadDir: string;
  private readonly maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private readonly allowedMimeTypes: string[] = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'application/pdf',
    'text/plain',
  ];

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    this.ensureUploadDirectoryExists();
  }

  private ensureUploadDirectoryExists(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadDir}`);
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: Express.Multer.File): void {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize / (1024 * 1024)}MB`
      );
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`
      );
    }
  }

  /**
   * Generate unique filename
   */
  private generateFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
    return `${sanitizedBaseName}_${uuidv4()}${ext}`;
  }

  /**
   * Upload a single file
   */
  async uploadFile(file: Express.Multer.File): Promise<UploadedFile> {
    try {
      this.validateFile(file);

      const filename = this.generateFilename(file.originalname);
      const filePath = path.join(this.uploadDir, filename);
      const baseUrl = this.configService.get<string>(
        'BASE_URL',
        'http://localhost:3002'
      );

      // Write file to disk
      fs.writeFileSync(filePath, file.buffer);

      const uploadedFile: UploadedFile = {
        filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `${baseUrl}/uploads/${filename}`,
        path: filePath,
      };

      this.logger.log(`File uploaded successfully: ${uploadedFile.filename}`);
      return uploadedFile;
    } catch (error) {
      this.logger.error(`File upload failed: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('File upload failed');
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(files: Express.Multer.File[]): Promise<UploadedFile[]> {
    if (files.length > 5) {
      throw new BadRequestException('Maximum 5 files allowed');
    }

    const uploadPromises = files.map((file) => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file
   */
  async deleteFile(filename: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadDir, filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`File deleted: ${filename}`);
      } else {
        this.logger.warn(`File not found for deletion: ${filename}`);
      }
    } catch (error) {
      this.logger.error(`File deletion failed: ${error.message}`);
      throw new InternalServerErrorException('File deletion failed');
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(filename: string): Promise<UploadedFile | null> {
    try {
      const filePath = path.join(this.uploadDir, filename);

      if (!fs.existsSync(filePath)) {
        return null;
      }

      const stats = fs.statSync(filePath);
      const baseUrl = this.configService.get<string>(
        'BASE_URL',
        'http://localhost:3002'
      );

      return {
        filename,
        originalName: filename,
        mimetype: 'application/octet-stream', // Default MIME type
        size: stats.size,
        url: `${baseUrl}/uploads/${filename}`,
        path: filePath,
      };
    } catch (error) {
      this.logger.error(`Get file info failed: ${error.message}`);
      return null;
    }
  }
}
