import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { ErrorLogEntry, ErrorLoggerService } from './error-logger.service';

describe('ErrorLoggerService', () => {
  let service: ErrorLoggerService;
  let configService: vi.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockConfigService = {
      get: vi.fn(),
    } as unknown as ConfigService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ErrorLoggerService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ErrorLoggerService>(ErrorLoggerService);
    configService = module.get(ConfigService);
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with empty metrics', () => {
      const metrics = service.getMetrics();
      expect(metrics.totalErrors).toBe(0);
      expect(metrics.errorsByLevel).toEqual({});
      expect(metrics.errorsByCode).toEqual({});
      expect(metrics.errorsByPath).toEqual({});
      expect(metrics.recentErrors).toEqual([]);
      expect(metrics.topErrorMessages).toEqual([]);
    });
  });

  describe('Error Logging', () => {
    const mockErrorEntry: ErrorLogEntry = {
      level: 'error',
      message: 'Test error message',
      error: new Error('Test error'),
      context: {
        userId: 'user123',
        requestId: 'req456',
      },
      tags: {
        status: '500',
        method: 'GET',
        path: '/api/test',
        errorCode: '500',
      },
    };

    it('should log error successfully', () => {
      // Mock config for development environment
      configService.get.mockReturnValue('development');

      // Act
      service.logError(mockErrorEntry);

      // Assert
      const metrics = service.getMetrics();
      expect(metrics.totalErrors).toBe(1);
      expect(metrics.errorsByLevel.error).toBe(1);
      expect(metrics.errorsByCode['500']).toBe(1);
      expect(metrics.errorsByPath['/api/test']).toBe(1);
      expect(metrics.recentErrors).toHaveLength(1);
      expect(metrics.recentErrors[0]).toMatchObject({
        level: 'error',
        message: 'Test error message',
        context: expect.objectContaining({
          userId: 'user123',
          requestId: 'req456',
        }),
      });
    });

    it('should update top error messages', () => {
      // Mock config
      configService.get.mockReturnValue('development');

      // Log multiple errors
      service.logError({ ...mockErrorEntry, message: 'Error A' });
      service.logError({ ...mockErrorEntry, message: 'Error B' });
      service.logError({ ...mockErrorEntry, message: 'Error A' }); // Duplicate

      const metrics = service.getMetrics();
      expect(metrics.topErrorMessages).toHaveLength(2);
      expect(metrics.topErrorMessages[0]).toEqual({
        message: 'Error A',
        count: 2,
      });
      expect(metrics.topErrorMessages[1]).toEqual({
        message: 'Error B',
        count: 1,
      });
    });

    it('should limit recent errors to 100', () => {
      // Mock config
      configService.get.mockReturnValue('development');

      // Log 101 errors
      for (let i = 0; i < 101; i++) {
        service.logError({
          ...mockErrorEntry,
          message: `Error ${i}`,
        });
      }

      const metrics = service.getMetrics();
      expect(metrics.recentErrors).toHaveLength(100);
      expect(metrics.totalErrors).toBe(101);
    });

    it('should provide convenience logging methods', () => {
      // Mock config
      configService.get.mockReturnValue('development');

      // Test different log levels
      service.logInfo('Info message');
      service.logWarn('Warning message');
      service.logDebug('Debug message');

      const metrics = service.getMetrics();
      expect(metrics.totalErrors).toBe(3);
      expect(metrics.errorsByLevel.info).toBe(1);
      expect(metrics.errorsByLevel.warn).toBe(1);
      expect(metrics.errorsByLevel.debug).toBe(1);
    });
  });

  describe('Metrics and Analytics', () => {
    beforeEach(() => {
      configService.get.mockReturnValue('development');
    });

    it('should return recent errors with limit', () => {
      // Log some errors
      for (let i = 0; i < 5; i++) {
        service.logError({
          level: 'error',
          message: `Error ${i}`,
        });
      }

      const recentErrors = service.getRecentErrors(3);
      expect(recentErrors).toHaveLength(3);
    });

    it('should filter errors by level', () => {
      // Log errors of different levels
      service.logError({ level: 'error', message: 'Error 1' });
      service.logError({ level: 'warn', message: 'Warning 1' });
      service.logError({ level: 'info', message: 'Info 1' });
      service.logError({ level: 'error', message: 'Error 2' });

      const errorErrors = service.getErrorsByLevel('error');
      const warnErrors = service.getErrorsByLevel('warn');

      expect(errorErrors).toHaveLength(2);
      expect(warnErrors).toHaveLength(1);
    });

    it('should filter errors by path', () => {
      // Log errors with different paths
      service.logError({
        level: 'error',
        message: 'Error 1',
        tags: { path: '/api/users' },
      });
      service.logError({
        level: 'error',
        message: 'Error 2',
        tags: { path: '/api/games' },
      });
      service.logError({
        level: 'error',
        message: 'Error 3',
        tags: { path: '/api/users' },
      });

      const userErrors = service.getErrorsByPath('/api/users');
      const gameErrors = service.getErrorsByPath('/api/games');

      expect(userErrors).toHaveLength(2);
      expect(gameErrors).toHaveLength(1);
    });

    it('should provide error summary for time periods', () => {
      // Mock current time
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);

      // Log errors with different timestamps
      service.logError({
        level: 'error',
        message: 'Recent error',
        timestamp: new Date(now - 1000).toISOString(), // 1 second ago
      });
      service.logError({
        level: 'warn',
        message: 'Old error',
        timestamp: new Date(now - 86400000 * 2).toISOString(), // 2 days ago
      });

      const summary = service.getErrorSummary(1); // Last hour
      expect(summary.total).toBe(1); // Only recent error
      expect(summary.byLevel.error).toBe(1);
      expect(summary.byLevel.warn).toBeUndefined();
    });

    it('should reset metrics correctly', () => {
      // Log some errors
      service.logError({ level: 'error', message: 'Test error' });

      // Reset metrics
      service.resetMetrics();

      const metrics = service.getMetrics();
      expect(metrics.totalErrors).toBe(0);
      expect(metrics.recentErrors).toEqual([]);
      expect(metrics.topErrorMessages).toEqual([]);
    });
  });

  describe('Configuration Handling', () => {
    it('should handle missing configuration gracefully', () => {
      configService.get.mockReturnValue(undefined);

      // Should not throw
      expect(() => {
        service.logError({
          level: 'error',
          message: 'Test error',
        });
      }).not.toThrow();
    });

    it('should handle production vs development logging', () => {
      // Test production mode
      configService.get
        .mockReturnValueOnce('production')
        .mockReturnValueOnce('error')
        .mockReturnValueOnce('logs');

      // Spy on the NestJS Logger's error method
      const loggerSpy = vi
        .spyOn(
          (service as unknown as { consoleLogger: { error: () => void } })
            .consoleLogger,
          'error'
        )
        .mockImplementation();

      service.logError({
        level: 'error',
        message: 'Production error',
      });

      expect(loggerSpy).toHaveBeenCalled();
      loggerSpy.mockRestore();
    });
  });

  describe('Error Context Enrichment', () => {
    beforeEach(() => {
      configService.get.mockReturnValue('development');
    });

    it('should enrich error with timestamp', () => {
      const beforeTime = new Date();

      service.logError({
        level: 'error',
        message: 'Test error',
      });

      const afterTime = new Date();
      const recentError = service.getRecentErrors(1)[0];

      expect(recentError.timestamp).toBeDefined();
      const timestamp = new Date(recentError.timestamp as string);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should preserve existing timestamp', () => {
      const customTimestamp = '2023-01-01T00:00:00.000Z';

      service.logError({
        level: 'error',
        message: 'Test error',
        timestamp: customTimestamp,
      });

      const recentError = service.getRecentErrors(1)[0];
      expect(recentError.timestamp).toBe(customTimestamp);
    });

    it('should handle missing context gracefully', () => {
      expect(() => {
        service.logError({
          level: 'error',
          message: 'Test error',
        });
      }).not.toThrow();

      const metrics = service.getMetrics();
      expect(metrics.totalErrors).toBe(1);
    });

    it('should handle missing tags gracefully', () => {
      service.logError({
        level: 'error',
        message: 'Test error',
      });

      const metrics = service.getMetrics();
      expect(metrics.errorsByCode).toEqual({});
      expect(metrics.errorsByPath).toEqual({});
    });
  });
});
