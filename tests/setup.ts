import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

// Provide a minimal Jest-compat layer for Vitest
import { vi } from 'vitest';
if (!(global as any).jest) {
  (global as any).jest = {
    ...vi,
    fn: vi.fn,
    mock: vi.fn,
    spyOn: vi.fn,
    setTimeout: (ms: number) => {},
    clearTimeout: (id: any) => {},
  };
}

// Polyfill TextEncoder/TextDecoder for Node.js test environment
if (typeof global.TextEncoder === 'undefined') {
  try {
    // Use require for Node.js built-ins in test environment
    const util = require('node:util');
    // @ts-expect-error node global augmentation for tests
    global.TextEncoder = util.TextEncoder;
    // @ts-expect-error node global augmentation for tests
    global.TextDecoder = util.TextDecoder;
  } catch (e) {
    // Fallback for environments where node:util is not available
    console.warn('Could not polyfill TextEncoder/TextDecoder:', e);
  }
}

import '@testing-library/jest-dom';
import structuredClone from '@ungap/structured-clone';
import 'whatwg-fetch'; // Polyfill for fetch
if (typeof global.structuredClone !== 'function') {
  global.structuredClone = structuredClone;
}

// Mock Firebase Initialization
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({
    options: { apiKey: process.env.FIREBASE_API_KEY || 'test-mock-key' },
    name: 'mock-app',
  })),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({
    options: { apiKey: process.env.FIREBASE_API_KEY || 'test-mock-key' },
    name: 'mock-app',
  })),
  _getProvider: vi.fn().mockReturnValue({
    getImmediate: vi.fn((options?: { optional: boolean }) => {
      if (options?.optional) return null;
      return {
        getFunctions: vi.fn(() => ({
          /* mock functions instance */
        })),
      };
    }),
  }),
}));
vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({
    /* mock functions instance */
  })),
}));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ settings: {} })),
  onAuthStateChanged: vi.fn(() => vi.fn()),
  sendPasswordResetEmail: vi.fn(() => Promise.resolve()),
  updateProfile: vi.fn(() => Promise.resolve()),
  // Add mocks for Auth providers
  GoogleAuthProvider: vi.fn(),
  FacebookAuthProvider: vi.fn(),
  TwitterAuthProvider: vi.fn(),
  GithubAuthProvider: vi.fn(),
  OAuthProvider: vi.fn(), // Added OAuthProvider
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(() =>
    Promise.resolve({ exists: () => false, data: () => ({}) })
  ),
  enableIndexedDbPersistence: vi.fn(() => Promise.resolve()), // Ensure this exists and returns Promise
  initializeFirestore: vi.fn(), // Add if used
}));
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(),
  uploadBytes: vi.fn(() => Promise.resolve({})),
  getDownloadURL: vi.fn(() => Promise.resolve('mock-url')),
}));

// Now import MSW server (needs structuredClone potentially)
import { server } from './setup/mocks/server';

// Set default timeout for performance tests
vi.setConfig({ testTimeout: 60000 });

// Establish API mocking before all tests.
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished.
afterAll(() => server.close());

// Configure Testing Library
import { configure } from '@testing-library/react';
configure({
  // Configure global options for React Testing Library if needed
  // asyncUtilTimeout: 2000, // Example: increase timeout for async utils
});

// Only mock browser globals when running in jsdom environment
if (typeof window !== 'undefined') {
  declare global {
    interface Window {
      ResizeObserver: any;
    }
  }

  // Mock window.ResizeObserver
  window.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Jest global setup for Vite env compatibility
Object.defineProperty(globalThis, 'import', {
  value: {},
  writable: true,
});

Object.defineProperty(globalThis, 'import.meta', {
  value: {
    env: {
      VITE_NEXT_PUBLIC_API_URL: 'http://localhost:8000/api/v1',
    },
  },
  writable: true,
});

// Import test configuration utilities
import { MockFactoryRegistry } from './mocks/mock-factory';
import { TestDataManager } from './fixtures/test-data-manager';

// Global test configuration
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
