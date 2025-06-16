import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// Create vi mock functions
const mockFn = <T extends (...args: any[]) => any>(implementation?: T) =>
  implementation ? vi.fn(implementation) : vi.fn();

// Provide a minimal Jest API shim that delegates to Vitest's `vi` utilities
if (!(globalThis as any).jest) {
  (globalThis as any).jest = {
    ...vi,
    fn: vi.fn,
    spyOn: vi.spyOn,
    mock: vi.mock,
    clearAllMocks: vi.clearAllMocks,
    resetAllMocks: vi.resetAllMocks,
    restoreAllMocks: vi.restoreAllMocks,
    useFakeTimers: vi.useFakeTimers,
    useRealTimers: vi.useRealTimers,
    advanceTimersByTime: vi.advanceTimersByTime,
    runOnlyPendingTimers: vi.runOnlyPendingTimers,
    runAllTimers: vi.runAllTimers,
  };
}

// Mock browser APIs
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

// Mock essential DOM APIs
(global as any).IntersectionObserver = class {
  observe() {}
  disconnect() {}
  unobserve() {}
};

(global as any).ResizeObserver = class {
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Mock matchMedia
(window as any).matchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
});

// Mock basic DOM methods
(window as any).scrollTo = () => {};
(global as any).fetch = () => Promise.resolve({ ok: true });

// Mock storage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    length: 0,
    key: () => null,
  },
  writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    length: 0,
    key: () => null,
  },
  writable: true,
});

// Mock WebSocket
class MockWebSocket {
  constructor(url: string) {}
  send() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
}
(global as any).WebSocket = MockWebSocket;

// Mock requestAnimationFrame
(global as any).requestAnimationFrame = (callback: any) => {
  return setTimeout(callback, 16);
};

(global as any).cancelAnimationFrame = (id: any) => {
  clearTimeout(id);
};

// Reset after each test
afterEach(() => {
  cleanup();
});

// Setup global test cleanup
beforeEach(() => {
  vi.clearAllMocks();
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: mockFn(),
  warn: mockFn(),
  log: mockFn(),
} as any;

// Mock URL constructor for tests
(global as any).URL = global.URL || class URL {
  constructor(public href: string, base?: string) {}
};

// Mock performance API
(global as any).performance = {
  ...performance,
  now: mockFn(() => Date.now()),
  mark: mockFn(),
  measure: mockFn(),
  clearMarks: mockFn(),
  clearMeasures: mockFn(),
  getEntriesByType: mockFn(() => []),
  getEntriesByName: mockFn(() => []),
  getEntries: mockFn(() => []),
  timeOrigin: Date.now(),
};

// Mock WebGL context for tests
(global as any).WebGLRenderingContext = (global as any).WebGLRenderingContext || {};
(global as any).WebGL2RenderingContext = (global as any).WebGL2RenderingContext || {};

// Mock OffscreenCanvas
(global as any).OffscreenCanvas = (global as any).OffscreenCanvas || class OffscreenCanvas {
  constructor(public width: number, public height: number) {}
  getContext() { return null; }
  transferToImageBitmap() { return null; }
};

// Mock MediaQuery
(window as any).matchMedia = mockFn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: mockFn(),
  removeListener: mockFn(),
  addEventListener: mockFn(),
  removeEventListener: mockFn(),
  dispatchEvent: mockFn(),
}));

// Mock DOM methods
(window as any).scrollTo = mockFn();

// Mock fetch globally
(global as any).fetch = mockFn();

// Reset all mocks after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
}); 