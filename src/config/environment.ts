// FRONTEND-ONLY ENVIRONMENT CONFIG
// Do NOT import this file in backend code. Use environment.backend.ts for backend.

export const env = {
  // API Configuration
  API_URL: import.meta.env.VITE_API_URL || '',
  WEBSOCKET_URL: import.meta.env.VITE_WEBSOCKET_URL || '',

  // Firebase Configuration
  FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY || '',
  FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID || '',
  FIREBASE_MEASUREMENT_ID: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',

  // Blockchain Configuration
  DOJO_COIN_ADDRESS: import.meta.env.VITE_DOJO_COIN_ADDRESS || '',

  // AI Services Configuration
  VITE_3DAI_STUDIO_API_KEY: import.meta.env.VITE_3DAI_STUDIO_API_KEY || '',

  // Google Maps Configuration
  VITE_GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',

  // Environment flags
  NODE_ENV: import.meta.env.MODE || '',
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
};
