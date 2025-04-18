// Web Vitals
export const reportWebVitals = (metric: any) => {
  // Send to Google Analytics
  if (process.env.NEXT_PUBLIC_GA_TRACKING_ID) {
    window.gtag("event", metric.name, {
      event_category: "Web Vitals",
      event_label: metric.id,
      value: Math.round(metric.value),
      non_interaction: true,
    });
  }
};

// Error tracking
export const captureError = (error: Error, context?: Record<string, any>) => {
  console.error("Error:", error);

  // Send to Google Analytics
  if (process.env.NEXT_PUBLIC_GA_TRACKING_ID) {
    window.gtag("event", "error", {
      event_category: "Error",
      event_label: error.message,
      value: 1,
      ...context,
    });
  }
};

// Performance monitoring
export const measurePerformance = (name: string, callback: () => void) => {
  const start = performance.now();
  callback();
  const duration = performance.now() - start;

  // Send to Google Analytics
  if (process.env.NEXT_PUBLIC_GA_TRACKING_ID) {
    window.gtag("event", "performance", {
      event_category: "Performance",
      event_label: name,
      value: Math.round(duration),
    });
  }
};

// User tracking
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number,
) => {
  if (process.env.NEXT_PUBLIC_GA_TRACKING_ID) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};
