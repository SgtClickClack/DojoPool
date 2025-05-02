import '@testing-library/jest-dom';
// import * as matchers from '@testing-library/jest-dom/matchers'; // Removed - main import handles extend
import fetch from 'node-fetch';
import { TextEncoder, TextDecoder } from 'util';
import { configure } from '@testing-library/react';

// // Extend Jest matchers - Removed - handled by main import
// expect.extend(matchers);

// Set default timeout for performance tests
jest.setTimeout(60000);

// Mock fetch globally
global.fetch = fetch as any;

// TextEncoder/TextDecoder polyfills
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock the performance.memory API
Object.defineProperty(performance, 'memory', {
  value: {
    jsHeapSizeLimit: 0,
    totalJSHeapSize: 0,
    usedJSHeapSize: 0
  },
  writable: true,
  configurable: true
});

// Enhanced WebGL context mock
class MockWebGLRenderingContext {
    drawingBufferWidth = 1920;
    drawingBufferHeight = 1080;
    isContextLost = () => false;
    getExtension = jest.fn().mockReturnValue({
        beginQuery: jest.fn(),
        endQuery: jest.fn(),
        getQueryObject: jest.fn().mockReturnValue(0)
    });
    getParameter = jest.fn().mockReturnValue(0);
    createTexture = jest.fn().mockReturnValue({});
    deleteTexture = jest.fn();
}

// Enhanced canvas mock
class MockCanvas extends HTMLCanvasElement {
    constructor() {
        super();
        this.width = 1920;
        this.height = 1080;
        this.getContext = jest.fn().mockReturnValue(new MockWebGLRenderingContext() as any);
    }
}

// Register mocks globally
global.WebGLRenderingContext = MockWebGLRenderingContext as any;
global.HTMLCanvasElement = MockCanvas as any;

// Mock Worker since it's not available in jsdom
global.Worker = class {
  url: string;
  onmessage: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(stringUrl: string) {
    this.url = stringUrl;
  }

  postMessage(msg: any) {
    // Mock implementation
  }

  terminate() {
    // Mock implementation
  }
} as any;

// Clean up after each test
afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
});

// Configure testing-library
configure({
    testIdAttribute: 'data-testid',
});

// Mock IntersectionObserver
class IntersectionObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserver,
});

Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserver,
});

// Mock ResizeObserver
class ResizeObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserver,
});

Object.defineProperty(global, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserver,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
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

// Mock window.scrollTo
window.scrollTo = jest.fn();

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

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Suppress console logs during tests
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

// Restore console after all tests
afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
});

// Configure testing-library
configure({
  testIdAttribute: 'data-testid',
});

// // Mock TensorFlow.js
// jest.mock('@tensorflow/tfjs', () => ({
//   loadLayersModel: jest.fn(),
//   tensor2d: jest.fn(),
//   sequential: jest.fn(),
//   layers: {
//     dense: jest.fn(),
//     flatten: jest.fn()
//   }
// }));

// Mock console.error to keep test output clean
global.console.error = jest.fn();

// Mock canvas and WebGL context
class OffscreenCanvas {
  width: number;
  height: number;
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  getContext(contextId: string, options?: any) {
    if (contextId === '2d' || contextId === 'webgl') {
        return {
            fillRect: jest.fn(),
            clearColor: jest.fn(),
            clear: jest.fn(),
            getExtension: jest.fn(),
            getParameter: jest.fn(),
            createTexture: jest.fn(),
            deleteTexture: jest.fn(),
            isContextLost: jest.fn().mockReturnValue(false)
        };
    }
    return null;
  }
}

global.OffscreenCanvas = OffscreenCanvas as any;

// Mock performance.now()
global.performance = {
  now: () => Date.now(),
} as any;

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

// // Mock WebGL context (simplified) - REMOVED as covered by earlier MockWebGLRenderingContext
// global.WebGLRenderingContext = class {
//     getExtension() { return {}; }
//     getParameter() { return 0; }
//     createTexture() { return {}; }
//     deleteTexture() {}
//     isContextLost() { return false; }
// } as any;

// // Mock HTMLCanvasElement (simplified) - REMOVED as covered by earlier MockCanvas
// global.HTMLCanvasElement = class {
//     getContext() { return new WebGLRenderingContext() as any; }
//     addEventListener() {}
//     removeEventListener() {}
// } as any;