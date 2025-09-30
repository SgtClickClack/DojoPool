import { TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';

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
      user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      profile: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      venue: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        aggregate: vi.fn(),
      },
      table: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
      },
      tournament: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      clan: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        aggregate: vi.fn(),
      },
      clanMember: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
      },
      communityCosmeticItem: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        aggregate: vi.fn(),
      },
      venueSpecial: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      match: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      feedback: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      dojoCheckIn: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      venueQuest: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      marketplaceItem: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      cosmeticItemLike: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      refreshToken: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
        count: vi.fn(),
      },
      // Add Prisma transaction support
      $transaction: vi.fn((cb) => cb(this.createMockPrismaService())),
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      $on: vi.fn(),
      $use: vi.fn(),
      $extends: vi.fn(() => this.createMockPrismaService()),
      $queryRaw: vi.fn(),
      $executeRaw: vi.fn(),
      $runCommandRaw: vi.fn(),
      $aggregateRaw: vi.fn(),
      $findRaw: vi.fn(),
    };
  }

  /**
   * Create a complete mock cache helper with all common methods
   */
  static createMockCacheHelper() {
    return {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      deleteByPattern: vi.fn(),
      exists: vi.fn(),
      clear: vi.fn(),
      ping: vi.fn(),
      writeThrough: vi.fn(),
      invalidate: vi.fn(),
      invalidatePattern: vi.fn(),
      invalidatePatterns: vi.fn(),
      readThrough: vi.fn(),
    };
  }

  /**
   * Create a complete mock notifications service
   */
  static createMockNotificationsService() {
    return {
      createNotification: vi.fn(),
      sendNotification: vi.fn(),
      getNotifications: vi.fn(),
      markAsRead: vi.fn(),
      deleteNotification: vi.fn(),
    };
  }

  /**
   * Create a complete mock error logger service
   */
  static createMockErrorLoggerService() {
    return {
      logError: vi.fn(),
      logWarning: vi.fn(),
      logInfo: vi.fn(),
      getMetrics: vi.fn(),
      getRecentErrors: vi.fn(),
    };
  }

  /**
   * Create a complete mock cache service
   */
  static createMockCacheService() {
    return {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
      clear: vi.fn(),
      ping: vi.fn(),
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
