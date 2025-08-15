import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { cleanup } from '@testing-library/react';
import { vi } from 'vitest';

// Mock browser APIs
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

// Proper Vitest shim for compatibility
// Only expose Vitest-compatible APIs to prevent compatibility issues

// Mock IntersectionObserver
class IntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserver,
});

// Mock ResizeObserver
class ResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserver,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
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

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock console methods in test environment
const originalConsole = { ...console };
const mockConsole = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
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