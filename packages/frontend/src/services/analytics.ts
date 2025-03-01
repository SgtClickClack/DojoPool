/**
 * Service for tracking analytics events
 */
class AnalyticsService {
  /**
   * Track an analytics event
   * @param eventName The name of the event
   * @param eventData Additional data for the event
   */
  public trackEvent(eventName: string, eventData: any = {}): void {
    try {
      // In a real implementation, this would send data to an analytics service
      // like Google Analytics, Mixpanel, Segment, etc.
      console.log(`ANALYTICS EVENT: ${eventName}`, eventData);
      
      // Mock analytics data collection
      const timestamp = new Date().toISOString();
      const sessionId = this.getSessionId();
      const analyticsData = {
        event: eventName,
        timestamp,
        sessionId,
        ...eventData
      };
      
      // This would normally be sent to an analytics backend
      console.log('Analytics data:', analyticsData);
    } catch (error) {
      console.error('Error tracking analytics event:', error);
    }
  }
  
  /**
   * Get or create a session ID for analytics tracking
   * @returns Session ID
   */
  private getSessionId(): string {
    let sessionId = localStorage.getItem('analytics_session_id');
    
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('analytics_session_id', sessionId);
    }
    
    return sessionId;
  }
  
  /**
   * Initialize analytics service with user data
   * @param userData User data for analytics
   */
  public initializeWithUser(userData: { userId?: string; [key: string]: any }): void {
    try {
      // This would normally set up user identification in analytics service
      console.log('Analytics initialized with user data:', userData);
    } catch (error) {
      console.error('Error initializing analytics with user data:', error);
    }
  }
  
  /**
   * Track a page view
   * @param pageName Name of the page
   * @param pageData Additional page data
   */
  public trackPageView(pageName: string, pageData: any = {}): void {
    this.trackEvent('page_view', {
      page: pageName,
      ...pageData
    });
  }
}

// Export a singleton instance
export const analyticsService = new AnalyticsService(); 