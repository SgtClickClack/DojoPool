import { getAnalytics, logEvent } from "firebase/analytics";
import { getPerformance } from "firebase/performance";
import { app } from "../firebase";

// Initialize Firebase Analytics
export const analytics = getAnalytics(app);

// Initialize Performance Monitoring
export const perf = getPerformance(app);

// Custom event logging
export const logCustomEvent = (eventName, eventParams = {}) => {
  logEvent(analytics, eventName, eventParams);
};

// Page view logging
export const logPageView = (pagePath, pageTitle) => {
  logEvent(analytics, "page_view", {
    page_path: pagePath,
    page_title: pageTitle,
  });
};

// User action logging
export const logUserAction = (actionName, actionParams = {}) => {
  logEvent(analytics, actionName, {
    timestamp: new Date().toISOString(),
    ...actionParams,
  });
};

// Error logging
export const logError = (error, context = {}) => {
  logEvent(analytics, "error", {
    error_name: error.name,
    error_message: error.message,
    error_stack: error.stack,
    ...context,
  });
};
