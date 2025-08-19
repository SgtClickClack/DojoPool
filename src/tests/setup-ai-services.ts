// AI Services Test Setup
// This file configures mocks for all AI services before they are imported
import { vi } from 'vitest';

// Mock Socket.IO for all AI services
const mockSocket = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  connected: true,
  disconnected: false,
  io: {},
  id: 'mock-socket',
  close: vi.fn(),
  open: vi.fn(),
  send: vi.fn(),
  removeAllListeners: vi.fn(),
  removeListener: vi.fn(),
  listeners: vi.fn(),
  once: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

const mockIo = vi.fn(() => mockSocket as any);

// Mock socket.io-client globally
vi.mock('socket.io-client', () => ({
  io: mockIo,
}));

// Export mock objects for use in individual tests
export { mockSocket, mockIo };
