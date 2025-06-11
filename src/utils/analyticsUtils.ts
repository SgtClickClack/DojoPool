import { getAnalytics, logEvent as firebaseLogEvent, Analytics } from "firebase/analytics";
import { getPerformance, FirebasePerformance } from "firebase/performance";
import app from "../firebase/firebase"; // Adjusted import path if needed, assuming firebase.js is the default export

// Ensure app is not null before using it, especially if firebase initialization can fail
let analytics: Analytics | null = null;
let perf: FirebasePerformance | null = null;

if (app) {
  try {
    analytics = getAnalytics(app);
  } catch (e) {
    console.error("Failed to initialize Firebase Analytics:", e);
  }

  try {
    perf = getPerformance(app);
  } catch (e) {
    console.error("Failed to initialize Firebase Performance:", e);
  }
} else {
  console.error("Firebase app is not initialized. Analytics and Performance monitoring will be disabled.");
}

interface EventParams {
  [key: string]: any;
}

// NOTE: Use logError from src/services/ErrorLoggingService for all error logging.
// logErrorToAnalytics is for analytics event tracking only.

// Custom event logging
export const logCustomEvent = (eventName: string, eventParams: EventParams = {}): void => {
  if (analytics) {
    firebaseLogEvent(analytics, eventName, eventParams);
  } else {
    console.warn(`Analytics not initialized. Event not logged: ${eventName}`, eventParams);
  }
};

// Page view logging
export const logPageView = (pagePath: string, pageTitle: string): void => {
  if (analytics) {
    firebaseLogEvent(analytics, "page_view", {
      page_path: pagePath,
      page_title: pageTitle,
    });
  } else {
    console.warn(`Analytics not initialized. Page view not logged: ${pagePath}`);
  }
};

interface UserActionParams extends EventParams {}

// User action logging
export const logUserAction = (actionName: string, actionParams: UserActionParams = {}): void => {
  if (analytics) {
    firebaseLogEvent(analytics, actionName, {
      timestamp: new Date().toISOString(),
      ...actionParams,
    });
  } else {
    console.warn(`Analytics not initialized. User action not logged: ${actionName}`, actionParams);
  }
};

interface ErrorContext extends EventParams {}

// Error logging
export const logErrorToAnalytics = (error: Error, context: ErrorContext = {}): void => {
  if (analytics) {
    firebaseLogEvent(analytics, "error", {
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
export { analytics, perf };