import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';

// Create a theme instance for MUI (keep existing)
const muiTheme = createTheme({
  // Add your theme configuration here
});

// Create a basic Chakra UI system for testing outside the render function
const chakraSystemForTests = createSystem(defaultConfig, {});

// Custom render function for MUI (keep existing)
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>;
  };

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllTheProviders, ...options }),
  };
};

// Custom render function for Chakra UI
const renderWithChakra = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const ChakraTestProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <ChakraProvider value={chakraSystemForTests}>{children}</ChakraProvider>
    );
  };

  return render(ui, { wrapper: ChakraTestProviders, ...options });
};

// Helper function to wait for a condition (keep existing)
const waitForCondition = (condition: () => boolean, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (condition()) {
        clearInterval(interval);
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error('Timeout waiting for condition'));
      }
    }, 100);
  });
};

// Helper to create mock responses (keep existing)
const createMockResponse = (data: any, status = 200) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
};

// Helper to mock fetch responses (keep existing)
const mockFetch = (response: any) => {
  global.fetch = jest
    .fn()
    .mockImplementation(() => Promise.resolve(createMockResponse(response)));
};

// Helper to clear all mocks (keep existing)
const clearAllMocks = () => {
  jest.clearAllMocks();
  (global.fetch as any).mockClear();
  localStorage.clear();
  sessionStorage.clear();
};

// Re-export everything
export * from '@testing-library/react';
export {
  customRender as render, // Export MUI render as 'render' (keep existing alias)
  renderWithChakra, // Export new Chakra render helper
  waitForCondition,
  createMockResponse,
  mockFetch,
  clearAllMocks,
  userEvent,
};
