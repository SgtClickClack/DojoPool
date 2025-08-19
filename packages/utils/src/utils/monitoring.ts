// Extend Window interface to include gtag
declare global {
  interface Window {
    gtag: (
      command: string,
      action: string,
      parameters?: Record<string, any>
    ) => void;
  }
}

// Web Vitals
export const reportWebVitals = (metric: any) => {
  // Send to Google Analytics
  const getEnv = (): Record<string, any> =>
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env
      : typeof process !== 'undefined'
        ? process.env
        : {};
  const env = getEnv();
  if (env['NEXT_PUBLIC_GA_TRACKING_ID']) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.value),
      non_interaction: true,
    });
  }
};

// Error tracking
export const captureError = (error: Error, context?: Record<string, any>) => {
  console.error('Error:', error);

  // Send to Google Analytics
  const getEnv = (): Record<string, any> =>
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env
      : typeof process !== 'undefined'
        ? process.env
        : {};
  const env = getEnv();
  if (env['NEXT_PUBLIC_GA_TRACKING_ID']) {
    window.gtag('event', 'error', {
      event_category: 'Error',
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
  const getEnv = (): Record<string, any> =>
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env
      : typeof process !== 'undefined'
        ? process.env
        : {};
  const env = getEnv();
  if (env['NEXT_PUBLIC_GA_TRACKING_ID']) {
    window.gtag('event', 'performance', {
      event_category: 'Performance',
      event_label: name,
      value: Math.round(duration),
    });
  }
};

// Type assertion for gtag
const gtag =
  typeof window !== 'undefined' && (window as any).gtag
    ? (window as any).gtag
    : () => {};

export const trackEvent = (metric: {
  name: string;
  value?: number;
  category?: string;
  label?: string;
}) => {
  gtag('event', metric.name, {
    event_category: metric.category,
    event_label: metric.label,
    value: metric.value,
  });
};

export const trackError = (error: Error, context?: Record<string, any>) => {
  gtag('event', 'error', {
    event_category: 'error',
    event_label: error.message,
    error_name: error.name,
    error_stack: error.stack,
    ...context,
  });
};

export const trackPerformance = (metric: {
  name: string;
  value: number;
  category?: string;
}) => {
  gtag('event', 'performance', {
    event_category: metric.category || 'performance',
    event_label: metric.name,
    value: metric.value,
  });
};

export const trackUserAction = (
  action: string,
  parameters?: Record<string, any>
) => {
  gtag('event', action, {
    ...parameters,
  });
};
