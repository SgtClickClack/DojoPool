import { deflate, inflate } from 'pako';

interface CompressionConfig {
  compressionLevel: number; // 1-9, where 9 is max compression
  chunkSize: number; // Size in bytes for chunking large datasets
  archiveThreshold: number; // Age in days for archiving
}

interface ArchiveMetadata {
  timestamp: number;
  originalSize: number;
  compressedSize: number;
  recordCount: number;
  dataType: string;
  checksum: string;
}

interface CompressedChunk {
  data: Uint8Array;
  checksum: string;
  index: number;
}

const DEFAULT_COMPRESSION_CONFIG: CompressionConfig = {
  compressionLevel: 6,
  chunkSize: 1024 * 1024, // 1MB
  archiveThreshold: 30, // 30 days
};

export class DataCompressor {
  private static instance: DataCompressor;
  private config: CompressionConfig;

  private constructor(config: Partial<CompressionConfig> = {}) {
    this.config = { ...DEFAULT_COMPRESSION_CONFIG, ...config };
  }

  static getInstance(config?: Partial<CompressionConfig>): DataCompressor {
    if (!DataCompressor.instance) {
      DataCompressor.instance = new DataCompressor(config);
    }
    return DataCompressor.instance;
  }

  private calculateChecksum(data: Uint8Array): string {
    return Array.from(data)
      .reduce((sum, byte) => sum + byte, 0)
      .toString(16);
  }

  private async compressChunk(data: string, index: number): Promise<CompressedChunk> {
    const compressedData = deflate(data, {
      level: this.config.compressionLevel,
    });

    return {
      data: compressedData,
      checksum: this.calculateChecksum(compressedData),
      index,
    };
  }

  private async decompressChunk(chunk: CompressedChunk): Promise<string> {
    const verifyChecksum = this.calculateChecksum(chunk.data);
    if (verifyChecksum !== chunk.checksum) {
      throw new Error(`Checksum mismatch for chunk ${chunk.index}`);
    }

    const decompressedData = inflate(chunk.data, { to: 'string' });
    return decompressedData;
  }

  async compressData(
    data: any,
    dataType: string
  ): Promise<{ compressed: CompressedChunk[]; metadata: ArchiveMetadata }> {
    const jsonString = JSON.stringify(data);
    const originalSize = new TextEncoder().encode(jsonString).length;

    // Split into chunks if necessary
    const chunks: string[] = [];
    for (let i = 0; i < jsonString.length; i += this.config.chunkSize) {
      chunks.push(jsonString.slice(i, i + this.config.chunkSize));
    }

    // Compress each chunk
    const compressedChunks = await Promise.all(
      chunks.map((chunk, index) => this.compressChunk(chunk, index))
    );

    const compressedSize = compressedChunks.reduce((size, chunk) => size + chunk.data.length, 0);

    const metadata: ArchiveMetadata = {
      timestamp: Date.now(),
      originalSize,
      compressedSize,
      recordCount: Array.isArray(data) ? data.length : 1,
      dataType,
      checksum: this.calculateChecksum(new TextEncoder().encode(jsonString)),
    };

    return {
      compressed: compressedChunks,
      metadata,
    };
  }

  async decompressData<T>(chunks: CompressedChunk[], metadata: ArchiveMetadata): Promise<T> {
    // Sort chunks by index
    const sortedChunks = [...chunks].sort((a, b) => a.index - b.index);

    // Decompress all chunks
    const decompressedChunks = await Promise.all(
      sortedChunks.map((chunk) => this.decompressChunk(chunk))
    );

    // Combine chunks
    const jsonString = decompressedChunks.join('');

    // Verify checksum
    const verifyChecksum = this.calculateChecksum(new TextEncoder().encode(jsonString));
    if (verifyChecksum !== metadata.checksum) {
      throw new Error('Data integrity check failed');
    }

    return JSON.parse(jsonString);
  }

  shouldArchive(timestamp: number): boolean {
    const ageInDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
    return ageInDays >= this.config.archiveThreshold;
  }

  async archiveData(
    data: any,
    dataType: string
  ): Promise<{ archiveKey: string; metadata: ArchiveMetadata }> {
    const { compressed, metadata } = await this.compressData(data, dataType);
    const archiveKey = `${dataType}_${metadata.timestamp}`;

    // Store compressed data and metadata
    try {
      const archiveData = {
        chunks: compressed,
        metadata,
      };

      localStorage.setItem(archiveKey, JSON.stringify(archiveData));

      return { archiveKey, metadata };
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        // Handle storage quota exceeded
        this.handleStorageQuotaExceeded();
        throw new Error('Storage quota exceeded while archiving data');
      }
      throw error;
    }
  }

  async retrieveArchive<T>(archiveKey: string): Promise<T> {
    const archiveData = localStorage.getItem(archiveKey);
    if (!archiveData) {
      throw new Error(`Archive not found: ${archiveKey}`);
    }

    const { chunks, metadata } = JSON.parse(archiveData);
    return this.decompressData<T>(chunks, metadata);
  }

  private handleStorageQuotaExceeded(): void {
    // Find and remove oldest archives until we have space
    const archives = this.listArchives();
    archives.sort((a, b) => a.metadata.timestamp - b.metadata.timestamp);

    for (const archive of archives) {
      try {
        localStorage.removeItem(archive.key);
        // Try to store a small test item to see if we have space
        localStorage.setItem('test', '1');
        localStorage.removeItem('test');
        break;
      } catch (error) {
        // Continue removing if still out of space
        continue;
      }
    }
  }

  listArchives(): Array<{ key: string; metadata: ArchiveMetadata }> {
    const archives: Array<{ key: string; metadata: ArchiveMetadata }> = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      try {
        const archiveData = JSON.parse(localStorage.getItem(key) || '');
        if (archiveData.metadata) {
          archives.push({
            key,
            metadata: archiveData.metadata,
          });
        }
      } catch {
        // Skip invalid entries
        continue;
      }
    }

    return archives;
  }

  getArchiveStats(): {
    totalSize: number;
    compressionRatio: number;
    archiveCount: number;
  } {
    const archives = this.listArchives();
    const totalOriginalSize = archives.reduce(
      (sum, archive) => sum + archive.metadata.originalSize,
      0
    );
    const totalCompressedSize = archives.reduce(
      (sum, archive) => sum + archive.metadata.compressedSize,
      0
    );

    return {
      totalSize: totalCompressedSize,
      compressionRatio: totalOriginalSize / totalCompressedSize,
      archiveCount: archives.length,
    };
  }
}
