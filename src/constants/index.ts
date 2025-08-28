// Core configuration constants
export const CACHE_CONFIG = {
  maxSize: 1000,
  ttl: 300000, // 5 minutes
  cleanupInterval: 60000, // 1 minute
};

export const MONITORING_CONFIG = {
  metricsInterval: 5000, // 5 seconds
  alertThresholds: {
    cpu: 80,
    memory: 85,
    disk: 90,
  },
  retentionDays: 30,
};

export const VIOLATION_THRESHOLDS = {
  maxRetries: 3,
  timeoutMs: 5000,
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000,
  },
};

// Map/World defaults (used by Map components)
export const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export const DEFAULT_MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

export const MAP_STYLES: google.maps.MapTypeStyle[] = [];

export const PLAYER_MARKER_RADIUS = 50;

export const ANIMATION_DURATION = 1000;
