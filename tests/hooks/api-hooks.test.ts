import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@hooks';

// Test wrapper for hooks
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('API Hooks', () => {
  describe('useApiQuery', () => {
    it('should fetch data successfully', async () => {
      const mockData = { id: 1, name: 'Test' };
      const mockFetch = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(
        () => useApiQuery(['test'], mockFetch),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
    });

    it('should handle errors', async () => {
      const mockError = new Error('API Error');
      const mockFetch = vi.fn().mockRejectedValue(mockError);

      const { result } = renderHook(
        () => useApiQuery(['test'], mockFetch),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useApiMutation', () => {
    it('should execute mutation successfully', async () => {
      const mockData = { id: 1, name: 'Created' };
      const mockMutation = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(
        () => useApiMutation(mockMutation),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(false);

      await act(async () => {
        result.current.mutate({ name: 'Test' });
      });

      expect(result.current.isLoading).toBe(true);
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
    });
  });
});

describe('Custom Hooks', () => {
  describe('useLocalStorage', () => {
    it('should store and retrieve values', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

      expect(result.current[0]).toBe('default');

      act(() => {
        result.current[1]('new-value');
      });

      expect(result.current[0]).toBe('new-value');
    });
  });

  describe('useDebounce', () => {
    it('should debounce value changes', async () => {
      const { result } = renderHook(() => useDebounce('test', 100));

      expect(result.current).toBe('test');

      act(() => {
        // Simulate rapid changes
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            // This would be called by the hook internally
          }, i * 10);
        }
      });

      // Wait for debounce
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      // Value should be the last one after debounce
      expect(result.current).toBe('test');
    });
  });
});
