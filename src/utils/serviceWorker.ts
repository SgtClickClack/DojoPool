export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;
  private config: ServiceWorkerConfig = {};

  private constructor() {}

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  async register(config: ServiceWorkerConfig = {}): Promise<ServiceWorkerRegistration | null> {
    this.config = config;

    if (!('serviceWorker' in navigator)) {
      console.warn('[SW] Service Worker not supported');
      this.config.onError?.(new Error('Service Worker not supported'));
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[SW] Service Worker registered successfully:', this.registration);

      this.setupEventListeners();
      this.config.onSuccess?.(this.registration);

      return this.registration;
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error);
      this.config.onError?.(error as Error);
      return null;
    }
  }

  private setupEventListeners(): void {
    if (!this.registration) return;

    // Handle service worker updates
    this.registration.addEventListener('updatefound', () => {
      console.log('[SW] Update found');
      const newWorker = this.registration!.installing;
      
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW] New content available');
            this.config.onUpdate?.(this.registration!);
          }
        });
      }
    });

    // Handle service worker controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Controller changed');
      window.location.reload();
    });

    // Handle service worker messages
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('[SW] Message from service worker:', event.data);
      this.handleServiceWorkerMessage(event.data);
    });
  }

  private handleServiceWorkerMessage(data: any): void {
    switch (data.type) {
      case 'BACKGROUND_SYNC':
        console.log('[SW] Background sync message:', data.message);
        // Handle background sync operations
        break;
      case 'CACHE_UPDATED':
        console.log('[SW] Cache updated:', data.cacheName);
        // Handle cache updates
        break;
      default:
        console.log('[SW] Unknown message type:', data.type);
    }
  }

  async update(): Promise<void> {
    if (!this.registration) {
      console.warn('[SW] No service worker registration found');
      return;
    }

    try {
      await this.registration.update();
      console.log('[SW] Service worker update requested');
    } catch (error) {
      console.error('[SW] Service worker update failed:', error);
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) {
      console.warn('[SW] No service worker registration found');
      return false;
    }

    try {
      const result = await this.registration.unregister();
      console.log('[SW] Service worker unregistered:', result);
      this.registration = null;
      return result;
    } catch (error) {
      console.error('[SW] Service worker unregistration failed:', error);
      return false;
    }
  }

  async clearCaches(): Promise<void> {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('[SW] All caches cleared');
    } catch (error) {
      console.error('[SW] Cache clearing failed:', error);
    }
  }

  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  isSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  isActive(): boolean {
    return !!this.registration?.active;
  }

  isInstalling(): boolean {
    return !!this.registration?.installing;
  }

  isWaiting(): boolean {
    return !!this.registration?.waiting;
  }
}

// Default registration function
export async function registerServiceWorker(config?: ServiceWorkerConfig): Promise<ServiceWorkerRegistration | null> {
  return ServiceWorkerManager.getInstance().register(config);
}

// Default unregistration function
export async function unregisterServiceWorker(): Promise<boolean> {
  return ServiceWorkerManager.getInstance().unregister();
}

// Utility function to check if app is running from service worker
export function isRunningFromServiceWorker(): boolean {
  return !!(navigator.serviceWorker && navigator.serviceWorker.controller);
}

// Utility function to get service worker status
export function getServiceWorkerStatus(): {
  supported: boolean;
  active: boolean;
  installing: boolean;
  waiting: boolean;
} {
  const manager = ServiceWorkerManager.getInstance();
  return {
    supported: manager.isSupported(),
    active: manager.isActive(),
    installing: manager.isInstalling(),
    waiting: manager.isWaiting()
  };
} 