import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../theme';

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );
};

// Mock response generator
export const createMockResponse = (data: any, status = 200) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers({ 'Content-Type': 'application/json' }),
  };
};

// Performance testing utilities
export const measurePerformance = async (callback: () => Promise<void> | void) => {
  const start = performance.now();
  await callback();
  return performance.now() - start;
};

// Mock WebSocket class for testing
export class MockWebSocket {
  static instances: MockWebSocket[] = [];
  onmessage: ((event: any) => void) | null = null;
  onclose: ((event: any) => void) | null = null;
  onopen: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  readyState: number = WebSocket.CONNECTING;
  url: string;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send = jest.fn();
  close = jest.fn();
}

// Test data generators
export const generateTestUser = (overrides = {}) => ({
  id: Math.random().toString(36).substr(2, 9),
  username: 'testuser',
  email: 'test@example.com',
  ...overrides,
});

export const generateTestGame = (overrides = {}) => ({
  id: Math.random().toString(36).substr(2, 9),
  players: [generateTestUser(), generateTestUser()],
  status: 'active',
  score: [0, 0],
  ...overrides,
}); 