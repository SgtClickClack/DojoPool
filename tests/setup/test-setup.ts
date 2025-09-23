// Vitest test setup configuration
import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { server } from './mocks/server';
import * as msw from 'msw';
import * as mswNode from 'msw/node';

// Setup MSW
beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  // Cleanup is handled automatically by vitest when globals: true
});
afterAll(() => server.close());

// Mock window object
Object.defineProperty(global, 'window', {
  value: {
    matchMedia: vi.fn(),
  },
  writable: true,
});

// Global test utilities
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
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

// Expose MSW helpers to global scope for tests using `server`, `http`, `HttpResponse`
// This matches usage patterns seen in integration tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).server = server;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).http = msw.http;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).HttpResponse = msw.HttpResponse;
