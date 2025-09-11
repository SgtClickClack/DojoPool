import {
  AnalyticsData,
  AnalyticsFilter,
  AnalyticsSSEEvent,
  RealtimeMetrics,
} from '@dojopool/types';

class AnalyticsService {
  private eventSource: EventSource | null = null;
  private analyticsCallbacks: Array<(data: AnalyticsData) => void> = [];
  private realtimeCallbacks: Array<(data: RealtimeMetrics) => void> = [];
  private errorCallbacks: Array<(error: Error) => void> = [];

  /**
   * Fetch initial analytics data (one-time request)
   */
  async getAnalyticsData(filter: AnalyticsFilter): Promise<AnalyticsData> {
    const params = new URLSearchParams({
      startDate: filter.startDate.toISOString(),
      endDate: filter.endDate.toISOString(),
    });

    const token = localStorage.getItem('auth_token');
    const response = await fetch(`/api/analytics/dashboard?${params}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch analytics data: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetch real-time metrics (one-time request)
   */
  async getRealtimeMetrics(hours: number = 24): Promise<RealtimeMetrics> {
    const params = new URLSearchParams({
      hours: hours.toString(),
    });

    const token = localStorage.getItem('auth_token');
    const response = await fetch(`/api/analytics/realtime?${params}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch realtime metrics: ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Start SSE stream for analytics data
   */
  startAnalyticsStream(filter?: AnalyticsFilter): void {
    this.stopStream(); // Stop any existing stream

    let url = '/api/analytics/stream';
    if (filter) {
      const params = new URLSearchParams({
        startDate: filter.startDate.toISOString(),
        endDate: filter.endDate.toISOString(),
      });
      url += `?${params}`;
    }

    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      try {
        const sseEvent: AnalyticsSSEEvent = JSON.parse(event.data);

        switch (sseEvent.type) {
          case 'analytics_update':
            this.analyticsCallbacks.forEach((callback) =>
              callback(sseEvent.data as AnalyticsData)
            );
            break;
          case 'realtime_update':
            this.realtimeCallbacks.forEach((callback) =>
              callback(sseEvent.data as RealtimeMetrics)
            );
            break;
          case 'error':
            const error = new Error(
              (sseEvent.data as any).message || 'SSE Error'
            );
            this.errorCallbacks.forEach((callback) => callback(error));
            break;
        }
      } catch (error) {
        console.error('Failed to parse SSE event:', error);
        this.errorCallbacks.forEach((callback) => callback(error as Error));
      }
    };

    this.eventSource.onerror = (event) => {
      console.error('SSE connection error:', event);
      const error = new Error('SSE connection failed');
      this.errorCallbacks.forEach((callback) => callback(error));
    };

    this.eventSource.onopen = () => {
      console.log('SSE connection opened');
    };
  }

  /**
   * Start SSE stream for real-time metrics only
   */
  startRealtimeStream(hours: number = 24): void {
    this.stopStream(); // Stop any existing stream

    const params = new URLSearchParams({
      hours: hours.toString(),
    });

    this.eventSource = new EventSource(
      `/api/analytics/realtime-stream?${params}`
    );

    this.eventSource.onmessage = (event) => {
      try {
        const sseEvent: AnalyticsSSEEvent = JSON.parse(event.data);

        switch (sseEvent.type) {
          case 'realtime_update':
            this.realtimeCallbacks.forEach((callback) =>
              callback(sseEvent.data as RealtimeMetrics)
            );
            break;
          case 'error':
            const error = new Error(
              (sseEvent.data as any).message || 'SSE Error'
            );
            this.errorCallbacks.forEach((callback) => callback(error));
            break;
        }
      } catch (error) {
        console.error('Failed to parse SSE event:', error);
        this.errorCallbacks.forEach((callback) => callback(error as Error));
      }
    };

    this.eventSource.onerror = (event) => {
      console.error('SSE realtime connection error:', event);
      const error = new Error('SSE realtime connection failed');
      this.errorCallbacks.forEach((callback) => callback(error));
    };

    this.eventSource.onopen = () => {
      console.log('SSE realtime connection opened');
    };
  }

  /**
   * Stop the current SSE stream
   */
  stopStream(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('SSE connection closed');
    }
  }

  /**
   * Subscribe to analytics updates
   */
  onAnalyticsUpdate(callback: (data: AnalyticsData) => void): () => void {
    this.analyticsCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.analyticsCallbacks.indexOf(callback);
      if (index > -1) {
        this.analyticsCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to real-time metrics updates
   */
  onRealtimeUpdate(callback: (data: RealtimeMetrics) => void): () => void {
    this.realtimeCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.realtimeCallbacks.indexOf(callback);
      if (index > -1) {
        this.realtimeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to SSE errors
   */
  onError(callback: (error: Error) => void): () => void {
    this.errorCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Check if SSE connection is active
   */
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  /**
   * Get connection state
   */
  getConnectionState(): EventSource['readyState'] | null {
    return this.eventSource?.readyState ?? null;
  }

  /**
   * Track custom events for user behavior analytics
   */
  async trackEvent(eventName: string, properties: Record<string, any> = {}) {
    try {
      const eventData = {
        event: eventName,
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          sessionId: this.getSessionId(),
        },
      };

      const token = localStorage.getItem('auth_token');
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(eventData),
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Get or create session ID for tracking
   */
  private getSessionId(): string {
    let sessionId = localStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Track page views
   */
  trackPageView(pageName: string, properties: Record<string, any> = {}) {
    this.trackEvent('page_view', {
      page: pageName,
      ...properties,
    });
  }

  /**
   * Track user interactions
   */
  trackInteraction(
    interactionType: string,
    element: string,
    properties: Record<string, any> = {}
  ) {
    this.trackEvent('user_interaction', {
      interaction_type: interactionType,
      element,
      ...properties,
    });
  }

  /**
   * Track game events
   */
  trackGameEvent(eventType: string, gameData: Record<string, any>) {
    this.trackEvent('game_event', {
      event_type: eventType,
      ...gameData,
    });
  }

  /**
   * Track conversion events
   */
  trackConversion(
    conversionType: string,
    value?: number,
    properties: Record<string, any> = {}
  ) {
    this.trackEvent('conversion', {
      conversion_type: conversionType,
      value,
      ...properties,
    });
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;
