import { TestingModule } from '@nestjs/testing';

/**
 * Test utility to fix dependency injection issues in NestJS tests
 * This utility manually injects mocked dependencies into service instances
 * when the automatic dependency injection fails in test environments
 */
export class TestDependencyInjector {
  /**
   * Manually inject dependencies into a service instance
   * @param service - The service instance to inject dependencies into
   * @param dependencies - Object containing the mocked dependencies
   */
  static injectDependencies(
    service: any,
    dependencies: Record<string, any>
  ): void {
    // Inject all provided dependencies
    Object.entries(dependencies).forEach(([key, value]) => {
      (service as any)[key] = value;
    });

    // Also inject common cache service aliases for decorators
    if (dependencies.cacheHelper) {
      (service as any).cacheService = dependencies.cacheHelper;
      (service as any).cacheManager = dependencies.cacheHelper;
    }
  }

  /**
   * Create a complete mock Prisma service with all common methods
   */
  static createMockPrismaService() {
    return {
      feedback: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      profile: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      venue: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      table: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      tournament: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      clan: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      communityCosmeticItem: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
      },
      venueSpecial: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      match: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      // Add Prisma transaction support
      $transaction: jest.fn((cb) => cb(this.createMockPrismaService())),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $on: jest.fn(),
      $use: jest.fn(),
      $extends: jest.fn(() => this.createMockPrismaService()),
      $queryRaw: jest.fn(),
      $executeRaw: jest.fn(),
      $runCommandRaw: jest.fn(),
      $aggregateRaw: jest.fn(),
      $findRaw: jest.fn(),
    };
  }

  /**
   * Create a complete mock cache helper with all common methods
   */
  static createMockCacheHelper() {
    return {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      deleteByPattern: jest.fn(),
      exists: jest.fn(),
      clear: jest.fn(),
      ping: jest.fn(),
      writeThrough: jest.fn(),
      invalidate: jest.fn(),
      invalidatePattern: jest.fn(),
      invalidatePatterns: jest.fn(),
      readThrough: jest.fn(),
    };
  }

  /**
   * Create a complete mock notifications service
   */
  static createMockNotificationsService() {
    return {
      createNotification: jest.fn(),
      sendNotification: jest.fn(),
      getNotifications: jest.fn(),
      markAsRead: jest.fn(),
      deleteNotification: jest.fn(),
    };
  }

  /**
   * Create a complete mock error logger service
   */
  static createMockErrorLoggerService() {
    return {
      logError: jest.fn(),
      logWarning: jest.fn(),
      logInfo: jest.fn(),
      getMetrics: jest.fn(),
      getRecentErrors: jest.fn(),
    };
  }

  /**
   * Setup a service with all common mocked dependencies
   * @param service - The service instance
   * @param customMocks - Custom mocks to override defaults
   */
  static setupServiceWithMocks(
    service: any,
    customMocks: Record<string, any> = {}
  ): void {
    const defaultMocks = {
      prisma: this.createMockPrismaService(),
      cacheHelper: this.createMockCacheHelper(),
      notificationsService: this.createMockNotificationsService(),
      errorLogger: this.createMockErrorLoggerService(),
    };

    const allMocks = { ...defaultMocks, ...customMocks };
    this.injectDependencies(service, allMocks);
  }
}
