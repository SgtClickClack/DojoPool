import { Body, Controller, Logger, Post } from '@nestjs/common';
import { ErrorLoggerService } from '../monitoring/error-logger.service';

interface FrontendErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  errorId: string;
  timestamp: string;
  userAgent: string;
  url: string;
  viewport: {
    width: number;
    height: number;
  };
  userId?: string | null;
  sessionId?: string | null;
  additionalData?: Record<string, any>;
}

@Controller('errors')
export class ErrorsController {
  private readonly logger = new Logger(ErrorsController.name);

  constructor(private readonly errorLogger: ErrorLoggerService) {}

  @Post('report')
  async reportError(@Body() errorReport: FrontendErrorReport) {
    try {
      // Log the frontend error
      this.errorLogger.logError({
        level: 'warn',
        message: `Frontend Error: ${errorReport.message}`,
        context: {
          errorId: errorReport.errorId,
          timestamp: errorReport.timestamp,
          userAgent: errorReport.userAgent,
          url: errorReport.url,
          viewport: errorReport.viewport,
          userId: errorReport.userId,
          sessionId: errorReport.sessionId,
          stack: errorReport.stack,
          componentStack: errorReport.componentStack,
          ...errorReport.additionalData,
        },
        tags: {
          source: 'frontend',
          errorId: errorReport.errorId,
          userAgent: errorReport.userAgent,
          url: errorReport.url,
        },
      });

      this.logger.warn(
        `Frontend error reported [${errorReport.errorId}]: ${errorReport.message}`
      );

      return {
        success: true,
        reportId: errorReport.errorId,
        message: 'Error report received and logged',
      };
    } catch (error) {
      this.logger.error('Failed to process error report:', error);

      return {
        success: false,
        error: 'Failed to process error report',
      };
    }
  }
}
