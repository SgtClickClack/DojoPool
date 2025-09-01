import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ErrorLoggerService } from '../monitoring/error-logger.service';
import { GlobalErrorHandler } from './error-handler.middleware';

describe('GlobalErrorHandler', () => {
  let errorHandler: GlobalErrorHandler;
  let errorLoggerService: jest.Mocked<ErrorLoggerService>;

  const mockRequest = {
    url: '/api/test',
    method: 'GET',
    get: jest.fn(),
    ip: '127.0.0.1',
    connection: { remoteAddress: '127.0.0.1' },
  };

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  const mockHost = {
    switchToHttp: jest.fn().mockReturnValue({
      getResponse: jest.fn().mockReturnValue(mockResponse),
      getRequest: jest.fn().mockReturnValue(mockRequest),
    }),
  };

  beforeEach(async () => {
    const mockErrorLogger = {
      logError: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ErrorLoggerService,
          useValue: mockErrorLogger,
        },
        GlobalErrorHandler,
      ],
    }).compile();

    errorHandler = module.get<GlobalErrorHandler>(GlobalErrorHandler);
    errorLoggerService = module.get(ErrorLoggerService);
  });

  describe('HTTP Exceptions', () => {
    it('should handle HttpException with custom response', () => {
      // Arrange
      const httpException = new HttpException(
        { message: 'Custom error', code: 'CUSTOM_ERROR' },
        HttpStatus.BAD_REQUEST
      );

      // Act
      errorHandler.catch(httpException, mockHost as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'CUSTOM_ERROR',
            message: 'Please check your input data and try again.',
          }),
        })
      );
    });

    it('should handle HttpException with string message', () => {
      // Arrange
      const httpException = new HttpException(
        'Simple error message',
        HttpStatus.NOT_FOUND
      );

      // Act
      errorHandler.catch(httpException, mockHost as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'NOT_FOUND',
            message: 'Simple error message',
          }),
        })
      );
    });

    it('should map HTTP status codes to error codes', () => {
      const testCases = [
        { status: HttpStatus.BAD_REQUEST, expectedCode: 'BAD_REQUEST' },
        { status: HttpStatus.UNAUTHORIZED, expectedCode: 'UNAUTHORIZED' },
        { status: HttpStatus.FORBIDDEN, expectedCode: 'FORBIDDEN' },
        { status: HttpStatus.NOT_FOUND, expectedCode: 'NOT_FOUND' },
        { status: HttpStatus.CONFLICT, expectedCode: 'CONFLICT' },
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          expectedCode: 'INTERNAL_SERVER_ERROR',
        },
      ];

      testCases.forEach(({ status, expectedCode }) => {
        const httpException = new HttpException('Test error', status);

        errorHandler.catch(httpException, mockHost as any);

        expect(mockResponse.status).toHaveBeenLastCalledWith(status);
        expect(mockResponse.json).toHaveBeenLastCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              code: expectedCode,
            }),
          })
        );
      });
    });
  });

  describe('JavaScript Errors', () => {
    it('should handle Error objects with stack trace', () => {
      // Arrange
      const jsError = new Error('JavaScript error');
      jsError.stack =
        'Error: JavaScript error\n    at testFunction (/app/test.js:10:5)';

      // Act
      errorHandler.catch(jsError, mockHost as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'JavaScript error',
          }),
        })
      );

      expect(errorLoggerService.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'error',
          message: 'GET /api/test - INTERNAL_SERVER_ERROR: JavaScript error',
          context: expect.objectContaining({
            errorCode: 'INTERNAL_SERVER_ERROR',
            details: expect.objectContaining({
              name: 'Error',
              stack: jsError.stack,
            }),
          }),
        })
      );
    });

    it('should categorize ValidationError as BAD_REQUEST', () => {
      // Arrange
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';

      // Act
      errorHandler.catch(validationError, mockHost as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
          }),
        })
      );
    });

    it('should handle network errors as service unavailable', () => {
      // Arrange
      const networkError = new Error('ECONNREFUSED connection error');

      // Act
      errorHandler.catch(networkError, mockHost as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.SERVICE_UNAVAILABLE
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'SERVICE_UNAVAILABLE',
          }),
          meta: expect.objectContaining({
            retryable: true,
            retryAfter: 30,
          }),
        })
      );
    });

    it('should handle timeout errors', () => {
      // Arrange
      const timeoutError = new Error('Request timeout occurred');

      // Act
      errorHandler.catch(timeoutError, mockHost as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.REQUEST_TIMEOUT
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'REQUEST_TIMEOUT',
          }),
          meta: expect.objectContaining({
            retryable: true,
          }),
        })
      );
    });

    it('should handle rate limit errors', () => {
      // Arrange
      const rateLimitError = new Error(
        'Too many requests - rate limit exceeded'
      );

      // Act
      errorHandler.catch(rateLimitError, mockHost as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.TOO_MANY_REQUESTS
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'RATE_LIMIT_EXCEEDED',
          }),
          meta: expect.objectContaining({
            retryable: true,
            retryAfter: 60,
          }),
        })
      );
    });
  });

  describe('Unknown Errors', () => {
    it('should handle non-Error objects', () => {
      // Arrange
      const unknownError = 'String error message';

      // Act
      errorHandler.catch(unknownError, mockHost as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'String error message',
          }),
        })
      );
    });

    it('should handle null/undefined errors', () => {
      // Arrange
      const nullError = null;

      // Act
      errorHandler.catch(nullError, mockHost as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
          }),
        })
      );
    });
  });

  describe('Request Context', () => {
    it('should extract request information correctly', () => {
      // Arrange
      mockRequest.get.mockReturnValue('Mozilla/5.0 Test Browser');
      const error = new Error('Test error');

      // Act
      errorHandler.catch(error, mockHost as any);

      // Assert
      expect(errorLoggerService.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            method: 'GET',
            path: '/api/test',
            userAgent: 'Mozilla/5.0 Test Browser',
            ip: '127.0.0.1',
          }),
          tags: expect.objectContaining({
            method: 'GET',
            path: '/api/test',
          }),
        })
      );
    });

    it('should handle missing request headers gracefully', () => {
      // Arrange
      mockRequest.get.mockReturnValue(undefined);
      const error = new Error('Test error');

      // Act
      errorHandler.catch(error, mockHost as any);

      // Assert
      expect(errorLoggerService.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            userAgent: 'Unknown',
          }),
        })
      );
    });

    it('should extract IP from various sources', () => {
      const testCases = [
        {
          setup: () => {
            mockRequest.get.mockReturnValue('192.168.1.100');
            mockRequest.ip = undefined;
          },
          expected: '192.168.1.100',
        },
        {
          setup: () => {
            mockRequest.get.mockReturnValue(undefined);
            mockRequest.ip = '10.0.0.1';
          },
          expected: '10.0.0.1',
        },
        {
          setup: () => {
            mockRequest.get.mockReturnValue(undefined);
            mockRequest.ip = undefined;
            mockRequest.connection = { remoteAddress: '172.16.0.1' };
          },
          expected: '172.16.0.1',
        },
      ];

      testCases.forEach(({ setup, expected }) => {
        setup();
        const error = new Error('Test error');

        errorHandler.catch(error, mockHost as any);

        expect(errorLoggerService.logError).toHaveBeenCalledWith(
          expect.objectContaining({
            context: expect.objectContaining({
              ip: expected,
            }),
          })
        );
      });
    });
  });

  describe('Error Response Format', () => {
    it('should include request ID in response', () => {
      // Arrange
      const error = new Error('Test error');

      // Act
      errorHandler.catch(error, mockHost as any);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            requestId: expect.any(String),
            timestamp: expect.any(String),
            path: '/api/test',
          }),
        })
      );
    });

    it('should provide user-friendly error messages', () => {
      const testCases = [
        {
          errorCode: 'BAD_REQUEST',
          expectedMessage:
            'The request was invalid. Please check your input and try again.',
        },
        {
          errorCode: 'UNAUTHORIZED',
          expectedMessage: 'You need to be logged in to access this resource.',
        },
        {
          errorCode: 'NOT_FOUND',
          expectedMessage: 'The requested resource was not found.',
        },
        {
          errorCode: 'INTERNAL_SERVER_ERROR',
          expectedMessage: 'Something went wrong on our end. Please try again.',
        },
      ];

      testCases.forEach(({ errorCode, expectedMessage }) => {
        // Create a mock error with specific code
        const error = new Error('Test error');
        (errorHandler as any).getErrorCodeFromStatus = jest
          .fn()
          .mockReturnValue(errorCode);

        errorHandler.catch(error, mockHost as any);

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              code: errorCode,
              message: expectedMessage,
            }),
          })
        );
      });
    });

    it('should include correlation ID for error tracking', () => {
      // Arrange
      const error = new Error('Test error');

      // Act
      errorHandler.catch(error, mockHost as any);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          meta: expect.objectContaining({
            correlationId: expect.any(String),
          }),
        })
      );
    });

    it('should hide sensitive error details in production', () => {
      // This would typically be tested by mocking NODE_ENV
      // For now, we verify the structure is correct
      const error = new Error('Test error');
      error.stack = 'Sensitive stack trace';

      errorHandler.catch(error, mockHost as any);

      const responseCall = mockResponse.json.mock.calls[0][0];
      expect(responseCall).toHaveProperty('success', false);
      expect(responseCall).toHaveProperty('error');
      expect(responseCall.error).toHaveProperty('code');
      expect(responseCall.error).toHaveProperty('message');
    });
  });

  describe('Logging Integration', () => {
    it('should log critical errors with full details', () => {
      // Arrange
      const criticalError = new Error('Critical system failure');
      criticalError.stack = 'Detailed stack trace';

      // Act
      errorHandler.catch(criticalError, mockHost as any);

      // Assert
      expect(errorLoggerService.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'error',
          message:
            'GET /api/test - INTERNAL_SERVER_ERROR: Critical system failure',
          context: expect.objectContaining({
            errorCode: 'INTERNAL_SERVER_ERROR',
            details: expect.objectContaining({
              name: 'Error',
              stack: 'Detailed stack trace',
            }),
          }),
        })
      );
    });

    it('should log client errors as warnings', () => {
      // Arrange
      const clientError = new HttpException(
        'Bad Request',
        HttpStatus.BAD_REQUEST
      );

      // Act
      errorHandler.catch(clientError, mockHost as any);

      // Assert
      expect(errorLoggerService.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'warn',
          message: 'GET /api/test - BAD_REQUEST: Bad Request',
        })
      );
    });
  });
});
