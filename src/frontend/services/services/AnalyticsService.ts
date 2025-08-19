import { apiClient } from '@/services/api';

export interface TrainingEvent {
  type:
    | 'start'
    | 'complete'
    | 'pause'
    | 'resume'
    | 'technique_start'
    | 'technique_complete';
  sessionId: string;
  techniqueId?: string;
  timestamp: string;
  duration?: number;
  metrics?: Record<string, number>;
}

export interface UserEvent {
  type: 'login' | 'logout' | 'profile_update' | 'achievement' | 'milestone';
  userId: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface PerformanceMetrics {
  loadTime: number;
  timeToInteractive: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
}

class AnalyticsService {
  private queue: Array<TrainingEvent | UserEvent> = [];
  private isProcessing = false;
  private batchSize = 10;
  private flushInterval = 30000; // 30 seconds

  constructor() {
    // Start periodic flush
    setInterval(() => this.flush(), this.flushInterval);

    // Listen for page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
    }
  }

  public trackTrainingEvent(event: Omit<TrainingEvent, 'timestamp'>): void {
    const fullEvent: TrainingEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    this.queue.push(fullEvent);
    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  public trackUserEvent(event: Omit<UserEvent, 'timestamp'>): void {
    const fullEvent: UserEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    this.queue.push(fullEvent);
    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  public trackPerformance(metrics: PerformanceMetrics): void {
    apiClient.post('/analytics/performance', {
      ...metrics,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.pathname,
    });
  }

  public async getUserAnalytics(userId: string): Promise<{
    trainingTime: number;
    completedSessions: number;
    averageAccuracy: number;
    skillProgression: Array<{ date: string; level: number }>;
    preferredTechniques: Array<{ techniqueId: string; count: number }>;
  }> {
    const response = await apiClient.get(`/analytics/user/${userId}`);
    return response.data;
  }

  public async getSessionAnalytics(sessionId: string): Promise<{
    duration: number;
    techniques: Array<{
      id: string;
      timeSpent: number;
      attempts: number;
      accuracy: number;
    }>;
    restPeriods: Array<{ start: string; end: string }>;
    intensityGraph: Array<{ timestamp: string; value: number }>;
  }> {
    const response = await apiClient.get(`/analytics/session/${sessionId}`);
    return response.data;
  }

  public async getTrendAnalytics(
    userId: string,
    timeframe: 'week' | 'month' | 'year'
  ): Promise<{
    trainingFrequency: Array<{ date: string; sessions: number }>;
    skillGrowth: Array<{ date: string; level: number }>;
    focusAreas: Array<{ category: string; percentage: number }>;
  }> {
    const response = await apiClient.get(`/analytics/trends/${userId}`, {
      params: { timeframe },
    });
    return response.data;
  }

  private async flush(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const events = [...this.queue];
    this.queue = [];

    try {
      await apiClient.post('/analytics/events', { events });
    } catch (error) {
      // On failure, add events back to the queue
      this.queue = [...events, ...this.queue];
      console.error('Failed to send analytics events:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  public async getRecommendationInsights(userId: string): Promise<{
    recommendedTechniques: string[];
    focusAreas: string[];
    skillGaps: string[];
    nextMilestones: Array<{ title: string; criteria: string }>;
  }> {
    const response = await apiClient.get(`/analytics/insights/${userId}`);
    return response.data;
  }

  public async exportAnalytics(
    userId: string,
    format: 'csv' | 'json'
  ): Promise<Blob> {
    const response = await apiClient.get(`/analytics/export/${userId}`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }
}

// Create a singleton instance
const analyticsService = new AnalyticsService();

export default analyticsService;
