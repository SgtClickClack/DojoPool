/// <reference types="jest" />

import React from 'react';
import { render, act } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import BundleOptimizationDashboard from '../BundleOptimizationDashboard';

// Extend window interface for ResizeObserver
declare global {
  interface Window {
    ResizeObserver: any;
  }
}

// Performance testing utilities
const measurePerformance = async (callback: () => void) => {
  const start = performance.now();
  await callback();
  return performance.now() - start;
};

const generateMockData = (size: number) => {
  const dependencies: Record<string, number> = {};
  const chunks = [];

  for (let i = 0; i < size; i++) {
    dependencies[`dependency-${i}`] = Math.floor(Math.random() * 1024 * 1024);
    chunks.push({
      name: `chunk-${i}`,
      size: Math.floor(Math.random() * 1024 * 1024),
      dependencies: [`dependency-${i}`]
    });
  }

  return {
    total_size: Object.values(dependencies).reduce((a, b) => a + b, 0),
    chunks,
    dependencies,
    optimization_suggestions: ['Mock suggestion']
  };
};

// Mock fetch responses
const setupFetchMock = (data: any) => {
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data)
    })
  );
};

// Test wrapper component
const theme = createTheme();
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('BundleOptimizationDashboard Performance Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Mock window.ResizeObserver
    window.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Initial Render Performance', () => {
    it('should render quickly with small dataset', async () => {
      const smallData = generateMockData(10);
      setupFetchMock(smallData);

      const renderTime = await measurePerformance(() => {
        render(<BundleOptimizationDashboard />, { wrapper: TestWrapper });
      });

      expect(renderTime).toBeLessThan(100); // Initial render should be under 100ms
    });

    it('should handle large datasets efficiently', async () => {
      const largeData = generateMockData(1000);
      setupFetchMock(largeData);

      const renderTime = await measurePerformance(() => {
        render(<BundleOptimizationDashboard />, { wrapper: TestWrapper });
      });

      expect(renderTime).toBeLessThan(200); // Initial render with large data should be under 200ms
    });
  });

  describe('Update Performance', () => {
    it('should update threshold efficiently', async () => {
      const data = generateMockData(100);
      setupFetchMock(data);

      const { rerender } = render(<BundleOptimizationDashboard />, { wrapper: TestWrapper });

      const updateTime = await measurePerformance(async () => {
        await act(async () => {
          // Simulate threshold change
          const event = new Event('change');
          Object.defineProperty(event, 'target', { value: { value: 200 * 1024 } });
          document.dispatchEvent(event);
          jest.advanceTimersByTime(500); // Account for debounce
        });
      });

      expect(updateTime).toBeLessThan(50); // Updates should be under 50ms
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during updates', async () => {
      const data = generateMockData(100);
      setupFetchMock(data);

      const { unmount } = render(<BundleOptimizationDashboard />, { wrapper: TestWrapper });

      // Perform multiple updates
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          const event = new Event('change');
          Object.defineProperty(event, 'target', { value: { value: i * 1024 } });
          document.dispatchEvent(event);
          jest.advanceTimersByTime(500);
        });
      }

      // Check if all timeouts are cleared
      const timeoutsBefore = jest.getTimerCount();
      unmount();
      const timeoutsAfter = jest.getTimerCount();

      expect(timeoutsAfter).toBeLessThan(timeoutsBefore);
    });
  });

  describe('Cache Performance', () => {
    it('should serve cached data quickly', async () => {
      const data = generateMockData(100);
      setupFetchMock(data);

      const { rerender } = render(<BundleOptimizationDashboard />, { wrapper: TestWrapper });

      // First render to populate cache
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Measure cached render
      const cachedRenderTime = await measurePerformance(() => {
        rerender(<BundleOptimizationDashboard />);
      });

      expect(cachedRenderTime).toBeLessThan(50); // Cached renders should be very fast
    });
  });

  describe('Chart Rendering Performance', () => {
    it('should render charts efficiently', async () => {
      const data = generateMockData(50);
      setupFetchMock(data);

      const renderTime = await measurePerformance(() => {
        render(<BundleOptimizationDashboard />, { wrapper: TestWrapper });
      });

      expect(renderTime).toBeLessThan(150); // Chart rendering should be under 150ms
    });

    it('should handle chart resizing efficiently', async () => {
      const data = generateMockData(50);
      setupFetchMock(data);

      render(<BundleOptimizationDashboard />, { wrapper: TestWrapper });

      const resizeTime = await measurePerformance(() => {
        act(() => {
          window.dispatchEvent(new Event('resize'));
          jest.advanceTimersByTime(250); // Account for debounce
        });
      });

      expect(resizeTime).toBeLessThan(50); // Resize handling should be under 50ms
    });
  });

  describe('List Virtualization Performance', () => {
    it('should render large lists efficiently', async () => {
      const data = generateMockData(1000);
      setupFetchMock(data);

      const renderTime = await measurePerformance(() => {
        render(<BundleOptimizationDashboard />, { wrapper: TestWrapper });
      });

      expect(renderTime).toBeLessThan(200); // Large list rendering should be under 200ms
    });

    it('should scroll large lists smoothly', async () => {
      const data = generateMockData(1000);
      setupFetchMock(data);

      render(<BundleOptimizationDashboard />, { wrapper: TestWrapper });

      const scrollTime = await measurePerformance(() => {
        act(() => {
          // Simulate scroll event
          window.dispatchEvent(new Event('scroll'));
          jest.advanceTimersByTime(16); // One frame at 60fps
        });
      });

      expect(scrollTime).toBeLessThan(16); // Scroll handling should be under one frame
    });
  });
}); 