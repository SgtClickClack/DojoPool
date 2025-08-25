// API and Websocket URLs
export const API_URL = process.env.REACT_APP_API_URL || '/api';
export const WEBSOCKET_URL =
  process.env.REACT_APP_WEBSOCKET_URL || '/socket.io';

// Location Options
export const LOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0,
};

// Validation Thresholds
export const VIOLATION_THRESHOLDS = {
  WARNING: 2,
  SUSPENSION: 5,
  BAN: 10,
};

// Cache Configuration
export const CACHE_CONFIG = {
  maxAge: 60 * 60 * 1000, // 1 hour
  maxSize: 1000,
};

// Rate Limiting
export const RATE_LIMIT_CONFIG = {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
};

// Monitoring
export const MONITORING_CONFIG = {
  metricsInterval: 5000,
  retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
};

// Map Configuration
import getGoogleMapsApiKey from '../../../../apps/web/src/utils/getGoogleMapsApiKey';
export const GOOGLE_MAPS_API_KEY = getGoogleMapsApiKey();

export const DEFAULT_MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: true,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: true,
  gestureHandling: 'greedy',
  clickableIcons: false,
  zoom: 15,
};

export const MAP_STYLES = [
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ color: '#242f3e' }],
  },
  {
    featureType: 'all',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#242f3e' }],
  },
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

// Animation Configuration
export const PLAYER_MARKER_RADIUS = 50; // meters
export const ANIMATION_DURATION = 1000; // milliseconds
