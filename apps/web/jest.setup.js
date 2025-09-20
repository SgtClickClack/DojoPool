// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

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

Object.defineProperty(global, 'IntersectionObserver', {
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

Object.defineProperty(global, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserver,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: global.jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: global.jest.fn(), // Deprecated
    removeListener: global.jest.fn(), // Deprecated
    addEventListener: global.jest.fn(),
    removeEventListener: global.jest.fn(),
    dispatchEvent: global.jest.fn(),
  })),
});

// Mock scrollTo
window.scrollTo = global.jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: global.jest.fn(),
  setItem: global.jest.fn(),
  clear: global.jest.fn(),
  removeItem: global.jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
