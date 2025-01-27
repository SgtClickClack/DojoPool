import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Mock fetch globally
global.fetch = jest.fn();

// Mock setImmediate for Node environments
global.setImmediate = (callback: Function) => setTimeout(callback, 0);

// Mock TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Google Maps
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

(global as any).navigator.geolocation = mockGeolocation;

// Mock window.URL
(global as any).URL.createObjectURL = jest.fn();
(global as any).URL.revokeObjectURL = jest.fn();

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

(global as any).IntersectionObserver = MockIntersectionObserver;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock performance.now
if (!global.performance) {
  (global as any).performance = {
    now: jest.fn(() => Date.now()),
  };
}

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
  mockLocalStorage.clear();
});
