import { ApiMiddleware } from '../apiMiddleware';
import { ErrorTracker } from '../monitoring';
import { AuditLogger } from '../monitoring';

// Mock monitoring utilities
jest.mock('../monitoring');

describe('ApiMiddleware', () => {
  let middleware: ApiMiddleware;
  const mockErrorTracker = {
    getInstance: jest.fn().mockReturnThis(),
    trackError: jest.fn(),
  };

  const mockAuditLogger = {
    getInstance: jest.fn().mockReturnThis(),
    log: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (ErrorTracker as jest.Mocked<typeof ErrorTracker>).getInstance.mockReturnValue(mockErrorTracker);
    (AuditLogger as jest.Mocked<typeof AuditLogger>).getInstance.mockReturnValue(mockAuditLogger);
    middleware = new ApiMiddleware();
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limits', async () => {
      const request = {
        method: 'GET',
        url: '/api/test',
        headers: {},
      };

      // Make multiple requests
      for (let i = 0; i < 5; i++) {
        await middleware.processRequest(request);
      }

      // Next request should be rate limited
      await expect(middleware.processRequest(request)).rejects.toThrow('Rate limit exceeded');
      expect(mockErrorTracker.trackError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          component: 'ApiMiddleware',
          severity: 'medium',
        })
      );
    });

    test('should reset rate limits after window', async () => {
      const request = {
        method: 'GET',
        url: '/api/test',
        headers: {},
      };

      // Make requests up to limit
      for (let i = 0; i < 5; i++) {
        await middleware.processRequest(request);
      }

      // Fast forward time
      jest.advanceTimersByTime(60000); // 1 minute

      // Should be able to make request again
      await expect(middleware.processRequest(request)).resolves.not.toThrow();
    });
  });

  describe('Security Checks', () => {
    test('should validate origin', async () => {
      const request = {
        method: 'GET',
        url: '/api/test',
        headers: {
          origin: 'https://malicious-site.com',
        },
      };

      await expect(middleware.processRequest(request)).rejects.toThrow('Invalid origin');
      expect(mockErrorTracker.trackError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          component: 'ApiMiddleware',
          severity: 'high',
        })
      );
    });

    test('should validate content type', async () => {
      const request = {
        method: 'POST',
        url: '/api/test',
        headers: {
          'content-type': 'text/plain',
        },
      };

      await expect(middleware.processRequest(request)).rejects.toThrow('Invalid content type');
      expect(mockErrorTracker.trackError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          component: 'ApiMiddleware',
          severity: 'medium',
        })
      );
    });

    test('should allow valid requests', async () => {
      const request = {
        method: 'POST',
        url: '/api/test',
        headers: {
          'content-type': 'application/json',
          origin: 'https://allowed-site.com',
        },
      };

      await expect(middleware.processRequest(request)).resolves.not.toThrow();
    });
  });

  describe('Audit Logging', () => {
    test('should log successful requests', async () => {
      const request = {
        method: 'GET',
        url: '/api/test',
        headers: {},
      };

      await middleware.processRequest(request);

      expect(mockAuditLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('GET /api/test'),
        'info'
      );
    });

    test('should log failed requests', async () => {
      const request = {
        method: 'POST',
        url: '/api/test',
        headers: {
          'content-type': 'text/plain', // Invalid content type
        },
      };

      try {
        await middleware.processRequest(request);
      } catch (error) {
        // Expected error
      }

      expect(mockAuditLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('Invalid content type'),
        'error'
      );
    });
  });

  describe('Configuration', () => {
    test('should allow custom rate limits', async () => {
      const customMiddleware = new ApiMiddleware({
        rateLimits: {
          windowMs: 60000,
          maxRequests: 10,
        },
      });

      const request = {
        method: 'GET',
        url: '/api/test',
        headers: {},
      };

      // Make requests up to custom limit
      for (let i = 0; i < 10; i++) {
        await customMiddleware.processRequest(request);
      }

      // Next request should be rate limited
      await expect(customMiddleware.processRequest(request)).rejects.toThrow('Rate limit exceeded');
    });

    test('should allow custom allowed origins', async () => {
      const customMiddleware = new ApiMiddleware({
        security: {
          allowedOrigins: ['https://custom-site.com'],
        },
      });

      const request = {
        method: 'GET',
        url: '/api/test',
        headers: {
          origin: 'https://custom-site.com',
        },
      };

      await expect(customMiddleware.processRequest(request)).resolves.not.toThrow();
    });

    test('should allow custom content types', async () => {
      const customMiddleware = new ApiMiddleware({
        security: {
          allowedContentTypes: ['text/plain'],
        },
      });

      const request = {
        method: 'POST',
        url: '/api/test',
        headers: {
          'content-type': 'text/plain',
        },
      });

      await expect(customMiddleware.processRequest(request)).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing headers', async () => {
      const request = {
        method: 'POST',
        url: '/api/test',
        headers: undefined,
      };

      await expect(middleware.processRequest(request)).rejects.toThrow('Invalid request headers');
      expect(mockErrorTracker.trackError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          component: 'ApiMiddleware',
          severity: 'low',
        })
      );
    });

    test('should handle malformed requests', async () => {
      const request = {
        method: undefined,
        url: '/api/test',
        headers: {},
      };

      await expect(middleware.processRequest(request)).rejects.toThrow('Invalid request method');
      expect(mockErrorTracker.trackError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          component: 'ApiMiddleware',
          severity: 'low',
        })
      );
    });

    test('should handle rate limit errors gracefully', async () => {
      const request = {
        method: 'GET',
        url: '/api/test',
        headers: {},
      };

      // Make requests up to limit
      for (let i = 0; i < 5; i++) {
        await middleware.processRequest(request);
      }

      try {
        await middleware.processRequest(request);
      } catch (error) {
        expect(error.message).toBe('Rate limit exceeded');
        expect(mockAuditLogger.log).toHaveBeenCalledWith(
          expect.stringContaining('Rate limit exceeded'),
          'warning'
        );
      }
    });
  });
});
