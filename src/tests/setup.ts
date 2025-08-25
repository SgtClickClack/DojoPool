// Vitest jsdom setup for DojoPool
// Aligns with docs/tasks.md Task 39 and the DojoPool Development Guidelines

import { vi } from 'vitest';
import 'whatwg-fetch';

// TextEncoder/TextDecoder polyfill (Node < 20 or certain envs)
if (typeof (globalThis as any).TextEncoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { TextEncoder, TextDecoder } = require('util');
  (globalThis as any).TextEncoder = TextEncoder;
  (globalThis as any).TextDecoder = TextDecoder;
}

// requestAnimationFrame / cancelAnimationFrame
if (!(globalThis as any).requestAnimationFrame) {
  (globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 16) as unknown as number;
}
if (!(globalThis as any).cancelAnimationFrame) {
  (globalThis as any).cancelAnimationFrame = (id: number) => clearTimeout(id as unknown as NodeJS.Timeout);
}

// matchMedia mock
if (typeof (window as any).matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// IntersectionObserver mock
if (typeof (globalThis as any).IntersectionObserver === 'undefined') {
  class MockIntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin = '0px';
    readonly thresholds: ReadonlyArray<number> = [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => [] as IntersectionObserverEntry[]);
  }
  (globalThis as any).IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
}

// ResizeObserver mock
if (typeof (globalThis as any).ResizeObserver === 'undefined') {
  class MockResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  ;(globalThis as any).ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
}

// localStorage/sessionStorage mocks
class MemoryStorage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
}

if (typeof (globalThis as any).localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
  });
}
if (typeof (globalThis as any).sessionStorage === 'undefined') {
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: new MemoryStorage(),
    configurable: true,
  });
}

// WebSocket mock (minimal)
if (typeof (globalThis as any).WebSocket === 'undefined') {
  class MockWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    readonly url: string;
    readyState = MockWebSocket.OPEN;
    binaryType: BinaryType = 'blob';
    onopen: ((this: WebSocket, ev: Event) => any) | null = null;
    onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
    onerror: ((this: WebSocket, ev: Event) => any) | null = null;
    onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null;

    constructor(url: string | URL) {
      this.url = String(url);
      setTimeout(() => this.onopen && this.onopen(new Event('open') as any), 0);
    }

    send = vi.fn();
    close = vi.fn();
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
    dispatchEvent = vi.fn();
  }
  (globalThis as any).WebSocket = MockWebSocket as unknown as typeof WebSocket;
}
