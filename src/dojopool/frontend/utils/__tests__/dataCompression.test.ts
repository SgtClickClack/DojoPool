import { DataCompressor } from '../dataCompression';

describe('DataCompressor', () => {
  let dataCompressor: DataCompressor;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => mockLocalStorage[key] || null),
        setItem: jest.fn((key, value) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: jest.fn((key) => {
          delete mockLocalStorage[key];
        }),
        clear: jest.fn(() => {
          mockLocalStorage = {};
        }),
        length: 0,
        key: jest.fn((index) => Object.keys(mockLocalStorage)[index]),
      },
      writable: true,
    });

    // Reset singleton instance
    (DataCompressor as any).instance = null;
    dataCompressor = DataCompressor.getInstance({
      compressionLevel: 6,
      chunkSize: 100,
      archiveThreshold: 30,
    });
  });

  describe('data compression', () => {
    it('should compress and decompress data correctly', async () => {
      const testData = {
        id: 1,
        name: 'Test',
        description: 'A long description that should be compressed',
      };

      const { compressed, metadata } = await dataCompressor.compressData(testData, 'test');

      expect(compressed).toBeInstanceOf(Array);
      expect(metadata).toMatchObject({
        dataType: 'test',
        recordCount: 1,
      });

      const decompressed = await dataCompressor.decompressData(compressed, metadata);

      expect(decompressed).toEqual(testData);
    });

    it('should handle large datasets with chunking', async () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        data: 'Some repeated content to make the dataset larger',
      }));

      const { compressed, metadata } = await dataCompressor.compressData(largeData, 'large_test');

      expect(compressed.length).toBeGreaterThan(1);
      expect(metadata.recordCount).toBe(1000);

      const decompressed = await dataCompressor.decompressData(compressed, metadata);

      expect(decompressed).toEqual(largeData);
    });

    it('should detect data corruption', async () => {
      const testData = { id: 1, name: 'Test' };
      const { compressed, metadata } = await dataCompressor.compressData(testData, 'test');

      // Corrupt the data
      compressed[0].data[0] = 255 - compressed[0].data[0];

      await expect(dataCompressor.decompressData(compressed, metadata)).rejects.toThrow(
        'Checksum mismatch'
      );
    });
  });

  describe('archiving', () => {
    it('should archive and retrieve data', async () => {
      const testData = { id: 1, name: 'Test' };
      const { archiveKey } = await dataCompressor.archiveData(testData, 'test');

      const retrieved = await dataCompressor.retrieveArchive(archiveKey);
      expect(retrieved).toEqual(testData);
    });

    it('should handle storage quota exceeded', async () => {
      // Mock quota exceeded error
      const mockSetItem = jest.spyOn(localStorage, 'setItem');
      mockSetItem.mockImplementationOnce(() => {
        const error = new Error('Quota exceeded');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const testData = { id: 1, name: 'Test' };
      await expect(dataCompressor.archiveData(testData, 'test')).rejects.toThrow(
        'Storage quota exceeded'
      );

      expect(localStorage.removeItem).toHaveBeenCalled();
    });

    it('should determine if data should be archived based on age', () => {
      const now = Date.now();
      const oldTimestamp = now - 31 * 24 * 60 * 60 * 1000; // 31 days old
      const recentTimestamp = now - 29 * 24 * 60 * 60 * 1000; // 29 days old

      expect(dataCompressor.shouldArchive(oldTimestamp)).toBe(true);
      expect(dataCompressor.shouldArchive(recentTimestamp)).toBe(false);
    });
  });

  describe('archive management', () => {
    beforeEach(() => {
      // Add some test archives
      mockLocalStorage = {
        test_1: JSON.stringify({
          chunks: [],
          metadata: {
            timestamp: Date.now() - 1000,
            originalSize: 100,
            compressedSize: 50,
            recordCount: 1,
            dataType: 'test',
            checksum: '123',
          },
        }),
        test_2: JSON.stringify({
          chunks: [],
          metadata: {
            timestamp: Date.now() - 2000,
            originalSize: 200,
            compressedSize: 100,
            recordCount: 2,
            dataType: 'test',
            checksum: '456',
          },
        }),
      };
      Object.defineProperty(localStorage, 'length', {
        value: Object.keys(mockLocalStorage).length,
      });
    });

    it('should list all archives', () => {
      const archives = dataCompressor.listArchives();
      expect(archives).toHaveLength(2);
      expect(archives[0].metadata.recordCount).toBe(1);
      expect(archives[1].metadata.recordCount).toBe(2);
    });

    it('should calculate archive statistics', () => {
      const stats = dataCompressor.getArchiveStats();
      expect(stats.totalSize).toBe(150); // 50 + 100
      expect(stats.compressionRatio).toBe(2); // (100 + 200) / (50 + 100)
      expect(stats.archiveCount).toBe(2);
    });

    it('should handle invalid archive data', () => {
      mockLocalStorage['invalid'] = 'not json';
      const archives = dataCompressor.listArchives();
      expect(archives).toHaveLength(2); // Should skip invalid entry
    });

    it('should throw error when retrieving non-existent archive', async () => {
      await expect(dataCompressor.retrieveArchive('non_existent')).rejects.toThrow(
        'Archive not found'
      );
    });
  });
});
