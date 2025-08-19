// Data compressor utilities consolidated and cleaned
// Removed unused imports and commented code

import * as pako from 'pako';

interface ArchiveMetadata {
  timestamp: number;
  dataType: string;
}

interface Archive {
  key: string;
  metadata: ArchiveMetadata;
}

export class DataCompressor {
  private static instance: DataCompressor;
  private archives: Map<
    string,
    { data: Uint8Array; metadata: ArchiveMetadata }
  > = new Map();

  private constructor() {}

  static getInstance(): DataCompressor {
    if (!DataCompressor.instance) {
      DataCompressor.instance = new DataCompressor();
    }
    return DataCompressor.instance;
  }

  async compressData(data: any): Promise<Uint8Array> {
    const jsonString = JSON.stringify(data);
    return pako.deflate(jsonString);
  }

  async decompressData(compressedData: Uint8Array): Promise<any> {
    const jsonString = pako.inflate(compressedData, { to: 'string' });
    return JSON.parse(jsonString);
  }

  async archiveData(
    key: string,
    data: { data: any; metadata: ArchiveMetadata }
  ): Promise<void> {
    const compressedData = await this.compressData(data.data);
    this.archives.set(key, { data: compressedData, metadata: data.metadata });
  }

  async retrieveArchive(
    key: string
  ): Promise<{ data: any; metadata: ArchiveMetadata } | null> {
    const archive = this.archives.get(key);
    if (!archive) return null;
    const data = await this.decompressData(archive.data);
    return { data, metadata: archive.metadata };
  }

  listArchives(): Archive[] {
    return Array.from(this.archives.entries()).map(([key, value]) => ({
      key,
      metadata: value.metadata,
    }));
  }

  getArchiveStats(): {
    totalSize: number;
    oldestDate: Date;
    compressionRatio: number;
  } {
    const totalSize = 0;
    let oldestDate = new Date();
    let originalSize = 0;
    let compressedSize = 0;

    Array.from(this.archives).forEach(([_, archive]) => {
      compressedSize += archive.data.length;
      originalSize += JSON.stringify(archive.metadata).length; // Approximation
      if (archive.metadata.timestamp < oldestDate.getTime()) {
        oldestDate = new Date(archive.metadata.timestamp);
      }
    });

    return {
      totalSize: compressedSize,
      oldestDate,
      compressionRatio: originalSize === 0 ? 1 : originalSize / compressedSize,
    };
  }

  shouldArchive(dataSize: number): boolean {
    const totalSize = Array.from(this.archives.values()).reduce(
      (sum, archive) => sum + archive.data.length,
      0
    );
    return totalSize + dataSize <= 100000000; // MAX_ARCHIVE_SIZE default value
  }
}
