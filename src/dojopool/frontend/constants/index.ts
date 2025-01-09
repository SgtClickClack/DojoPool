// API and Websocket URLs
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
export const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3000';

// Location Options
export const LOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
};

// Validation Thresholds
export const VIOLATION_THRESHOLDS = {
  WARNING: 2,
  SUSPENSION: 5,
  BAN: 10
};

// Cache Configuration
export const CACHE_CONFIG = {
  maxAge: 60 * 60 * 1000, // 1 hour
  maxSize: 1000
};

// Rate Limiting
export const RATE_LIMIT_CONFIG = {
  maxRequests: 100,
  windowMs: 60 * 1000 // 1 minute
};

// Monitoring
export const MONITORING_CONFIG = {
  metricsInterval: 5000,
  retentionPeriod: 24 * 60 * 60 * 1000 // 24 hours
}; 