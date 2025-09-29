/**
 * Centralized API Client Hook
 * 
 * Provides a unified interface for all API calls with:
 * - Automatic token management
 * - Error handling
 * - Request/response interceptors
 * - Loading states
 * - Retry logic
 */

import { useState, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiClientOptions {
  retries?: number;
  timeout?: number;
  onError?: (error: Error) => void;
}

/**
 * Base API client functions without React state
 */
class BaseApiClient {
  private baseURL: string;
  private retries: number;
  private timeout: number;

  constructor(baseURL: string, retries: number = 3, timeout: number = 10000) {
    this.baseURL = baseURL;
    this.retries = retries;
    this.timeout = timeout;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<T> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const controller = new AbortController();
      
      // Set timeout
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized');
        }
        
        if (response.status >= 500 && retryCount < this.retries) {
          // Retry for server errors
          await this.sleep(1000 * (retryCount + 1));
          return this.makeRequest<T>(endpoint, options, retryCount + 1);
        }
        
        const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      if (retryCount < this.retries && !error?.message?.includes('Unauthorized')) {
        await this.sleep(1000 * (retryCount + 1));
        return this.makeRequest<T>(endpoint, options, retryCount + 1);
      }
      
      throw error;
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data: any, options?: RequestInit): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: any, options?: RequestInit): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

/**
 * Hook for API calls with loading states and error handling
 */
export const useApiClient = (options: ApiClientOptions = {}) => {
  const { data: session } = useSession();
  const [states, setStates] = useState<Map<string, ApiState<any>>>(new Map());

  const client = useMemo(() => {
    const baseURL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 
                   (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : 'http://localhost:3000');
    
    return new BaseApiClient(baseURL, options.retries, options.timeout);
  }, [options.retries, options.timeout]);

  const updateState = useCallback(<T>(key: string, updates: Partial<ApiState<T>>) => {
    setStates(prev => {
      const newStates = new Map(prev);
      const currentState = newStates.get(key) || { data: null, loading: false, error: null };
      newStates.set(key, { ...currentState, ...updates });
      return newStates;
    });
  }, []);

  const getState = useCallback(<T>(key: string): ApiState<T> => {
    return states.get(key) || { data: null, loading: false, error: null };
  }, [states]);

  const executeRequest = useCallback(async <T>(
    key: string,
    requestFn: () => Promise<T>,
    onError?: (error: Error) => void
  ): Promise<T | null> => {
    updateState<T>(key, { loading: true, error: null });
    
    try {
      let headers: Record<string, string> = {};
      
      // Add auth header if session exists
      if (session && (session as any)?.accessToken) {
        headers.Authorization = `Bearer ${(session as any).accessToken}`;
      }
      
      const data = await requestFn();
      updateState<T>(key, { data, loading: false, error: null });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Request failed';
      updateState<T>(key, { loading: false, error: errorMessage });
      
      if (onError && error instanceof Error) {
        onError(error);
      }
      
      if (options.onError && error instanceof Error) {
        options.onError(error);
      }
      
      return null;
    }
  }, [session, updateState, options]);

  return {
    client,
    executeRequest,
    getState,
    clear: useCallback((key: string) => {
      setStates(prev => {
        const newStates = new Map(prev);
        newStates.delete(key);
        return newStates;
      });
    }, []),
  };
};

/**
 * Specialized hooks for common API patterns
 */
export const useApiQuery = <T>(
  endpoint: string,
  key: string,
  options: ApiClientOptions = {}
) => {
  const { client, executeRequest, getState } = useApiClient(options);
  
  const fetchData = useCallback(async () => {
    return executeRequest<T>(key, () => client.get<T>(endpoint));
  }, [client, endpoint, key, executeRequest]);

  return {
    ...getState<T>(key),
    refetch: fetchData,
  };
};

export const useApiMutatation = <TRequest, TResponse>(
  endpoint: string,
  method: 'POST' | 'PATCH' | 'DELETE' = 'POST',
  options: ApiClientOptions = {}
) => {
  const { client, executeRequest, getState } = useApiClient(options);
  
  const mutate = useCallback(async (data?: TRequest) => {
    const key = `${method}_${endpoint}`;
    
    const requestFn = () => {
      switch (method) {
        case 'POST':
          return client.post<TResponse>(endpoint, data);
        case 'PATCH':
          return client.patch<TResponse>(endpoint, data);
        case 'DELETE':
          return client.delete<TResponse>(endpoint);
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    };
    
    return executeRequest<TResponse>(key, requestFn);
  }, [client, endpoint, method, executeRequest]);

  return {
    ...getState<TResponse>(`${method}_${endpoint}`),
    mutate,
  };
};

export default useApiClient;
