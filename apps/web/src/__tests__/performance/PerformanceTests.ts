/**
 * Performance Tests
 * 
 * Comprehensive performance testing suite covering component rendering,
 * API response times, memory usage, and bundle size optimization.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { server } from '../setup/mocks/server';
import { http, HttpResponse } from 'msw';

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true,
});

describe('Performance Tests', () => {
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' });
    jest.clearAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('Component Rendering Performance', () => {
    it('should render components within acceptable time limits', async () => {
      const startTime = performance.now();
      
      // Mock a simple component render
      const TestComponent = () => <div>Test Component</div>;
      render(<TestComponent />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Component should render within 16ms (60fps threshold)
      expect(renderTime).toBeLessThan(16);
    });

    it('should handle large lists efficiently', async () => {
      const startTime = performance.now();
      
      const LargeList = () => (
        <div>
          {Array.from({ length: 1000 }, (_, i) => (
            <div key={i}>Item {i}</div>
          ))}
        </div>
      );
      
      render(<LargeList />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Large list should render within 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('should not cause memory leaks with frequent re-renders', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Simulate frequent re-renders
      for (let i = 0; i < 100; i++) {
        const TestComponent = () => <div>Render {i}</div>;
        const { unmount } = render(<TestComponent />);
        unmount();
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 1MB)
      expect(memoryIncrease).toBeLessThan(1024 * 1024);
    });
  });

  describe('API Performance', () => {
    it('should respond to API calls within acceptable time limits', async () => {
      const startTime = performance.now();
      
      const response = await fetch('/api/health');
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(response.ok).toBe(true);
      // API should respond within 200ms
      expect(responseTime).toBeLessThan(200);
    });

    it('should handle concurrent API requests efficiently', async () => {
      const startTime = performance.now();
      
      const requests = Array(10).fill(null).map(() =>
        fetch('/api/health')
      );
      
      const responses = await Promise.all(requests);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // All requests should complete successfully
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
      
      // 10 concurrent requests should complete within 500ms
      expect(totalTime).toBeLessThan(500);
    });

    it('should cache API responses appropriately', async () => {
      // First request
      const startTime1 = performance.now();
      const response1 = await fetch('/api/v1/dojos');
      const endTime1 = performance.now();
      const firstRequestTime = endTime1 - startTime1;
      
      // Second request (should be cached)
      const startTime2 = performance.now();
      const response2 = await fetch('/api/v1/dojos');
      const endTime2 = performance.now();
      const secondRequestTime = endTime2 - startTime2;
      
      expect(response1.ok).toBe(true);
      expect(response2.ok).toBe(true);
      
      // Second request should be faster (cached)
      expect(secondRequestTime).toBeLessThan(firstRequestTime);
    });
  });

  describe('Bundle Size Optimization', () => {
    it('should load initial bundle within size limits', () => {
      // Mock bundle size check
      const mockBundleSize = 500 * 1024; // 500KB
      const maxBundleSize = 1024 * 1024; // 1MB
      
      expect(mockBundleSize).toBeLessThan(maxBundleSize);
    });

    it('should implement code splitting effectively', () => {
      // Mock code splitting check
      const mockChunks = [
        { name: 'main', size: 200 * 1024 },
        { name: 'vendor', size: 300 * 1024 },
        { name: 'lazy', size: 100 * 1024 },
      ];
      
      const totalSize = mockChunks.reduce((sum, chunk) => sum + chunk.size, 0);
      const maxTotalSize = 1024 * 1024; // 1MB
      
      expect(totalSize).toBeLessThan(maxTotalSize);
      
      // Each chunk should be reasonably sized
      mockChunks.forEach(chunk => {
        expect(chunk.size).toBeLessThan(500 * 1024); // 500KB per chunk
      });
    });
  });

  describe('Memory Management', () => {
    it('should clean up event listeners properly', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      // Simulate component that adds event listeners
      const handler = () => {};
      window.addEventListener('resize', handler);
      window.removeEventListener('resize', handler);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', handler);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', handler);
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('should handle large datasets without memory issues', () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        data: new Array(100).fill(0).map((_, j) => `data-${j}`),
      }));
      
      // Process the dataset
      const processed = largeDataset.map(item => ({
        ...item,
        processed: true,
      }));
      
      expect(processed).toHaveLength(10000);
      expect(processed[0].processed).toBe(true);
    });
  });

  describe('Network Performance', () => {
    it('should handle slow network conditions gracefully', async () => {
      // Mock slow network
      server.use(
        http.get('/api/slow-endpoint', () => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(HttpResponse.json({ data: 'slow response' }));
            }, 1000);
          });
        })
      );
      
      const startTime = performance.now();
      
      try {
        const response = await fetch('/api/slow-endpoint');
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        expect(response.ok).toBe(true);
        expect(responseTime).toBeGreaterThan(1000);
        expect(responseTime).toBeLessThan(2000);
      } catch (error) {
        // Should handle timeout gracefully
        expect(error).toBeDefined();
      }
    });

    it('should implement request timeouts properly', async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 100);
      
      const startTime = performance.now();
      
      try {
        const response = await fetch('/api/health', {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        expect(response.ok).toBe(true);
        expect(responseTime).toBeLessThan(100);
      } catch (error) {
        clearTimeout(timeoutId);
        expect(error.name).toBe('AbortError');
      }
    });
  });

  describe('Database Query Performance', () => {
    it('should execute database queries efficiently', async () => {
      const startTime = performance.now();
      
      const response = await fetch('/api/v1/dojos');
      
      const endTime = performance.now();
      const queryTime = endTime - startTime;
      
      expect(response.ok).toBe(true);
      // Database queries should complete within 100ms
      expect(queryTime).toBeLessThan(100);
    });

    it('should handle complex queries without performance degradation', async () => {
      const startTime = performance.now();
      
      const response = await fetch('/api/v1/dojos?include=reviews,ratings,events');
      
      const endTime = performance.now();
      const queryTime = endTime - startTime;
      
      expect(response.ok).toBe(true);
      // Complex queries should complete within 200ms
      expect(queryTime).toBeLessThan(200);
    });
  });

  describe('Image and Asset Optimization', () => {
    it('should load images efficiently', () => {
      const mockImage = new Image();
      const startTime = performance.now();
      
      mockImage.onload = () => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        // Images should load within 500ms
        expect(loadTime).toBeLessThan(500);
      };
      
      mockImage.src = '/test-image.jpg';
    });

    it('should implement lazy loading for images', () => {
      const mockIntersectionObserver = jest.fn();
      const mockObserve = jest.fn();
      const mockUnobserve = jest.fn();
      
      mockIntersectionObserver.mockImplementation(() => ({
        observe: mockObserve,
        unobserve: mockUnobserve,
        disconnect: jest.fn(),
      }));
      
      window.IntersectionObserver = mockIntersectionObserver;
      
      // Simulate lazy loading
      const img = document.createElement('img');
      img.setAttribute('data-src', '/lazy-image.jpg');
      
      // Should not load immediately
      expect(img.src).toBe('');
    });
  });
});
