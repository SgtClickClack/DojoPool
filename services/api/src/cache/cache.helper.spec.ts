import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheHelper } from './cache.helper';
import { CacheService } from './cache.service';

describe('CacheHelper', () => {
  let cacheHelper: CacheHelper;
  let cacheService: CacheService;
  let mockCacheService: any;

  beforeEach(async () => {
    mockCacheService = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      deleteByPattern: vi.fn(),
      exists: vi.fn(),
      clear: vi.fn(),
      ping: vi.fn(),
      getStats: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheHelper,
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn(),
          },
        },
      ],
    }).compile();

    cacheHelper = module.get<CacheHelper>(CacheHelper);
    cacheService = module.get<CacheService>(CacheService);

    // Ensure the mock is properly injected
    (cacheHelper as any).cacheService = mockCacheService;
  });

  describe('writeThrough', () => {
    it('should execute write operation and cache result', async () => {
      const mockData = { id: '1', name: 'Test' };
      const mockWriteOperation = vi.fn().mockResolvedValue(mockData);
      const options = {
        key: 'test:key',
        data: mockData,
        writeOperation: mockWriteOperation,
      };

      mockCacheService.set.mockResolvedValue(true);

      const result = await cacheHelper.writeThrough(options);

      expect(mockWriteOperation).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'test:key',
        mockData,
        {}
      );
      expect(result).toEqual(mockData);
    });

    it('should invalidate patterns when specified', async () => {
      const mockData = { id: '1', name: 'Test' };
      const mockWriteOperation = vi.fn().mockResolvedValue(mockData);
      const options = {
        key: 'test:key',
        data: mockData,
        cacheOptions: {
          invalidatePatterns: ['pattern1', 'pattern2'],
        },
        writeOperation: mockWriteOperation,
      };

      mockCacheService.set.mockResolvedValue(true);
      mockCacheService.deleteByPattern.mockResolvedValue(2);

      await cacheHelper.writeThrough(options);

      expect(mockCacheService.deleteByPattern).toHaveBeenCalledWith('pattern1');
      expect(mockCacheService.deleteByPattern).toHaveBeenCalledWith('pattern2');
    });
  });

  describe('readWithCache', () => {
    it('should return cached data when available', async () => {
      const cachedData = { id: '1', name: 'Cached' };
      const mockFetchOperation = vi.fn();

      mockCacheService.get.mockResolvedValue(cachedData);

      const result = await cacheHelper.readWithCache(
        'test:key',
        mockFetchOperation
      );

      expect(result).toEqual(cachedData);
      expect(mockFetchOperation).not.toHaveBeenCalled();
    });

    it('should fetch and cache data when not in cache', async () => {
      const fetchedData = { id: '1', name: 'Fetched' };
      const mockFetchOperation = vi.fn().mockResolvedValue(fetchedData);

      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.set.mockResolvedValue(true);

      const result = await cacheHelper.readWithCache(
        'test:key',
        mockFetchOperation
      );

      expect(result).toEqual(fetchedData);
      expect(mockFetchOperation).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'test:key',
        fetchedData,
        {}
      );
    });
  });

  describe('invalidatePatterns', () => {
    it('should invalidate multiple patterns', async () => {
      const patterns = ['pattern1', 'pattern2', 'pattern3'];
      mockCacheService.deleteByPattern.mockResolvedValue(1);

      await cacheHelper.invalidatePatterns(patterns);

      expect(mockCacheService.deleteByPattern).toHaveBeenCalledTimes(3);
      patterns.forEach((pattern) => {
        expect(mockCacheService.deleteByPattern).toHaveBeenCalledWith(pattern);
      });
    });
  });

  describe('batchGet', () => {
    it('should return cached results for multiple keys', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const cachedData = {
        key1: { id: '1', name: 'Item 1' },
        key2: { id: '2', name: 'Item 2' },
        key3: null, // Not in cache
      };

      mockCacheService.get
        .mockResolvedValueOnce(cachedData['key1'])
        .mockResolvedValueOnce(cachedData['key2'])
        .mockResolvedValueOnce(null);

      const result = await cacheHelper.batchGet(keys);

      expect(result.size).toBe(2);
      expect(result.get('key1')).toEqual(cachedData['key1']);
      expect(result.get('key2')).toEqual(cachedData['key2']);
      expect(result.has('key3')).toBe(false);
    });
  });

  describe('batchSet', () => {
    it('should set multiple cache entries', async () => {
      const entries = [
        { key: 'key1', data: { id: '1' }, options: { ttl: 300 } },
        { key: 'key2', data: { id: '2' }, options: { ttl: 600 } },
      ];

      mockCacheService.set.mockResolvedValue(true);

      await cacheHelper.batchSet(entries);

      expect(mockCacheService.set).toHaveBeenCalledTimes(2);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'key1',
        { id: '1' },
        { ttl: 300 }
      );
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'key2',
        { id: '2' },
        { ttl: 600 }
      );
    });
  });

  describe('static methods', () => {
    describe('generateKey', () => {
      it('should generate valid cache keys', () => {
        expect(CacheHelper.generateKey('test', 'key')).toBe('test:key');
        expect(CacheHelper.generateKey('user', 123, 'profile')).toBe(
          'user:123:profile'
        );
        expect(CacheHelper.generateKey('special@chars!')).toBe(
          'special_chars_'
        );
      });
    });

    describe('generateApiKey', () => {
      it('should generate API cache keys', () => {
        expect(
          CacheHelper.generateApiKey('TournamentsController', 'getAll')
        ).toBe('TournamentsController:getAll');
        expect(
          CacheHelper.generateApiKey('UsersController', 'getById', {
            id: '123',
          })
        ).toBe('UsersController:getById:__id___123__');
      });
    });

    describe('generateUserKey', () => {
      it('should generate user-specific cache keys', () => {
        expect(CacheHelper.generateUserKey('user123', 'profile')).toBe(
          'user:user123:profile'
        );
        expect(
          CacheHelper.generateUserKey('user123', 'tournaments', {
            status: 'active',
          })
        ).toBe('user:user123:tournaments:__status___active__');
      });
    });

    describe('generateVenueKey', () => {
      it('should generate venue-specific cache keys', () => {
        expect(CacheHelper.generateVenueKey('venue456', 'tournaments')).toBe(
          'venue:venue456:tournaments'
        );
        expect(
          CacheHelper.generateVenueKey('venue456', 'players', { active: true })
        ).toBe('venue:venue456:players:__active__true_');
      });
    });
  });

  describe('healthCheck', () => {
    it('should return true when cache is healthy', async () => {
      mockCacheService.ping.mockResolvedValue(true);

      const result = await cacheHelper.healthCheck();

      expect(result).toBe(true);
    });

    it('should return false when cache is unhealthy', async () => {
      mockCacheService.ping.mockResolvedValue(false);

      const result = await cacheHelper.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      const mockStats = {
        connected: true,
        keys: 100,
        memory: 'memory info',
      };

      mockCacheService.getStats.mockResolvedValue(mockStats);

      const result = await cacheHelper.getStats();

      expect(result).toEqual(mockStats);
    });
  });
});
