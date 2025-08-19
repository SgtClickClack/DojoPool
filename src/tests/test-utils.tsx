import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import userEvent from '@testing-library/user-event';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  queryClient?: QueryClient;
}

// Create a custom render function with all providers
const customRender = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  const {
    route = '/',
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
        },
      },
    }),
    ...renderOptions
  } = options;

  // Set initial route if provided
  window.history.pushState({}, 'Test page', route);

  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <BrowserRouter>
        <ChakraProvider>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </ChakraProvider>
      </BrowserRouter>
    );
  };

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllTheProviders, ...renderOptions }),
  };
};

// Re-export everything from testing-library/react
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Export additional utilities
export { userEvent };

// Export test setup utilities
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Mock data utilities
export const mockUser = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  isVerified: true,
  roles: ['user'],
};

export const mockGame = {
  id: '1',
  player1Id: '1',
  player2Id: '2',
  status: 'active',
  createdAt: new Date().toISOString(),
};

export const mockVenue = {
  id: '1',
  name: 'Test Venue',
  address: '123 Test St',
  city: 'Test City',
  latitude: 40.7128,
  longitude: -74.006,
};

// Helper for async testing
export const waitForCondition = (callback: () => void, timeout = 1000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const poll = () => {
      try {
        callback();
        resolve(true);
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(error);
        } else {
          setTimeout(poll, 10);
        }
      }
    };
    poll();
  });
};

// Test cleanup
export const cleanup = () => {
  // Clean up any test state
  if (global.fetch && typeof (global.fetch as any).mockClear === 'function') {
    (global.fetch as any).mockClear();
  }
};
