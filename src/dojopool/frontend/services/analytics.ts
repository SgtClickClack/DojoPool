import { analytics } from '../config/[FB]firebase';
import { logEvent } from 'firebase/analytics';

class AnalyticsService {
  trackEvent(eventName: string, eventParams?: Record<string, any>) {
    // Only track events in production and client-side
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production' && analytics) {
      logEvent(analytics, eventName, eventParams);
    } else {
      console.log('Analytics event:', { name: eventName, params: eventParams });
    }
  }
}

export const analyticsService = new AnalyticsService(); 