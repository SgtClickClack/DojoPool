import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { vi, Mock } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Create a custom render function that includes providers
const customRender = (
  ui: ReactElement,
  {
    route = '/',
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
        },
      },
    }),
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
};

// Mock API response helper
interface MockResponse<T = unknown> {
  ok: boolean;
  status: number;
  json: () => Promise<T>;
  text: () => Promise<string>;
  headers?: Headers;
}

const createMockResponse = <T>(
  data: T,
  status = 200,
  headers = new Headers()
): MockResponse<T> => ({
  ok: status >= 200 && status < 300,
  status,
  headers,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
});

// Mock fetch helper
const mockFetch = <T>(response: MockResponse<T>): Mock => {
  return vi.fn().mockResolvedValue(response);
};

// Mock WebSocket helper
const createMockWebSocket = () => {
  const mockWs = {
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onopen: null as ((this: WebSocket, ev: Event) => any) | null,
    onclose: null as ((this: WebSocket, ev: CloseEvent) => any) | null,
    onmessage: null as ((this: WebSocket, ev: MessageEvent) => any) | null,
    onerror: null as ((this: WebSocket, ev: Event) => any) | null,
    readyState: WebSocket.CONNECTING,
    url: 'ws://localhost',
  };

  return mockWs;
};

// Mock localStorage helper
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};

// Mock sessionStorage helper
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};

// Mock IntersectionObserver helper
const mockIntersectionObserver = {
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
};

// Mock ResizeObserver helper
const mockResizeObserver = {
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
};

// Mock performance helper
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
  getEntries: vi.fn(() => []),
  timeOrigin: Date.now(),
};

// Reset all mocks helper
const resetAllMocks = () => {
  vi.clearAllMocks();
  mockLocalStorage.clear();
  mockSessionStorage.clear();
  mockIntersectionObserver.disconnect();
  mockResizeObserver.disconnect();
  mockPerformance.clearMarks();
  mockPerformance.clearMeasures();
};

export {
  customRender,
  createMockResponse,
  mockFetch,
  createMockWebSocket,
  mockLocalStorage,
  mockSessionStorage,
  mockIntersectionObserver,
  mockResizeObserver,
  mockPerformance,
  resetAllMocks,
};

// Re-export testing-library utilities
export * from '@testing-library/react';
export * from '@testing-library/user-event';
export * from '@testing-library/jest-dom'; 