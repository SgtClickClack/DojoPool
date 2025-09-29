/**
 * Test Setup Configuration
 * 
 * Comprehensive test setup for the Dojo Pool application
 * including mocks, utilities, and test environment configuration.
 */

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
});

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    pop: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
  }),
}));

// Mock Next.js image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

// Mock Next.js dynamic imports
jest.mock('next/dynamic', () => () => {
  const DynamicComponent = () => null;
  DynamicComponent.displayName = 'LoadableComponent';
  DynamicComponent.preload = jest.fn();
  return DynamicComponent;
});

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  public readyState = MockWebSocket.CONNECTING;
  public url: string;
  public onopen: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 100);
  }

  send(data: string) {
    // Mock send implementation
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

// Mock WebSocket globally
(global as any).WebSocket = MockWebSocket;

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
}

(global as any).IntersectionObserver = MockIntersectionObserver;

// Mock ResizeObserver
class MockResizeObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
}

(global as any).ResizeObserver = MockResizeObserver;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
  },
});

// Mock crypto API
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }),
  },
});

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
(global as any).localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
(global as any).sessionStorage = sessionStorageMock;

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Start MSW server
  server.listen({ onUnhandledRequest: 'error' });
  
  // Suppress console errors and warnings in tests unless explicitly needed
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('Error:'))
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };
  
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning:')
    ) {
      return;
    }
    originalConsoleWarn.call(console, ...args);
  };
});

afterEach(() => {
  // Clean up after each test
  cleanup();
  
  // Reset all mocks
  jest.clearAllMocks();
  
  // Clear localStorage and sessionStorage
  localStorageMock.clear();
  sessionStorageMock.clear();
  
  // Reset fetch mock
  (fetch as jest.Mock).mockClear();
});

afterAll(() => {
  // Stop MSW server
  server.close();
  
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Test utilities
export const createMockUser = (overrides: any = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  username: 'testuser',
  name: 'Test User',
  role: 'USER',
  clanId: null,
  clanRole: null,
  avatarUrl: null,
  isAdmin: false,
  ...overrides,
});

export const createMockDojo = (overrides: any = {}) => ({
  id: 'dojo-123',
  name: 'Test Dojo',
  description: 'A test dojo',
  coordinates: {
    lat: 40.7128,
    lng: -74.0060,
  },
  controllingClanId: null,
  level: 1,
  defenseScore: 0,
  ...overrides,
});

export const createMockPlayer = (overrides: any = {}) => ({
  playerId: 'player-123',
  username: 'testplayer',
  lat: 40.7128,
  lng: -74.0060,
  lastSeen: new Date().toISOString(),
  ...overrides,
});

export const createMockClan = (overrides: any = {}) => ({
  id: 'clan-123',
  name: 'Test Clan',
  tag: 'TEST',
  description: 'A test clan',
  leaderId: 'user-123',
  memberCount: 5,
  level: 1,
  ...overrides,
});

export const createMockMatch = (overrides: any = {}) => ({
  id: 'match-123',
  playerAId: 'player-1',
  playerBId: 'player-2',
  status: 'SCHEDULED',
  scoreA: 0,
  scoreB: 0,
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockNotification = (overrides: any = {}) => ({
  id: 'notification-123',
  userId: 'user-123',
  type: 'info',
  title: 'Test Notification',
  message: 'This is a test notification',
  isRead: false,
  createdAt: new Date().toISOString(),
  ...overrides,
});

// Mock API responses
export const mockApiResponse = <T>(data: T, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
});

// Mock API error
export const mockApiError = (message: string, status = 500) => ({
  ok: false,
  status,
  json: async () => ({ error: message }),
  text: async () => JSON.stringify({ error: message }),
});

// Test environment setup
export const setupTestEnvironment = () => {
  // Set up test environment variables
  process.env.NODE_ENV = 'test';
  process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api';
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key';
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'test-token';
};

// Performance testing utilities
export const measurePerformance = async <T>(
  fn: () => Promise<T>,
  name: string
): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  
  if (duration > 100) {
    console.warn(`[Performance] ${name} took ${duration}ms`);
  }
  
  return { result, duration };
};

// Accessibility testing utilities
export const checkAccessibility = async (container: HTMLElement) => {
  // Basic accessibility checks
  const images = container.querySelectorAll('img');
  images.forEach(img => {
    if (!img.getAttribute('alt')) {
      throw new Error('Image missing alt attribute');
    }
  });
  
  const buttons = container.querySelectorAll('button');
  buttons.forEach(button => {
    if (!button.textContent && !button.getAttribute('aria-label')) {
      throw new Error('Button missing accessible name');
    }
  });
  
  const inputs = container.querySelectorAll('input');
  inputs.forEach(input => {
    if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
      const label = container.querySelector(`label[for="${input.id}"]`);
      if (!label) {
        throw new Error('Input missing accessible name');
      }
    }
  });
};

// Mock data factories
export const mockDataFactories = {
  user: createMockUser,
  dojo: createMockDojo,
  player: createMockPlayer,
  clan: createMockClan,
  match: createMockMatch,
  notification: createMockNotification,
};

// Export test setup
export default {
  createMockUser,
  createMockDojo,
  createMockPlayer,
  createMockClan,
  createMockMatch,
  createMockNotification,
  mockApiResponse,
  mockApiError,
  setupTestEnvironment,
  measurePerformance,
  checkAccessibility,
  mockDataFactories,
};
