import { Test, TestingModule } from '@nestjs/testing';
import { ModuleMetadata } from '@nestjs/common';
import {
  MockFactoryRegistry,
  createTestData,
  jestHelpers
} from '../mocks/mock-factory';

/**
 * Service Isolation Utilities
 * Provides proper dependency injection and isolation for complex services
 */

export interface ServiceTestSetup<T> {
  service: T;
  module: TestingModule;
  mocks: Record<string, jest.Mocked<any>>;
}

/**
 * Base Service Test Setup
 * Provides common patterns for service testing with dependency injection
 */
export abstract class BaseServiceTestSetup<T> {
  protected moduleMetadata: ModuleMetadata;

  constructor(moduleMetadata: ModuleMetadata) {
    this.moduleMetadata = moduleMetadata;
  }

  /**
   * Create a test module with mocked dependencies
   */
  protected async createTestModule(
    customProviders: any[] = [],
    customMocks: Record<string, any> = {}
  ): Promise<TestingModule> {
    const providers = [
      ...this.getDefaultProviders(),
      ...customProviders,
    ];

    const module = await Test.createTestingModule({
      ...this.moduleMetadata,
      providers,
    }).compile();

    // Override providers with mocks
    this.setupMocks(module, customMocks);

    return module;
  }

  /**
   * Setup mocks for the module
   */
  protected setupMocks(
    module: TestingModule,
    customMocks: Record<string, any> = {}
  ): void {
    // Override providers with mocks from registry
    Object.entries(this.getMockMappings()).forEach(([token, mockName]) => {
      if (customMocks[token]) {
        // For custom mocks, we can't override after module creation
        // This should be handled in the provider setup
      } else {
        // For registry mocks, we can't override after module creation
        // This should be handled in the provider setup
      }
    });
  }

  /**
   * Get default providers for the service
   */
  protected abstract getDefaultProviders(): any[];

  /**
   * Get mock mappings for dependency injection
   */
  protected abstract getMockMappings(): Record<string, string>;

  /**
   * Setup method to be implemented by subclasses
   */
  abstract setup(customMocks?: Record<string, any>): Promise<ServiceTestSetup<T>>;
}

/**
 * AuthService Test Setup
 */
export class AuthServiceTestSetup extends BaseServiceTestSetup<any> {
  constructor() {
    super({
      providers: [], // Will be set in getDefaultProviders
    });
  }

  protected getDefaultProviders() {
    return [
      // AuthService will be added by subclass
      {
        provide: 'PrismaService',
        useValue: MockFactoryRegistry.create('prisma'),
      },
      {
        provide: 'JwtService',
        useValue: MockFactoryRegistry.create('jwtService'),
      },
      {
        provide: 'ConfigService',
        useValue: MockFactoryRegistry.create('configService'),
      },
    ];
  }

  protected getMockMappings() {
    return {
      PrismaService: 'prisma',
      JwtService: 'jwtService',
      ConfigService: 'configService',
    };
  }

  async setup(customMocks: Record<string, any> = {}): Promise<ServiceTestSetup<any>> {
    const module = await this.createTestModule([], customMocks);
    const service = module.get('AuthService');

    return {
      service,
      module,
      mocks: {
        prisma: module.get('PrismaService'),
        jwtService: module.get('JwtService'),
        configService: module.get('ConfigService'),
        ...customMocks,
      },
    };
  }
}

/**
 * AiService Test Setup
 */
export class AiServiceTestSetup extends BaseServiceTestSetup<any> {
  constructor() {
    super({
      providers: [], // Will be set in getDefaultProviders
    });
  }

  protected getDefaultProviders() {
    return [
      // AiService will be added by subclass
      {
        provide: 'AiAnalysisService',
        useValue: MockFactoryRegistry.create('aiService'),
      },
      {
        provide: 'ArAnalysisService',
        useValue: MockFactoryRegistry.create('aiService'),
      },
      {
        provide: 'ConfigService',
        useValue: MockFactoryRegistry.create('configService'),
      },
    ];
  }

  protected getMockMappings() {
    return {
      AiAnalysisService: 'aiService',
      ArAnalysisService: 'aiService',
      ConfigService: 'configService',
    };
  }

  async setup(customMocks: Record<string, any> = {}): Promise<ServiceTestSetup<any>> {
    const module = await this.createTestModule([], customMocks);
    const service = module.get('AiService');

    return {
      service,
      module,
      mocks: {
        aiAnalysisService: module.get('AiAnalysisService'),
        arAnalysisService: module.get('ArAnalysisService'),
        configService: module.get('ConfigService'),
        ...customMocks,
      },
    };
  }
}

/**
 * TournamentService Test Setup
 */
export class TournamentServiceTestSetup extends BaseServiceTestSetup<any> {
  constructor() {
    super({
      providers: [], // Will be set in getDefaultProviders
    });
  }

  protected getDefaultProviders() {
    return [
      // TournamentService will be added by subclass
      {
        provide: 'PrismaService',
        useValue: MockFactoryRegistry.create('prisma'),
      },
      {
        provide: 'CacheHelper',
        useValue: MockFactoryRegistry.create('cacheHelper'),
      },
      {
        provide: 'NotificationsService',
        useValue: MockFactoryRegistry.create('notificationsService'),
      },
    ];
  }

  protected getMockMappings() {
    return {
      PrismaService: 'prisma',
      CacheHelper: 'cacheHelper',
      NotificationsService: 'notificationsService',
    };
  }

  async setup(customMocks: Record<string, any> = {}): Promise<ServiceTestSetup<any>> {
    const module = await this.createTestModule([], customMocks);
    const service = module.get('TournamentService');

    return {
      service,
      module,
      mocks: {
        prisma: module.get('PrismaService'),
        cacheHelper: module.get('CacheHelper'),
        notificationsService: module.get('NotificationsService'),
        ...customMocks,
      },
    };
  }
}

/**
 * Generic Service Test Utilities
 */
export class ServiceTestUtils {
  /**
   * Setup service with common mocks
   */
  static async setupService<T>(
    serviceClass: new (...args: any[]) => T,
    customMocks: Record<string, any> = {}
  ): Promise<ServiceTestSetup<T>> {
    const defaultMocks = {
      prisma: MockFactoryRegistry.create('prisma'),
      cacheHelper: MockFactoryRegistry.create('cacheHelper'),
      configService: MockFactoryRegistry.create('configService'),
      notificationsService: MockFactoryRegistry.create('notificationsService'),
      jwtService: MockFactoryRegistry.create('jwtService'),
      aiService: MockFactoryRegistry.create('aiService'),
    };

    const allMocks = { ...defaultMocks, ...customMocks };

    // Create service instance with mocked dependencies
    const service = new serviceClass(allMocks);

    return {
      service,
      module: null as any, // Not using NestJS module for generic setup
      mocks: allMocks,
    };
  }

  /**
   * Create isolated service instance with specific dependencies
   */
  static createIsolatedService<T>(
    serviceClass: new (...args: any[]) => T,
    dependencies: Record<string, any>
  ): T {
    return new serviceClass(dependencies);
  }

  /**
   * Mock external dependencies for a service
   */
  static mockDependencies(
    service: any,
    dependencies: Record<string, any>
  ): void {
    Object.entries(dependencies).forEach(([key, mock]) => {
      service[key] = mock;
    });
  }

  /**
   * Reset all mocks for a service
   */
  static resetServiceMocks(service: any): void {
    if (service && typeof service === 'object') {
      Object.values(service).forEach((value) => {
        if (value && typeof value === 'object' && 'mockClear' in value) {
          (value as jest.Mock).mockClear();
        }
      });
    }
  }
}

/**
 * Test Data Builder Pattern
 */
export class TestDataBuilder {
  private data: Record<string, any> = {};

  static create(): TestDataBuilder {
    return new TestDataBuilder();
  }

  user(overrides: Partial<any> = {}): TestDataBuilder {
    this.data.user = createTestData.user(overrides);
    return this;
  }

  profile(overrides: Partial<any> = {}): TestDataBuilder {
    this.data.profile = createTestData.profile(overrides);
    return this;
  }

  tournament(overrides: Partial<any> = {}): TestDataBuilder {
    this.data.tournament = createTestData.tournament(overrides);
    return this;
  }

  match(overrides: Partial<any> = {}): TestDataBuilder {
    this.data.match = createTestData.match(overrides);
    return this;
  }

  venue(overrides: Partial<any> = {}): TestDataBuilder {
    this.data.venue = createTestData.venue(overrides);
    return this;
  }

  custom(key: string, value: any): TestDataBuilder {
    this.data[key] = value;
    return this;
  }

  build(): Record<string, any> {
    return { ...this.data };
  }
}

/**
 * Async Test Utilities
 */
export class AsyncTestUtils {
  /**
   * Wait for next tick
   */
  static async nextTick(): Promise<void> {
    await new Promise(resolve => setImmediate(resolve));
  }

  /**
   * Wait for specific amount of time
   */
  static async wait(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry async operation
   */
  static async retry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 100
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxAttempts) {
          await this.wait(delay);
        }
      }
    }

    throw lastError!;
  }
}

/**
 * Database Test Utilities
 */
export class DatabaseTestUtils {
  /**
   * Setup database with test data
   */
  static async setupTestData(prismaMock: any, data: Record<string, any[]>): Promise<void> {
    for (const [model, records] of Object.entries(data)) {
      for (const record of records) {
        prismaMock[model].create.mockResolvedValue(record);
      }
    }
  }

  /**
   * Clear all test data
   */
  static async clearTestData(prismaMock: any): Promise<void> {
    const models = ['user', 'profile', 'tournament', 'match', 'venue', 'clan'];
    for (const model of models) {
      prismaMock[model].deleteMany.mockResolvedValue({ count: 0 });
    }
  }

  /**
   * Setup mock database responses
   */
  static setupMockResponses(prismaMock: any, responses: Record<string, any>): void {
    Object.entries(responses).forEach(([method, response]) => {
      const [model, operation] = method.split('.');
      if (prismaMock[model] && prismaMock[model][operation]) {
        prismaMock[model][operation].mockResolvedValue(response);
      }
    });
  }
}

/**
 * Cache Test Utilities
 */
export class CacheTestUtils {
  /**
   * Setup cache with test data
   */
  static setupCacheData(cacheMock: any, data: Record<string, any>): void {
    Object.entries(data).forEach(([key, value]) => {
      cacheMock.get.mockImplementation((cacheKey: string) =>
        cacheKey === key ? value : null
      );
    });
  }

  /**
   * Verify cache interactions
   */
  static verifyCacheInteractions(cacheMock: any, expectedCalls: any[]): void {
    expectedCalls.forEach(({ method, args, times = 1 }) => {
      expect(cacheMock[method]).toHaveBeenCalledTimes(times);
      if (args) {
        expect(cacheMock[method]).toHaveBeenCalledWith(...args);
      }
    });
  }
}
