/**
 * Offline API Service
 * 
 * This service manages API requests when offline, saving them to be processed
 * when the user comes back online. It also provides cached data for read operations.
 */

// Define request types
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestConfig {
  url: string;
  method: HttpMethod;
  data?: any;
  headers?: Record<string, string>;
  offline?: {
    skip?: boolean; // Skip offline handling
    expiry?: number; // Custom expiry time in minutes
    key?: string; // Custom storage key
    allowStale?: boolean; // Allow returning stale data if online fails
  };
}

interface CachedResponse<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  headers?: Record<string, string>;
  status: number;
}

interface QueuedRequest {
  id: string;
  url: string;
  method: HttpMethod;
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retries: number;
}

// Default options
const DEFAULT_CACHE_EXPIRY = 60; // 60 minutes
const MAX_RETRIES = 3;

// Storage prefixes
const CACHE_PREFIX = 'api_cache:';
const QUEUE_KEY = 'api_request_queue';

class OfflineApiService {
  private online: boolean;
  private syncing: boolean;
  private syncListeners: (() => void)[];
  private statusChangeListeners: ((online: boolean) => void)[];

  constructor() {
    this.online = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.syncing = false;
    this.syncListeners = [];
    this.statusChangeListeners = [];

    // Set up online/offline listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnlineStatus);
      window.addEventListener('offline', this.handleOnlineStatus);
    }
  }

  // Handle online/offline status changes
  private handleOnlineStatus = () => {
    const wasOffline = !this.online;
    this.online = navigator.onLine;

    // Notify status change listeners
    this.statusChangeListeners.forEach(listener => listener(this.online));

    // If we're coming back online and weren't already syncing, start sync
    if (this.online && wasOffline && !this.syncing) {
      this.syncQueue();
    }
  };

  /**
   * Make an API request with offline support
   */
  async request<T = any>(config: RequestConfig): Promise<T> {
    const { url, method, data, headers = {}, offline = {} } = config;
    
    // If we're online and not skipping offline handling, try real request first
    if (this.online && !offline.skip) {
      try {
        // Make actual API request
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: method !== 'GET' ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const responseData = await response.json();

        // For GET requests, cache the successful response
        if (method === 'GET') {
          this.cacheResponse(url, responseData, offline.expiry);
        }

        return responseData;
      } catch (error) {
        console.error('API request failed:', error);
        
        // If it's a GET request and we're allowing stale data, try to get from cache
        if (method === 'GET' && offline.allowStale) {
          const cachedData = this.getCachedResponse<T>(url);
          if (cachedData) {
            return cachedData.data;
          }
        }
        
        // Otherwise, if offline handling isn't skipped, queue the request
        if (!offline.skip && method !== 'GET') {
          this.queueRequest(url, method, data, headers);
        }
        
        throw error;
      }
    }
    
    // If we're offline or offline handling is skipped
    else {
      // For GET requests, try to return cached data
      if (method === 'GET') {
        const cachedData = this.getCachedResponse<T>(url);
        if (cachedData) {
          return cachedData.data;
        }
        throw new Error('No cached data available for this request');
      }
      
      // For other methods, queue the request unless skipped
      if (!offline.skip) {
        this.queueRequest(url, method, data, headers);
        return { success: true, queued: true } as unknown as T;
      }
      
      throw new Error('Cannot process request while offline');
    }
  }

  /**
   * Cache a successful GET response
   */
  private cacheResponse<T>(url: string, data: T, customExpiry?: number): void {
    try {
      const timestamp = Date.now();
      const expiryMinutes = customExpiry || DEFAULT_CACHE_EXPIRY;
      const expiresAt = timestamp + expiryMinutes * 60 * 1000;
      
      const cachedResponse: CachedResponse<T> = {
        data,
        timestamp,
        expiresAt,
        status: 200,
      };
      
      localStorage.setItem(
        `${CACHE_PREFIX}${url}`,
        JSON.stringify(cachedResponse)
      );
    } catch (error) {
      console.error('Failed to cache response:', error);
    }
  }

  /**
   * Get a cached response if available and not expired
   */
  private getCachedResponse<T>(url: string): CachedResponse<T> | null {
    try {
      const cached = localStorage.getItem(`${CACHE_PREFIX}${url}`);
      if (!cached) return null;
      
      const cachedResponse = JSON.parse(cached) as CachedResponse<T>;
      
      // Check if cache has expired
      if (cachedResponse.expiresAt < Date.now()) {
        localStorage.removeItem(`${CACHE_PREFIX}${url}`);
        return null;
      }
      
      return cachedResponse;
    } catch (error) {
      console.error('Failed to get cached response:', error);
      return null;
    }
  }

  /**
   * Queue a request for later processing
   */
  private queueRequest(
    url: string,
    method: HttpMethod,
    data?: any,
    headers?: Record<string, string>
  ): void {
    try {
      // Get current queue
      const queueJson = localStorage.getItem(QUEUE_KEY) || '[]';
      const queue: QueuedRequest[] = JSON.parse(queueJson);
      
      // Add new request
      const newRequest: QueuedRequest = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url,
        method,
        data,
        headers,
        timestamp: Date.now(),
        retries: 0,
      };
      
      queue.push(newRequest);
      
      // Save updated queue
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      
      // If we're online, try to process the queue
      if (this.online && !this.syncing) {
        this.syncQueue();
      }
    } catch (error) {
      console.error('Failed to queue request:', error);
    }
  }

  /**
   * Sync pending requests when back online
   */
  async syncQueue(): Promise<void> {
    if (this.syncing || !this.online) return;
    
    this.syncing = true;
    
    try {
      // Get current queue
      const queueJson = localStorage.getItem(QUEUE_KEY) || '[]';
      let queue: QueuedRequest[] = JSON.parse(queueJson);
      
      if (queue.length === 0) {
        this.syncing = false;
        return;
      }
      
      // Process all requests
      const successfulIds: string[] = [];
      const failedRequests: QueuedRequest[] = [];
      
      for (const request of queue) {
        try {
          await fetch(request.url, {
            method: request.method,
            headers: {
              'Content-Type': 'application/json',
              ...request.headers,
            },
            body: request.method !== 'GET' ? JSON.stringify(request.data) : undefined,
          });
          
          successfulIds.push(request.id);
        } catch (error) {
          console.error(`Failed to sync request ${request.id}:`, error);
          
          // Increment retry count and keep in queue if under max retries
          if (request.retries < MAX_RETRIES) {
            failedRequests.push({
              ...request,
              retries: request.retries + 1,
            });
          }
        }
      }
      
      // Remove successful requests and update queue
      queue = queue.filter(req => !successfulIds.includes(req.id));
      
      // Add back failed requests that haven't exceeded max retries
      queue = [...queue, ...failedRequests];
      
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      
      // Notify listeners
      this.syncListeners.forEach(listener => listener());
    } catch (error) {
      console.error('Failed to sync queue:', error);
    } finally {
      this.syncing = false;
    }
  }

  /**
   * Get info about pending requests
   */
  getPendingRequestsInfo(): { count: number; oldestTimestamp: number | null } {
    try {
      const queueJson = localStorage.getItem(QUEUE_KEY) || '[]';
      const queue: QueuedRequest[] = JSON.parse(queueJson);
      
      if (queue.length === 0) {
        return { count: 0, oldestTimestamp: null };
      }
      
      // Find oldest timestamp
      const oldestTimestamp = Math.min(...queue.map(req => req.timestamp));
      
      return {
        count: queue.length,
        oldestTimestamp,
      };
    } catch (error) {
      console.error('Failed to get pending requests info:', error);
      return { count: 0, oldestTimestamp: null };
    }
  }

  /**
   * Clear all cached responses
   */
  clearCache(): void {
    try {
      // Get all localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return this.online;
  }

  /**
   * Add a listener for sync events
   */
  addSyncListener(listener: () => void): void {
    this.syncListeners.push(listener);
  }

  /**
   * Remove a sync listener
   */
  removeSyncListener(listener: () => void): void {
    this.syncListeners = this.syncListeners.filter(l => l !== listener);
  }

  /**
   * Add a listener for online status changes
   */
  addStatusChangeListener(listener: (online: boolean) => void): void {
    this.statusChangeListeners.push(listener);
  }

  /**
   * Remove a status change listener
   */
  removeStatusChangeListener(listener: (online: boolean) => void): void {
    this.statusChangeListeners = this.statusChangeListeners.filter(l => l !== listener);
  }

  /**
   * Clean up when service is no longer needed
   */
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnlineStatus);
      window.removeEventListener('offline', this.handleOnlineStatus);
    }
    
    this.syncListeners = [];
    this.statusChangeListeners = [];
  }
}

// Create singleton instance
export const offlineApiService = new OfflineApiService();

// React hook for functional components
export const useOfflineApi = () => {
  return {
    request: <T = any>(config: RequestConfig) => offlineApiService.request<T>(config),
    isOnline: offlineApiService.isOnline(),
    pendingRequests: offlineApiService.getPendingRequestsInfo(),
    clearCache: () => offlineApiService.clearCache(),
    syncQueue: () => offlineApiService.syncQueue(),
  };
};

export default offlineApiService;