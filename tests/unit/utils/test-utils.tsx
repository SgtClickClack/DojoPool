import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { createTheme } from "@mui/material/styles";
import userEvent from "@testing-library/user-event";

// Create a theme instance
const theme = createTheme({
  // Add your theme configuration here
});

// Custom render function
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => {
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
  };

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllTheProviders, ...options }),
  };
};

// Helper function to wait for a condition
const waitForCondition = (condition: () => boolean, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (condition()) {
        clearInterval(interval);
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error("Timeout waiting for condition"));
      }
    }, 100);
  });
};

// Helper to create mock responses
const createMockResponse = (data: any, status = 200) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
};

// Helper to mock fetch responses
const mockFetch = (response: any) => {
  global.fetch = jest
    .fn()
    .mockImplementation(() => Promise.resolve(createMockResponse(response)));
};

// Helper to clear all mocks
const clearAllMocks = () => {
  jest.clearAllMocks();
  global.fetch.mockClear();
  localStorage.clear();
  sessionStorage.clear();
};

// Re-export everything
export * from "@testing-library/react";
export {
  customRender as render,
  waitForCondition,
  createMockResponse,
  mockFetch,
  clearAllMocks,
  userEvent,
};
