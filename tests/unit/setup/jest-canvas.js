require('jest-canvas-mock')

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  observe = jest.fn()
  unobserve = jest.fn() 
  disconnect = jest.fn()
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe = jest.fn()
  unobserve = jest.fn()
  disconnect = jest.fn()
}

// Mock window methods
window.scrollTo = jest.fn()
window.alert = jest.fn()

// Mock console methods
console.error = jest.fn()
console.warn = jest.fn()
console.log = jest.fn()

// Global cleanup after each test
afterEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  sessionStorage.clear()
}) 