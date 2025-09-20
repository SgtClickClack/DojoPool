// Mapbox Configuration
export const MAPBOX_CONFIG = {
  accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '',
  defaultStyle: 'mapbox://styles/mapbox/streets-v12',
  defaultCenter: {
    longitude: 153.0251, // Brisbane, QLD
    latitude: -27.4698,
    zoom: 11,
  },
  // Performance optimizations
  maxZoom: 18,
  minZoom: 1,
  bearing: 0,
  pitch: 0,
  antialias: true,
  // Optimize for mobile
  touchZoomRotate: true,
  doubleClickZoom: true,
  scrollZoom: true,
  boxZoom: true,
  dragRotate: true,
  dragPan: true,
  keyboard: true,
};

// Enhanced Mapbox token validation with better error handling
export const getMapboxToken = (): string | undefined => {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token || token.trim() === '') {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '⚠️ Mapbox token not configured. Please set NEXT_PUBLIC_MAPBOX_TOKEN in your .env.local file'
      );
      console.warn(
        '🔗 Get your token from: https://account.mapbox.com/access-tokens/'
      );
      console.warn(
        'ℹ️ Map functionality will be disabled until a valid token is provided'
      );
    }
    return undefined;
  }

  // Enhanced validation - check if it looks like a valid Mapbox token
  if (!token.startsWith('pk.') || token.length < 20) {
    console.error(
      '❌ Mapbox token appears to be invalid. Please verify your token from https://account.mapbox.com/access-tokens/'
    );
    return undefined;
  }

  // Additional validation for token format
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    console.error(
      '❌ Mapbox token format is invalid. Expected format: pk.eyJ1...'
    );
    return undefined;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Mapbox token validated successfully');
  }

  return token;
};

// Mapbox performance optimization settings
export const MAPBOX_PERFORMANCE_CONFIG = {
  // Reduce bundle size by disabling unused features
  disableWebGL: false,
  // Optimize for performance
  preserveDrawingBuffer: false,
  // Reduce memory usage
  maxTileCacheSize: 100,
  // Optimize rendering
  renderWorldCopies: false,
  // Performance monitoring
  performanceMetrics: process.env.NODE_ENV === 'development',
};

// Mapbox error handling
export const handleMapboxError = (error: unknown): void => {
  console.error('Mapbox Error:', error);

  // Type guard for Mapbox error objects
  const isMapboxError = (err: unknown): err is { type?: string; error?: { message?: string } } => {
    return typeof err === 'object' && err !== null;
  };

  // Handle specific error types
  if (isMapboxError(error)) {
    if (error.type === 'error') {
      if (error.error?.message?.includes('token')) {
        console.error(
          '❌ Mapbox token error. Please check your NEXT_PUBLIC_MAPBOX_TOKEN'
        );
      } else if (error.error?.message?.includes('style')) {
        console.error(
          '❌ Mapbox style error. Please check your map style configuration'
        );
      } else {
        console.error(
          '❌ Mapbox error:',
          error.error?.message || 'Unknown error'
        );
      }
    }
  }
};
