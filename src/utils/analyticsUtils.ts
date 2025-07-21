import { getAnalytics, logEvent as firebaseLogEvent, Analytics } from "firebase/analytics";
import { getPerformance, FirebasePerformance } from "firebase/performance";
import { analytics as firebaseAnalytics, currentApp } from '../firebase/firebase';

let perf: FirebasePerformance | null = null;

if (currentApp) {
  try {
    perf = getPerformance(currentApp);
  } catch (e) {
    console.error("Failed to initialize Firebase Performance:", e);
  }
} else {
  console.error("Firebase app is not initialized. Performance monitoring will be disabled.");
}

interface EventParams {
  [key: string]: any;
}

// NOTE: Use logError from src/services/ErrorLoggingService for all error logging.
// logErrorToAnalytics is for analytics event tracking only.

// Custom event logging
export const logCustomEvent = (eventName: string, eventParams: EventParams = {}): void => {
  if (firebaseAnalytics) {
    firebaseLogEvent(firebaseAnalytics, eventName, eventParams);
  } else {
    console.warn(`Analytics not initialized. Event not logged: ${eventName}`, eventParams);
  }
};

// Page view logging
export const logPageView = (pagePath: string, pageTitle: string): void => {
  if (firebaseAnalytics) {
    firebaseLogEvent(firebaseAnalytics, "page_view", {
      page_path: pagePath,
      page_title: pageTitle,
    });
  } else {
    console.warn(`Analytics not initialized. Page view not logged: ${pagePath}`);
  }
};

interface UserActionParams extends EventParams {
  // Additional user action specific parameters can be added here
}

// User action logging
export const logUserAction = (actionName: string, actionParams: UserActionParams = {}): void => {
  if (firebaseAnalytics) {
    firebaseLogEvent(firebaseAnalytics, actionName, {
      timestamp: new Date().toISOString(),
      ...actionParams,
    });
  } else {
    console.warn(`Analytics not initialized. User action not logged: ${actionName}`, actionParams);
  }
};

interface ErrorContext extends EventParams {
  // Additional error context parameters can be added here
}

// Error logging
export const logErrorToAnalytics = (error: Error, context: ErrorContext = {}): void => {
  if (firebaseAnalytics) {
    firebaseLogEvent(firebaseAnalytics, "error", {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    });
  } else {
    console.warn("Analytics not initialized. Error not logged:", error, context);
  }
};

// Exporting initialized instances for direct use if needed, though functions are preferred
export { firebaseAnalytics as analytics, perf };