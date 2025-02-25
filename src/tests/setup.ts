import '@testing-library/jest-dom';
import { jest, afterEach } from '@jest/globals';

// Mock performance.now() for consistent testing
const mockPerformanceNow = jest.fn(() => 1234567890.123);
(global as any).performance = {
    ...(global as any).performance,
    now: mockPerformanceNow,
};

// Mock WebSocket for testing
class MockWebSocket {
    onopen: ((event: any) => void) | null = null;
    onclose: ((event: any) => void) | null = null;
    onmessage: ((event: any) => void) | null = null;
    onerror: ((event: any) => void) | null = null;
    
    send(data: string): void {}
    close(): void {}
}

(global as any).WebSocket = MockWebSocket;

// Increase test timeout for performance tests
jest.setTimeout(10000);

// Clear all mocks after each test
afterEach(() => {
    jest.clearAllMocks();
}); 