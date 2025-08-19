import { TextEncoder, TextDecoder } from 'util';
import { vi } from 'vitest';

// Set up Node.js globals for integration tests
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

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

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});
