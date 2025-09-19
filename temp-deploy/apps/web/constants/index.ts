export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
export const WEBSOCKET_BASE_URL =
  process.env.NEXT_PUBLIC_WEBSOCKET_URL || '/socket.io';

// Map constants
export const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
export const DEFAULT_MAP_OPTIONS = {
  zoom: 12,
  center: { lat: 40.7128, lng: -74.006 }, // New York
  mapTypeId: 'roadmap',
};
export const MAP_STYLES = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
];
export const PLAYER_MARKER_RADIUS = 100;
export const VENUE_MARKER_RADIUS = 200;
export const ANIMATION_DURATION = 300; // milliseconds
