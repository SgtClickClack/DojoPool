import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder as NodeTextDecoder } from "util";
import { MockWebSocket } from "./utils/testUtils";
import { configure } from "@testing-library/react";
import { jest, afterEach } from "@jest/globals";

// TextEncoder/TextDecoder polyfills
global.TextEncoder = TextEncoder;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, "localStorage", { value: localStorageMock });
Object.defineProperty(window, "sessionStorage", { value: sessionStorageMock });

// Mock WebSocket
Object.defineProperty(window, "WebSocket", { value: MockWebSocket });

// Mock ResizeObserver
class ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

window.ResizeObserver = ResizeObserver;

// Mock IntersectionObserver
class IntersectionObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: IntersectionObserver,
});

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock performance.now
const mockPerformanceNow = jest.fn(() => Date.now());
const mockRequestAnimationFrame = jest.fn((callback: FrameRequestCallback) =>
  setTimeout(() => callback(performance.now()), 0),
);
const mockCancelAnimationFrame = jest.fn((id: number) => clearTimeout(id));

global.requestAnimationFrame = mockRequestAnimationFrame;
global.cancelAnimationFrame = mockCancelAnimationFrame;
global.performance.now = mockPerformanceNow;

// Mock canvas context
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  drawImage: jest.fn(),
  getImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(100),
    width: 10,
    height: 10,
  })),
  putImageData: jest.fn(),
  clearRect: jest.fn(),
  scale: jest.fn(),
  translate: jest.fn(),
  fillRect: jest.fn(),
  fillText: jest.fn(),
  measureText: jest.fn(() => ({ width: 50 })),
}));

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  document.body.innerHTML = "";
});

// Global test timeout
jest.setTimeout(10000);

// Configure testing-library
configure({
  testIdAttribute: "data-testid",
});

// Add any global test utilities or mocks here
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Add TextDecoder mock
class MockTextDecoder implements TextDecoder {
  encoding: string;
  fatal: boolean;
  ignoreBOM: boolean;

  constructor() {
    this.encoding = "utf-8";
    this.fatal = false;
    this.ignoreBOM = false;
  }

  decode(input?: BufferSource): string {
    if (!input) return "";
    if (input instanceof ArrayBuffer) {
      return new NodeTextDecoder().decode(input);
    }
    return "";
  }
}

global.TextDecoder = MockTextDecoder as unknown as typeof TextDecoder;
