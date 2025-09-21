import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { MockFactoryRegistry } from '../mocks/mock-factory';
import { TestDataManager } from '../fixtures/test-data-manager';

/**
 * Global Test Configuration
 * Sets up consistent test environment across all test files
 */

// Setup global test configuration
beforeAll(async () => {
  // Initialize all mock factories
  MockFactoryRegistry.resetAll();

  // Initialize test data manager
  TestDataManager.initialize();

  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  process.env.JWT_SECRET = 'test-secret';
  process.env.REDIS_URL = 'redis://localhost:6379';

  // Configure global test timeouts
  vi.setConfig({ testTimeout: 30000 });
});

// Cleanup after all tests
afterAll(async () => {
  // Reset all mocks
  MockFactoryRegistry.resetAll();

  // Clean up test environment
  vi.clearAllMocks();
  vi.resetModules();
});

// Setup before each test
beforeEach(() => {
  // Reset all mocks before each test
  MockFactoryRegistry.resetAll();

  // Clear all vi mocks
  vi.clearAllMocks();
});

// Cleanup after each test
afterEach(() => {
  // Reset all mocks after each test
  MockFactoryRegistry.resetAll();

  // Clear any cached data
  vi.clearAllTimers();
});

/**
 * Test Environment Utilities
 */
export class TestEnvironment {
  static async setup(): Promise<void> {
    // Additional setup logic can be added here
    console.log('Setting up test environment...');
  }

  static async teardown(): Promise<void> {
    // Additional teardown logic can be added here
    console.log('Tearing down test environment...');
  }

  static async reset(): Promise<void> {
    MockFactoryRegistry.resetAll();
    jest.clearAllMocks();
  }
}

/**
 * Test Database Utilities
 */
export class TestDatabase {
  static async setup(): Promise<void> {
    // Setup test database connections
    console.log('Setting up test database...');
  }

  static async cleanup(): Promise<void> {
    // Clean up test database
    console.log('Cleaning up test database...');
  }

  static async seed(): Promise<void> {
    // Seed test data
    console.log('Seeding test data...');
  }
}

/**
 * Test Cache Utilities
 */
export class TestCache {
  static async setup(): Promise<void> {
    // Setup test cache
    console.log('Setting up test cache...');
  }

  static async cleanup(): Promise<void> {
    // Clean up test cache
    console.log('Cleaning up test cache...');
  }
}

/**
 * Global Test Helpers
 */
export const globalTestHelpers = {
  /**
   * Create authenticated request helper
   */
  createAuthenticatedRequest: (token: string = 'test-token') => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }),

  /**
   * Create test user with token
   */
  createTestUserWithToken: () => {
    const user = TestDataManager.create('user');
    const token = 'test-jwt-token';

    return { user, token };
  },

  /**
   * Wait for async operations
   */
  waitForAsync: (ms: number = 100) =>
    new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Generate random test data
   */
  generateRandomData: (type: string, overrides: any = {}) =>
    TestDataManager.create(type, overrides),

  /**
   * Setup mock responses for common scenarios
   */
  setupCommonMocks: () => ({
    success: { success: true, data: 'test' },
    error: { success: false, error: 'Test error' },
    notFound: { success: false, error: 'Not found', statusCode: 404 },
    unauthorized: { success: false, error: 'Unauthorized', statusCode: 401 },
  }),
};

/**
 * Test Assertions Helpers
 */
export const testAssertions = {
  /**
   * Assert successful API response
   */
  assertSuccessResponse: (response: any, expectedData?: any) => {
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    if (expectedData) {
      expect(response.body.data).toEqual(expectedData);
    }
  },

  /**
   * Assert error response
   */
  assertErrorResponse: (response: any, statusCode: number = 400, errorMessage?: string) => {
    expect(response.status).toBe(statusCode);
    expect(response.body.success).toBe(false);
    if (errorMessage) {
      expect(response.body.error).toContain(errorMessage);
    }
  },

  /**
   * Assert database call was made
   */
  assertDatabaseCalled: (mock: any, method: string, times: number = 1) => {
    expect(mock[method]).toHaveBeenCalledTimes(times);
  },

  /**
   * Assert cache interaction
   */
  assertCacheInteraction: (cacheMock: any, method: string, args?: any[]) => {
    if (args) {
      expect(cacheMock[method]).toHaveBeenCalledWith(...args);
    } else {
      expect(cacheMock[method]).toHaveBeenCalled();
    }
  },
};

/**
 * Performance Test Helpers
 */
export const performanceHelpers = {
  /**
   * Measure execution time
   */
  measureExecutionTime: async (fn: () => Promise<any>) => {
    const start = Date.now();
    const result = await fn();
    const end = Date.now();
    return { result, executionTime: end - start };
  },

  /**
   * Assert performance threshold
   */
  assertPerformanceThreshold: (executionTime: number, thresholdMs: number) => {
    expect(executionTime).toBeLessThan(thresholdMs);
  },

  /**
   * Run load test
   */
  runLoadTest: async (fn: () => Promise<any>, iterations: number = 100) => {
    const results = [];

    for (let i = 0; i < iterations; i++) {
      const { executionTime } = await performanceHelpers.measureExecutionTime(fn);
      results.push(executionTime);
    }

    const averageTime = results.reduce((a, b) => a + b, 0) / results.length;
    const maxTime = Math.max(...results);
    const minTime = Math.min(...results);

    return { averageTime, maxTime, minTime, results };
  },
};

/**
 * Test Scenarios
 */
export const testScenarios = {
  /**
   * Happy path scenario
   */
  happyPath: {
    user: TestDataManager.create('user'),
    tournament: TestDataManager.create('tournament'),
    venue: TestDataManager.create('venue'),
    match: TestDataManager.create('match'),
  },

  /**
   * Error scenarios
   */
  errorScenarios: {
    invalidUser: { email: 'invalid-email', password: '123' },
    nonExistentId: 'non-existent-id',
    expiredToken: 'expired.jwt.token',
  },

  /**
   * Edge cases
   */
  edgeCases: {
    emptyData: {},
    largeData: TestDataManager.createMany('user', 1000),
    specialCharacters: { name: '!@#$%^&*()_+' },
  },
};

// All exports are handled above as individual exports
