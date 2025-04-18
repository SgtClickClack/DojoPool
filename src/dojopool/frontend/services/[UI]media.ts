import stateService from "./state";
import analyticsService from "./analytics";
import apiService from "./api";
import storageService from "./storage";

interface MediaFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
  uploadedAt: string;
  userId: string;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  generateThumbnail?: boolean;
  thumbnailSize?: { width: number; height: number };
  metadata?: Record<string, any>;
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (file: MediaFile) => void;
  onError?: (error: Error) => void;
}

class MediaService {
  private uploadQueue: Map<
    string,
    {
      file: File;
      options: UploadOptions;
      controller: AbortController;
    }
  > = new Map();

  private readonly DEFAULT_OPTIONS: UploadOptions = {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["image/*", "video/*", "audio/*"],
    generateThumbnail: true,
    thumbnailSize: { width: 200, height: 200 },
  };

  constructor() {
    this.setupOfflineSync();
  }

  private setupOfflineSync(): void {
    window.addEventListener("online", () => {
      this.syncOfflineUploads();
    });
  }

  public async upload(
    file: File,
    options: UploadOptions = {},
  ): Promise<MediaFile> {
    const fullOptions = { ...this.DEFAULT_OPTIONS, ...options };

    // Validate file
    this.validateFile(file, fullOptions);

    // Generate upload ID
    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create abort controller
    const controller = new AbortController();

    // Add to queue
    this.uploadQueue.set(uploadId, { file, options: fullOptions, controller });

    try {
      // Track upload start
      analyticsService.trackUserEvent({
        type: "media_upload_started",
        userId: "system",
        details: {
          uploadId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          timestamp: new Date().toISOString(),
        },
      });

      // Process file
      const processedFile = await this.processFile(file, fullOptions);

      // Check if we're online
      if (!navigator.onLine) {
        return await this.handleOfflineUpload(
          uploadId,
          processedFile,
          fullOptions,
        );
      }

      // Create form data
      const formData = new FormData();
      formData.append("file", processedFile);
      if (fullOptions.metadata) {
        formData.append("metadata", JSON.stringify(fullOptions.metadata));
      }

      // Upload file
      const response = await apiService.post("/api/media/upload", formData, {
        signal: controller.signal,
        onUploadProgress: (progressEvent) => {
          if (fullOptions.onProgress) {
            const progress: UploadProgress = {
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              ),
            };
            fullOptions.onProgress(progress);
          }
        },
      });

      const mediaFile: MediaFile = response.data;

      // Track upload success
      analyticsService.trackUserEvent({
        type: "media_upload_completed",
        userId: "system",
        details: {
          uploadId,
          mediaId: mediaFile.id,
          timestamp: new Date().toISOString(),
        },
      });

      // Call success callback
      fullOptions.onSuccess?.(mediaFile);

      return mediaFile;
    } catch (error) {
      // Track upload error
      analyticsService.trackUserEvent({
        type: "media_upload_failed",
        userId: "system",
        details: {
          uploadId,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      });

      // Call error callback
      fullOptions.onError?.(error);

      throw error;
    } finally {
      // Remove from queue
      this.uploadQueue.delete(uploadId);
    }
  }

  private validateFile(file: File, options: UploadOptions): void {
    // Check file size
    if (options.maxSize && file.size > options.maxSize) {
      throw new Error(
        `File size exceeds maximum allowed size of ${options.maxSize} bytes`,
      );
    }

    // Check file type
    if (options.allowedTypes && options.allowedTypes.length > 0) {
      const isAllowed = options.allowedTypes.some((type) => {
        if (type.endsWith("/*")) {
          return file.type.startsWith(type.slice(0, -2));
        }
        return file.type === type;
      });

      if (!isAllowed) {
        throw new Error(`File type ${file.type} is not allowed`);
      }
    }
  }

  private async processFile(file: File, options: UploadOptions): Promise<File> {
    if (!options.generateThumbnail || !file.type.startsWith("image/")) {
      return file;
    }

    try {
      const thumbnail = await this.generateThumbnail(
        file,
        options.thumbnailSize!,
      );
      const processedFile = new File([file], file.name, {
        type: file.type,
        lastModified: file.lastModified,
      });
      Object.defineProperty(processedFile, "thumbnail", {
        value: thumbnail,
        writable: false,
      });
      return processedFile;
    } catch (error) {
      console.warn("Failed to generate thumbnail:", error);
      return file;
    }
  }

  private async generateThumbnail(
    file: File,
    size: { width: number; height: number },
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d")!;

          // Calculate thumbnail dimensions
          const ratio = Math.min(
            size.width / img.width,
            size.height / img.height,
          );
          const width = img.width * ratio;
          const height = img.height * ratio;

          canvas.width = width;
          canvas.height = height;

          // Draw thumbnail
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to data URL
          resolve(canvas.toDataURL(file.type));
        };
        img.onerror = reject;
        img.src = e.target!.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private async handleOfflineUpload(
    uploadId: string,
    file: File,
    options: UploadOptions,
  ): Promise<MediaFile> {
    // Create temporary media file
    const mediaFile: MediaFile = {
      id: uploadId,
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
      userId: "system",
      metadata: options.metadata,
    };

    // Store file for later upload
    await storageService.cacheResponse(`media:${uploadId}`, {
      file: await this.fileToBase64(file),
      options,
      mediaFile,
    });

    return mediaFile;
  }

  private async syncOfflineUploads(): Promise<void> {
    const offlineUploads = await storageService.getCachedResponses("media:*");
    for (const [key, data] of Object.entries(offlineUploads)) {
      try {
        const file = await this.base64ToFile(data.file, data.mediaFile.name);
        const mediaFile = await this.upload(file, data.options);
        await storageService.removeOfflineAction(key);

        // Track sync success
        analyticsService.trackUserEvent({
          type: "media_sync_completed",
          userId: "system",
          details: {
            uploadId: key,
            mediaId: mediaFile.id,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.error(`Failed to sync offline upload ${key}:`, error);

        // Track sync error
        analyticsService.trackUserEvent({
          type: "media_sync_failed",
          userId: "system",
          details: {
            uploadId: key,
            error: error.message,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private async base64ToFile(base64: string, filename: string): Promise<File> {
    const res = await fetch(base64);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
  }

  public cancelUpload(uploadId: string): void {
    const upload = this.uploadQueue.get(uploadId);
    if (upload) {
      upload.controller.abort();
      this.uploadQueue.delete(uploadId);

      // Track upload cancellation
      analyticsService.trackUserEvent({
        type: "media_upload_cancelled",
        userId: "system",
        details: {
          uploadId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  public cancelAllUploads(): void {
    this.uploadQueue.forEach((upload, uploadId) => {
      this.cancelUpload(uploadId);
    });
  }

  public getUploadQueue(): string[] {
    return Array.from(this.uploadQueue.keys());
  }

  public async delete(mediaId: string): Promise<void> {
    try {
      await apiService.delete(`/api/media/${mediaId}`);

      // Track media deletion
      analyticsService.trackUserEvent({
        type: "media_deleted",
        userId: "system",
        details: {
          mediaId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error(`Failed to delete media ${mediaId}:`, error);
      throw error;
    }
  }

  public async getMediaInfo(mediaId: string): Promise<MediaFile> {
    try {
      const response = await apiService.get(`/api/media/${mediaId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get media info for ${mediaId}:`, error);
      throw error;
    }
  }

  public async updateMetadata(
    mediaId: string,
    metadata: Record<string, any>,
  ): Promise<MediaFile> {
    try {
      const response = await apiService.patch(
        `/api/media/${mediaId}/metadata`,
        metadata,
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to update metadata for ${mediaId}:`, error);
      throw error;
    }
  }
}

// Create a singleton instance
const mediaService = new MediaService();

export default mediaService;
