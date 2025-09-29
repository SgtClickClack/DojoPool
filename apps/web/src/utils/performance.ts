/**
 * Performance Utilities
 * 
 * Provides comprehensive performance optimization tools:
 * - Image optimization
 * - Bundle analysis
 * - Performance monitoring
 * - Resource bundling
 */

import { getEnvConfig } from './apiHelpers';

/**
 * Image optimization configuration
 */
interface ImageOptimizationConfig {
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  width?: number;
  height?: number;
  blurDataUrl?: string;
  placeholder?: 'blur' | 'empty';
}

/**
 * Optimize image URL for Next.js Image component
 */
export const optimizeImageUrl = (
  src: string,
  config: ImageOptimizationConfig = {}
): string => {
  const {
    quality = 75,
    format = 'webp',
    width,
    height,
    blurDataUrl,
  } = config;

  // For external URLs, use Next.js Image optimization
  if (src.startsWith('http')) {
    const params = new URLSearchParams();
    
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    params.set('q', quality.toString());
    params.set('f', format);
    
    return `/api/_next/image?url=${encodeURIComponent(src)}&${params.toString()}`;
  }
  
  return src;
};

/**
 * Generate blur data URL for image placeholders
 */
export const generateBlurDataUrl = (width: number = 10, height: number = 10): string => {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f0f0f0"/>
  </svg>`;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/**
 * Performance monitoring utilities
 */
class PerformanceMonitor {
  private marks = new Map<string, number>();
  Private measurements = new Map<string, number>();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark?: string): number {
    const startTime = startMark ? this.marks.get(startMark) : 0;
    const endTime = performance.now();
    const duration = endTime - (startTime || 0);
    
    this.measurements.set(name, duration);
    return duration;
  }

  getMeasurement(name: string): number | undefined {
    return this.measurements.get(name);
  }

  getAllMeasurements(): Record<string, number> {
    return Object.fromEntries(this.measurements);
  }

  clear(): void {
    this.marks.clear();
    this.measurements.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Bundle size analysis utilities
 */
export const analyzeBundleImport = async (
  moduleName: string
): Promise<{ size: number; modules: string[] }> => {
  try {
    // This would typically use webpack-bundle-analyzer or similar
    // For now, return estimated values
    const estimatedSize = moduleName.includes('heavy') ? 500 : 100;
    
    return {
      size: estimatedSize,
      modules: [moduleName],
    };
  } catch (error) {
    console.warn(`Failed to analyze bundle for ${moduleName}:`, error);
    return { size: 0, modules: [] };
  }
};

/**
 * Resource preloading utilities
 */
export const preloadResource = (url: string, type: 'fetch' | 'image' | 'script'): void => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  
  switch (type) {
    case 'fetch':
      link.as = 'fetch';
      link.crossOrigin = 'anonymous';
      break;
    case 'image':
      link.as = 'image';
      break;
    case 'script':
      link.as = 'script';
      break;
  }
  
  document.head.appendChild(link);
};

/**
 * Service Worker utilities for performance
 */
export class ServiceWorkerManager {
  private isSupported = 'serviceWorker' in navigator;
  private registration: ServiceWorkerRegistration | null = null;

  async register(swPath: string): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported) return null;

    try {
      this.registration = await navigator.serviceWorker.register(swPath);
      console.log('Service Worker registered:', this.registration);
      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      await this.registration.unregister();
      this.registration = null;
      return true;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  isRegistered(): boolean {
    return this.registration !== null;
  }
}

export const swManager = new ServiceWorkerManager();

/**
 * Memory usage monitoring
 */
export const getMemoryInfo = (): {
  used: number;
  total: number;
  limit: number;
} | null => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize / 1024 / 1024, // MB
      total: memory.totalJSHeapSize / 1024 / 1024, // MB  
      limit: memory.jsHeapSizeLimit / 1024 / 1024, // MB
    };
  }
  
  return null;
};

/**
 * Route change performance tracking
 */
export const trackRouteChange = (route: string): void => {
  performanceMonitor.mark(`route-${route}`);
  
  const metrics = {
    route,
    timestamp: Date.now(),
    memory: getMemoryInfo(),
  };
  
  // Send metrics to analytics service
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'route_change', metrics);
  }
};

/**
 * Component render performance tracking
 */
export const trackComponentRender = (componentName: string): void => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      performanceMonitor.mark(`${componentName}-render-start`);
      const result = originalMethod.apply(this, args);
      performanceMonitor.measure(`${componentName}-render-duration`, `${componentName}-render-start`);
      
      return result;
    };
  };
};

/**
 * Lazy loading with intersection observer
 */
export class LazyLoader {
  private observer: IntersectionObserver | null = null;
  private elements = new Map<Element, () => void>();

  constructor(options: IntersectionObserverInit = {}) {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const callback = this.elements.get(element);
          
          if (callback) {
            callback();
            this.observer?.unobserve(element);
            this.elements.delete(element);
          }
        }
      });
    }, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options,
    });
  }

  observe(element: Element, callback: () => void): void {
    this.elements.set(element, callback);
    this.observer?.observe(element);
  }

  unobserve(element: Element): void {
    this.elements.delete(element);
    this.observer?.unobserve(element);
  }

  disconnect(): void {
    this.elements.clear();
    this.observer?.disconnect();
  }
}

export const lazyLoader = new LazyLoader();

/**
 * Critical resource identification
 */
export const getCriticalResources = (): string[] => {
  const criticalResources = [
    '/api/auth/[...nextauth].js',
    '/api/health.js',
    '/_next/static/css/main.css',
    '/_next/static/js/main.js',
  ];

  // Add environment-specific resources
  const config = getEnvConfig();
  if (config.googleMapsKey) {
    criticalResources.push('https://maps.googleapis.com/maps/api/js');
  }
  
  if (config.mapboxToken) {
    criticalResources.push('https://api.mapbox.com/mapbox-gl-js/v2.0.0/mapbox-gl.js');
  }

  return criticalResources;
};

/**
 * Resource loading optimization
 */
export const optimizeResourceLoading = {
  preloadCritical: () => {
    getCriticalResources().forEach(resource => {
      if (resource.startsWith('/')) {
        preloadResource(resource, 'script');
      } else {
        preloadResource(resource, 'script');
      }
    });
  },

  deferHeavyResources: () => {
    const heavyResources = [
      '/api/_next/image',
      '/api/v1/games',
      '/api/v1/clans',
      '/api/v1/territories',
    ];

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        heavyResources.forEach(resource => {
          fetch(resource).catch(() => {}); // Pre-warm cache
        });
      });
    }
  },
};

export default {
  optimizeImageUrl,
  generateBlurDataUrl,
  performanceMonitor,
  analyzeBundleImport,
  preloadResource,
  ServiceWorkerManager,
  swManager,
  getMemoryInfo,
  trackRouteChange,
  trackComponentRender,
  LazyLoader,
  lazyLoader,
  getCriticalResources,
  optimizeResourceLoading,
};
