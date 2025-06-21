import { getAnalytics, logEvent as firebaseLogEvent, setUserId as firebaseSetUserId } from "firebase/analytics";
import app from "../../firebase/firebase";

class AnalyticsService {
  private analytics;

  constructor() {
    if (app) {
      this.analytics = getAnalytics(app);
    }
  }

  setUserId(userId: string) {
    if (this.analytics) {
      firebaseSetUserId(this.analytics, userId);
    }
  }

  logEvent(eventName: string, eventParams?: { [key: string]: any }) {
    if (this.analytics) {
      firebaseLogEvent(this.analytics, eventName, eventParams);
    }
  }

  trackEvent(eventName: string, eventParams?: { [key: string]: any }) {
    this.logEvent(eventName, eventParams);
  }
}

export const analyticsService = new AnalyticsService(); 