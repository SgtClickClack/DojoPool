import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Mock browser APIs
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

// Proper Jest shim for Vitest compatibility
// Only expose Jest-compatible APIs to prevent compatibility issues
if (typeof global.jest === 'undefined') {
  global.jest = {
    fn: vi.fn,
    mock: vi.mock,
    unmock: vi.unmock,
    resetModules: vi.resetModules,
    clearAllMocks: vi.clearAllMocks,
    restoreAllMocks: vi.restoreAllMocks,
    resetAllMocks: vi.resetAllMocks,
    spyOn: vi.spyOn,
    advanceTimersByTime: vi.advanceTimersByTime,
    advanceTimersToNextTimer: vi.advanceTimersToNextTimer,
    runAllTimers: vi.runAllTimers,
    runOnlyPendingTimers: vi.runOnlyPendingTimers,
    useRealTimers: vi.useRealTimers,
    useFakeTimers: vi.useFakeTimers,
    getTimerCount: vi.getTimerCount,
    isMockFunction: vi.isMockFunction,
    mocked: vi.mocked,
  } as any;
}

// Mock IntersectionObserver
class IntersectionObserver {
  observe = global.jest.fn();
  disconnect = global.jest.fn();
  unobserve = global.jest.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserver,
});

// Mock ResizeObserver
class ResizeObserver {
  observe = global.jest.fn();
  disconnect = global.jest.fn();
  unobserve = global.jest.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserver,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: global.jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: global.jest.fn(),
    removeListener: global.jest.fn(),
    addEventListener: global.jest.fn(),
    removeEventListener: global.jest.fn(),
    dispatchEvent: global.jest.fn(),
  })),
});

// Mock scrollTo
window.scrollTo = global.jest.fn();

// Mock fetch
global.fetch = global.jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: global.jest.fn(),
  setItem: global.jest.fn(),
  removeItem: global.jest.fn(),
  clear: global.jest.fn(),
  length: 0,
  key: global.jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: global.jest.fn(),
  setItem: global.jest.fn(),
  removeItem: global.jest.fn(),
  clear: global.jest.fn(),
  length: 0,
  key: global.jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  global.jest.clearAllMocks();
});

// Mock console methods in test environment
const originalConsole = { ...console };
const mockConsole = {
  ...console,
  error: global.jest.fn(),
  warn: global.jest.fn(),
  log: global.jest.fn(),
};

beforeAll(() => {
  global.console = mockConsole;
});

afterAll(() => {
  global.console = originalConsole;
});

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback): number => {
  return setTimeout(() => callback(Date.now()), 0) as unknown as number;
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

// Mock WebSocket
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  onopen: ((this: WebSocket, ev: Event) => any) | null = null;
  onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
  onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null;
  onerror: ((this: WebSocket, ev: Event) => any) | null = null;
  readyState: number = WebSocket.CONNECTING;
  url: string;
  // WebSocket interface properties
  binaryType: BinaryType = 'blob';
  bufferedAmount: number = 0;
  extensions: string = '';
  protocol: string = '';
  CONNECTING: number = WebSocket.CONNECTING;
  OPEN: number = WebSocket.OPEN;
  CLOSING: number = WebSocket.CLOSING;
  CLOSED: number = WebSocket.CLOSED;
  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return false; }
}
Object.defineProperty(window, 'WebSocket', {
  writable: true,
  configurable: true,
  value: MockWebSocket,
});

(global as any).URL = global.URL || class URL {
  constructor(public href: string, base?: string) {}
};

(global as any).OffscreenCanvas = (global as any).OffscreenCanvas || class OffscreenCanvas {
  constructor(public width: number, public height: number) {}
  getContext() { return null; }
  transferToImageBitmap() { return null; }
}; 