export interface AnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  sessionId: string;
  userId?: string;
  properties?: Record<string, any>;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  category: 'navigation' | 'api' | 'render' | 'memory' | 'error';
}

export interface UserSession {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  events: AnalyticsEvent[];
  performance: PerformanceMetric[];
  userAgent: string;
  screenResolution: string;
  language: string;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private session: UserSession | null = null;
  private eventQueue: AnalyticsEvent[] = [];
  private performanceQueue: PerformanceMetric[] = [];
  private isOnline: boolean = navigator.onLine;
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds
  private readonly MAX_QUEUE_SIZE = 100;

  private constructor() {
    this.initializeSession();
    this.setupEventListeners();
    this.startPeriodicFlush();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private initializeSession(): void {
    const sessionId = this.generateSessionId();
    this.session = {
      sessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 0,
      events: [],
      performance: [],
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      language: navigator.language
    };

    console.log('[Analytics] Session initialized:', sessionId);
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupEventListeners(): void {
    // Online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushQueues();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Page visibility events
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('session', 'pause', 'page_hidden');
      } else {
        this.trackEvent('session', 'resume', 'page_visible');
      }
    });

    // Performance monitoring
    if ('performance' in window) {
      this.setupPerformanceMonitoring();
    }

    // Error tracking
    window.addEventListener('error', (event) => {
      this.trackError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason), {
        type: 'unhandledrejection'
      });
    });
  }

  private setupPerformanceMonitoring(): void {
    // Navigation timing
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0] as PerformanceNavigationTiming;
        this.trackPerformance('page_load_time', nav.loadEventEnd - nav.loadEventStart, 'ms', 'navigation');
        this.trackPerformance('dom_content_loaded', nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart, 'ms', 'navigation');
        this.trackPerformance('first_paint', nav.responseStart - nav.requestStart, 'ms', 'navigation');
      }
    }

    // Resource timing
    const resourceEntries = performance.getEntriesByType('resource');
    resourceEntries.forEach((entry) => {
      this.trackPerformance('resource_load', entry.duration, 'ms', 'api', {
        name: entry.name,
        type: entry.initiatorType
      });
    });

    // Memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.trackPerformance('memory_used', memory.usedJSHeapSize, 'bytes', 'memory');
      this.trackPerformance('memory_total', memory.totalJSHeapSize, 'bytes', 'memory');
    }
  }

  trackEvent(category: string, action: string, label?: string, value?: number, properties?: Record<string, any>): void {
    if (!this.session) return;

    const event: AnalyticsEvent = {
      event: 'user_action',
      category,
      action,
      label,
      value,
      timestamp: Date.now(),
      sessionId: this.session.sessionId,
      userId: this.getUserId(),
      properties
    };

    this.session.events.push(event);
    this.eventQueue.push(event);
    this.session.lastActivity = Date.now();

    console.log('[Analytics] Event tracked:', event);

    if (this.eventQueue.length >= this.MAX_QUEUE_SIZE) {
      this.flushQueues();
    }
  }

  trackPageView(page: string, properties?: Record<string, any>): void {
    if (!this.session) return;

    this.session.pageViews++;
    this.trackEvent('navigation', 'page_view', page, undefined, properties);
  }

  trackPerformance(name: string, value: number, unit: string, category: PerformanceMetric['category'], properties?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      category
    };

    this.performanceQueue.push(metric);
    console.log('[Analytics] Performance tracked:', metric);

    if (this.performanceQueue.length >= this.MAX_QUEUE_SIZE) {
      this.flushQueues();
    }
  }

  trackError(error: Error, properties?: Record<string, any>): void {
    this.trackEvent('error', 'javascript_error', error.message, undefined, {
      stack: error.stack,
      ...properties
    });

    this.trackPerformance('error_count', 1, 'count', 'error', {
      error_type: error.name,
      error_message: error.message
    });
  }

  trackApiCall(endpoint: string, method: string, duration: number, status: number): void {
    this.trackEvent('api', 'request', `${method} ${endpoint}`, status, {
      duration,
      method,
      endpoint,
      status
    });

    this.trackPerformance('api_response_time', duration, 'ms', 'api', {
      endpoint,
      method,
      status
    });
  }

  trackUserInteraction(element: string, action: string, properties?: Record<string, any>): void {
    this.trackEvent('interaction', action, element, undefined, properties);
  }

  trackGameEvent(gameType: string, action: string, properties?: Record<string, any>): void {
    this.trackEvent('game', action, gameType, undefined, properties);
  }

  trackDojoInteraction(dojoId: string, action: string, properties?: Record<string, any>): void {
    this.trackEvent('dojo', action, dojoId, undefined, properties);
  }

  private getUserId(): string | undefined {
    // Get user ID from localStorage or auth context
    return localStorage.getItem('userId') || undefined;
  }

  private startPeriodicFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flushQueues();
    }, this.FLUSH_INTERVAL);
  }

  private async flushQueues(): Promise<void> {
    if (!this.isOnline || (!this.eventQueue.length && !this.performanceQueue.length)) {
      return;
    }

    try {
      const eventsToSend = [...this.eventQueue];
      const performanceToSend = [...this.performanceQueue];

      this.eventQueue = [];
      this.performanceQueue = [];

      await this.sendAnalyticsData({
        events: eventsToSend,
        performance: performanceToSend,
        session: this.session
      });

      console.log('[Analytics] Data flushed successfully');
    } catch (error) {
      console.error('[Analytics] Failed to flush data:', error);
      // Re-add events to queue for retry
      this.eventQueue.unshift(...this.eventQueue);
      this.performanceQueue.unshift(...this.performanceQueue);
    }
  }

  private async sendAnalyticsData(data: {
    events: AnalyticsEvent[];
    performance: PerformanceMetric[];
    session: UserSession | null;
  }): Promise<void> {
    const baseUrl = '/api';
    const response = await fetch(`${baseUrl}/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.status}`);
    }
  }

  getSessionData(): UserSession | null {
    return this.session;
  }

  getEventCount(): number {
    return this.eventQueue.length;
  }

  getPerformanceCount(): number {
    return this.performanceQueue.length;
  }

  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Manual flush for testing or immediate sending
  async flush(): Promise<void> {
    await this.flushQueues();
  }

  // Cleanup method
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushQueues();
  }
}

// Export singleton instance
export const analytics = AnalyticsService.getInstance();

// Convenience functions
export const trackEvent = (category: string, action: string, label?: string, value?: number, properties?: Record<string, any>) => {
  analytics.trackEvent(category, action, label, value, properties);
};

export const trackPageView = (page: string, properties?: Record<string, any>) => {
  analytics.trackPageView(page, properties);
};

export const trackError = (error: Error, properties?: Record<string, any>) => {
  analytics.trackError(error, properties);
};

export const trackApiCall = (endpoint: string, method: string, duration: number, status: number) => {
  analytics.trackApiCall(endpoint, method, duration, status);
};

export const trackUserInteraction = (element: string, action: string, properties?: Record<string, any>) => {
  analytics.trackUserInteraction(element, action, properties);
};

export const trackGameEvent = (gameType: string, action: string, properties?: Record<string, any>) => {
  analytics.trackGameEvent(gameType, action, properties);
};

export const trackDojoInteraction = (dojoId: string, action: string, properties?: Record<string, any>) => {
  analytics.trackDojoInteraction(dojoId, action, properties);
}; 
