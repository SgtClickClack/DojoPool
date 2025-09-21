import { vi } from 'vitest';

/**
 * Centralized Mock Factory System
 * Standardizes mock patterns across all DojoPool services
 */

export interface MockFactory<T> {
  create(): T;
  createPartial(partial: Partial<T>): T;
  reset(): void;
  getDefaults(): Partial<T>;
}

/**
 * Base Mock Factory with common patterns
 */
export abstract class BaseMockFactory<T> implements MockFactory<T> {
  protected defaults: Partial<T> = {};
  protected mocks: T[] = [];

  abstract getDefaults(): Partial<T>;

  create(): T {
    const mock = this.createMockInstance();
    this.mocks.push(mock);
    return mock;
  }

  createPartial(partial: Partial<T>): T {
    const mock = this.createMockInstance();
    Object.assign(mock, partial);
    this.mocks.push(mock);
    return mock;
  }

  reset(): void {
    this.mocks.forEach(mock => {
      if (mock && typeof mock.clearAllMocks === 'function') {
        mock.clearAllMocks();
      }
    });
    this.mocks = [];
  }

  protected abstract createMockInstance(): T;
}

/**
 * Prisma Service Mock Factory
 */
export class PrismaServiceMockFactory extends BaseMockFactory<any> {
  getDefaults() {
    return {
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      $transaction: vi.fn((cb) => cb(this.create())),
    };
  }

  protected createMockInstance(): any {
    return {
      // Core methods
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      $transaction: vi.fn((cb) => cb(this.create())),

      // User model
      user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
        count: vi.fn(),
        aggregate: vi.fn(),
      },

      // Profile model
      profile: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },

      // Tournament model
      tournament: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
        count: vi.fn(),
      },

      // Match model
      match: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
        count: vi.fn(),
      },

      // Venue model
      venue: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },

      // Clan model
      clan: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },

      // Feedback model
      feedback: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },

      // Community Cosmetic Item model
      communityCosmeticItem: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },

      ...this.getDefaults(),
    };
  }
}

/**
 * Cache Helper Mock Factory
 */
export class CacheHelperMockFactory extends BaseMockFactory<any> {
  getDefaults() {
    return {
      ping: vi.fn().mockResolvedValue('PONG'),
    };
  }

  protected createMockInstance(): any {
    return {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      deleteByPattern: vi.fn(),
      exists: vi.fn(),
      clear: vi.fn(),
      ping: vi.fn().mockResolvedValue('PONG'),
      writeThrough: vi.fn(),
      invalidate: vi.fn(),
      invalidatePattern: vi.fn(),
      invalidatePatterns: vi.fn(),
      readThrough: vi.fn(),
      ...this.getDefaults(),
    };
  }
}

/**
 * Config Service Mock Factory
 */
export class ConfigServiceMockFactory extends BaseMockFactory<any> {
  getDefaults() {
    return {
      get: vi.fn((key: string) => {
        const defaults: Record<string, any> = {
          NODE_ENV: 'test',
          DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
          REDIS_URL: 'redis://localhost:6379',
          JWT_SECRET: 'test-secret',
          GEMINI_API_KEY: 'test-gemini-key',
          OPENAI_API_KEY: 'test-openai-key',
        };
        return defaults[key];
      }),
    };
  }

  protected createMockInstance(): any {
    return {
      get: vi.fn((key: string) => {
        const defaults: Record<string, any> = {
          NODE_ENV: 'test',
          DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
          REDIS_URL: 'redis://localhost:6379',
          JWT_SECRET: 'test-secret',
          GEMINI_API_KEY: 'test-gemini-key',
          OPENAI_API_KEY: 'test-openai-key',
        };
        return defaults[key];
      }),
      ...this.getDefaults(),
    };
  }
}

/**
 * Notifications Service Mock Factory
 */
export class NotificationsServiceMockFactory extends BaseMockFactory<any> {
  getDefaults() {
    return {};
  }

  protected createMockInstance(): any {
    return {
      createNotification: vi.fn(),
      sendNotification: vi.fn(),
      getNotifications: vi.fn(),
      markAsRead: vi.fn(),
      deleteNotification: vi.fn(),
      getUnreadCount: vi.fn(),
      sendBulkNotifications: vi.fn(),
      ...this.getDefaults(),
    };
  }
}

/**
 * JWT Service Mock Factory
 */
export class JwtServiceMockFactory extends BaseMockFactory<any> {
  getDefaults() {
    return {
      sign: vi.fn().mockReturnValue('mock-jwt-token'),
      verify: vi.fn().mockReturnValue({ userId: '1', username: 'testuser' }),
    };
  }

  protected createMockInstance(): any {
    return {
      sign: vi.fn().mockReturnValue('mock-jwt-token'),
      verify: vi.fn().mockReturnValue({ userId: '1', username: 'testuser' }),
      decode: vi.fn(),
      ...this.getDefaults(),
    };
  }
}

/**
 * AI Service Mock Factory
 */
export class AiServiceMockFactory extends BaseMockFactory<any> {
  getDefaults() {
    return {
      generateMatchAnalysis: vi.fn().mockResolvedValue({
        success: true,
        data: {
          keyMoments: ['Test moment'],
          strategicInsights: ['Test insight'],
          playerPerformance: { playerA: 'Good', playerB: 'Excellent' },
          overallAssessment: 'Great match',
          recommendations: ['Keep practicing'],
        },
        provider: 'mock',
      }),
      generateLiveCommentary: vi.fn().mockResolvedValue({
        success: true,
        data: 'Great shot!',
        provider: 'mock',
      }),
    };
  }

  protected createMockInstance(): any {
    return {
      generateMatchAnalysis: vi.fn().mockResolvedValue({
        success: true,
        data: {
          keyMoments: ['Test moment'],
          strategicInsights: ['Test insight'],
          playerPerformance: { playerA: 'Good', playerB: 'Excellent' },
          overallAssessment: 'Great match',
          recommendations: ['Keep practicing'],
        },
        provider: 'mock',
      }),
      generateLiveCommentary: vi.fn().mockResolvedValue({
        success: true,
        data: 'Great shot!',
        provider: 'mock',
      }),
      analyzeTableImage: vi.fn().mockResolvedValue({
        success: true,
        data: { tableBounds: [], balls: [] },
        provider: 'mock',
      }),
      getHealthStatus: vi.fn().mockResolvedValue({
        gemini: { enabled: true, configured: true },
        openai: { enabled: false, configured: false },
      }),
      getConfiguration: vi.fn(),
      isProviderAvailable: vi.fn(),
      ...this.getDefaults(),
    };
  }
}

/**
 * Mock Factory Registry
 * Centralized access to all mock factories
 */
export class MockFactoryRegistry {
  private static factories = new Map<string, MockFactory<any>>();

  static register<T>(name: string, factory: MockFactory<T>): void {
    this.factories.set(name, factory);
  }

  static get<T>(name: string): MockFactory<T> | undefined {
    return this.factories.get(name);
  }

  static create<T>(name: string): T {
    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`Mock factory '${name}' not registered`);
    }
    return factory.create();
  }

  static createPartial<T>(name: string, partial: Partial<T>): T {
    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`Mock factory '${name}' not registered`);
    }
    return factory.createPartial(partial);
  }

  static resetAll(): void {
    this.factories.forEach(factory => factory.reset());
  }

  static initialize(): void {
    // Initialize all factories
    this.factories.clear();
    initializeMockFactories();
  }
}

/**
 * Initialize all mock factories
 */
export function initializeMockFactories(): void {
  MockFactoryRegistry.register('prisma', new PrismaServiceMockFactory());
  MockFactoryRegistry.register('cacheHelper', new CacheHelperMockFactory());
  MockFactoryRegistry.register('configService', new ConfigServiceMockFactory());
  MockFactoryRegistry.register('notificationsService', new NotificationsServiceMockFactory());
  MockFactoryRegistry.register('jwtService', new JwtServiceMockFactory());
  MockFactoryRegistry.register('aiService', new AiServiceMockFactory());
}

/**
 * Utility function to create common test data
 */
export const createTestData = {
  user: (overrides: Partial<any> = {}) => ({
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hashedpassword',
    role: 'USER',
    isBanned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    dojoCoinBalance: 1000,
    ...overrides,
  }),

  profile: (overrides: Partial<any> = {}) => ({
    id: '1',
    userId: '1',
    displayName: 'Test User',
    bio: 'Test bio',
    avatarUrl: null,
    location: null,
    skillRating: 1500,
    clanTitle: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  tournament: (overrides: Partial<any> = {}) => ({
    id: '1',
    name: 'Test Tournament',
    status: 'active',
    participants: 8,
    maxParticipants: 16,
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000), // 1 day later
    venueId: 'venue-1',
    prizePool: 1000,
    ...overrides,
  }),

  match: (overrides: Partial<any> = {}) => ({
    id: '1',
    tournamentId: 'tournament-1',
    playerAId: 'player-1',
    playerBId: 'player-2',
    status: 'completed',
    scoreA: 8,
    scoreB: 7,
    winnerId: 'player-1',
    startTime: new Date(),
    endTime: new Date(),
    ...overrides,
  }),

  venue: (overrides: Partial<any> = {}) => ({
    id: '1',
    name: 'Test Pool Hall',
    address: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    zipCode: '12345',
    phone: '555-1234',
    email: 'test@venue.com',
    website: 'https://testvenue.com',
    ownerId: 'owner-1',
    isActive: true,
    ...overrides,
  }),
};

/**
 * Vitest helper functions for common patterns
 */
export const viHelpers = {
  mockResolvedValue: <T>(value: T) => vi.fn().mockResolvedValue(value),
  mockRejectedValue: <T>(error: T) => vi.fn().mockRejectedValue(error),
  mockReturnValue: <T>(value: T) => vi.fn().mockReturnValue(value),

  createAsyncMock: <T>(implementation?: (...args: any[]) => Promise<T>) => {
    const mock = vi.fn();
    if (implementation) {
      mock.mockImplementation(implementation);
    }
    return mock;
  },

  createSyncMock: <T>(implementation?: (...args: any[]) => T) => {
    const mock = vi.fn();
    if (implementation) {
      mock.mockImplementation(implementation);
    }
    return mock;
  },
};

// Initialize factories on module load
initializeMockFactories();
