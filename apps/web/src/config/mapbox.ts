// Mapbox Configuration
export const MAPBOX_CONFIG = {
  accessToken:
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
    'pk.eyJ1IjoiZGVmYXVsdCIsImEiOiJjbGV4YW1wbGUifQ.example',
  defaultStyle: 'mapbox://styles/mapbox/streets-v12',
  defaultCenter: {
    longitude: 153.0251, // Brisbane, QLD
    latitude: -27.4698,
    zoom: 11,
  },
};

// Fallback token for development (replace with your actual token)
export const getMapboxToken = (): string => {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (
    !token ||
    token === 'pk.eyJ1IjoiZGVmYXVsdCIsImEiOiJjbGV4YW1wbGUifQ.example'
  ) {
    console.warn(
      '⚠️ Mapbox token not configured. Please set NEXT_PUBLIC_MAPBOX_TOKEN in your .env.local file'
    );
    console.warn(
      '🔗 Get your token from: https://account.mapbox.com/access-tokens/'
    );
  }
  return token || MAPBOX_CONFIG.accessToken;
};
