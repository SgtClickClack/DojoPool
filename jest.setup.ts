import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

// Provide a minimal Jest-compat layer for Vitest
import { vi } from 'vitest';
if (!(global as any).jest) {
  (global as any).jest = {
    ...vi,
    fn: vi.fn,
    mock: vi.mock,
    setTimeout: (ms: number) => {},
  };
}

// Polyfill TextEncoder/TextDecoder for Node.js test environment
if (typeof global.TextEncoder === 'undefined') {
  // Use ESM import to avoid require in lint
  const util = await import('node:util');
  // @ts-expect-error node global augmentation for tests
  global.TextEncoder = (util as any).TextEncoder;
  // @ts-expect-error node global augmentation for tests
  global.TextDecoder = (util as any).TextDecoder;
}

import '@testing-library/jest-dom';
import structuredClone from '@ungap/structured-clone';
import 'whatwg-fetch'; // Polyfill for fetch
if (typeof global.structuredClone !== 'function') {
  global.structuredClone = structuredClone;
}

// Mock Firebase Initialization
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({
    options: { apiKey: process.env.FIREBASE_API_KEY || 'test-mock-key' },
    name: 'mock-app',
  })),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({
    options: { apiKey: process.env.FIREBASE_API_KEY || 'test-mock-key' },
    name: 'mock-app',
  })),
  _getProvider: jest.fn().mockReturnValue({
    getImmediate: jest.fn((options?: { optional: boolean }) => {
      if (options?.optional) return null;
      return {
        getFunctions: jest.fn(() => ({
          /* mock functions instance */
        })),
      };
    }),
  }),
}));
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({
    /* mock functions instance */
  })),
}));
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ settings: {} })),
  onAuthStateChanged: jest.fn(() => jest.fn()),
  sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
  updateProfile: jest.fn(() => Promise.resolve()),
  // Add mocks for Auth providers
  GoogleAuthProvider: jest.fn(),
  FacebookAuthProvider: jest.fn(),
  TwitterAuthProvider: jest.fn(),
  GithubAuthProvider: jest.fn(),
  OAuthProvider: jest.fn(), // Added OAuthProvider
}));
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(() =>
    Promise.resolve({ exists: () => false, data: () => ({}) })
  ),
  enableIndexedDbPersistence: jest.fn(() => Promise.resolve()), // Ensure this exists and returns Promise
  initializeFirestore: jest.fn(), // Add if used
}));
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
  ref: jest.fn(),
  uploadBytes: jest.fn(() => Promise.resolve({})),
  getDownloadURL: jest.fn(() => Promise.resolve('mock-url')),
}));

// Remove ws mock from global setup
/*
jest.mock('ws', () => {
    const EventEmitter = require('events');
    class MockWebSocket extends EventEmitter {
        constructor(url: string) {
            super();
            setTimeout(() => this.emit('open'), 1);
        }
        send = jest.fn();
        close = jest.fn(() => { setTimeout(() => this.emit('close'), 1); });
        readyState = 1;
    }
    class MockWebSocketServer extends EventEmitter {
        constructor(options: { port: number }) {
            super();
            setTimeout(() => this.emit('listening'), 1);
        }
        on = jest.fn(super.on);
        emit = jest.fn(super.emit);
        close = jest.fn((cb) => { if(cb) cb(); });
        clients = new Set();
    }
    return {
        __esModule: true,
        default: {
            Server: MockWebSocketServer,
            WebSocket: MockWebSocket
        },
        Server: MockWebSocketServer,
    };
});
*/

// Now import MSW server (needs structuredClone potentially)
import { server } from './src/__tests__/mocks/server';

// Set default timeout for performance tests
jest.setTimeout(60000);

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

// Optional: Global test setup, e.g., mocking modules
// jest.mock('some-module', () => ({ /* ...mock implementation */ }));

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
