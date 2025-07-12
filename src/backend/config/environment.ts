// BACKEND-ONLY ENVIRONMENT CONFIG
// This file is completely isolated from frontend environment config.

export const env = {
  // API Configuration
  API_URL: process.env.VITE_API_URL || 'http://localhost:8080',
  WEBSOCKET_URL: process.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080',

  // Firebase Configuration
  FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY || '',
  FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || '',
  FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID || '',
  FIREBASE_MEASUREMENT_ID: process.env.VITE_FIREBASE_MEASUREMENT_ID || '',

  // Blockchain Configuration
  DOJO_COIN_ADDRESS: process.env.VITE_DOJO_COIN_ADDRESS || '',

  // AI Services Configuration
  VITE_3DAI_STUDIO_API_KEY: process.env.VITE_3DAI_STUDIO_API_KEY || '',

  // Google Maps Configuration
  VITE_GOOGLE_MAPS_API_KEY: process.env.VITE_GOOGLE_MAPS_API_KEY || '',

  // Environment flags
  NODE_ENV: process.env.NODE_ENV || 'development',
  DEV: process.env.NODE_ENV === 'development',
  PROD: process.env.NODE_ENV === 'production',
}; 