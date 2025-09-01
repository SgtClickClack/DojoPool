// Mapbox Configuration
export const MAPBOX_CONFIG = {
  accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '',
  defaultStyle: 'mapbox://styles/mapbox/streets-v12',
  defaultCenter: {
    longitude: 153.0251, // Brisbane, QLD
    latitude: -27.4698,
    zoom: 11,
  },
};

// Get Mapbox token with proper validation
export const getMapboxToken = (): string | undefined => {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token || token.trim() === '') {
    console.warn(
      '⚠️ Mapbox token not configured. Please set NEXT_PUBLIC_MAPBOX_TOKEN in your .env.local file'
    );
    console.warn(
      '🔗 Get your token from: https://account.mapbox.com/access-tokens/'
    );
    console.warn(
      'ℹ️ Map functionality will be disabled until a valid token is provided'
    );
    return undefined;
  }

  // Basic validation - check if it looks like a valid Mapbox token
  if (!token.startsWith('pk.') || token.length < 20) {
    console.warn(
      '⚠️ Mapbox token appears to be invalid. Please verify your token from https://account.mapbox.com/access-tokens/'
    );
  }

  return token;
};
