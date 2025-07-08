// BACKEND-ONLY ENVIRONMENT CONFIG
// Do NOT import this file in frontend code. Use environment.ts for frontend.

interface BackendEnvironmentConfig {
  // API Configuration
  API_URL: string;
  WEBSOCKET_URL: string;
  
  // Firebase Configuration
  FIREBASE_API_KEY: string;
  FIREBASE_AUTH_DOMAIN: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_STORAGE_BUCKET: string;
  FIREBASE_MESSAGING_SENDER_ID: string;
  FIREBASE_APP_ID: string;
  FIREBASE_MEASUREMENT_ID: string;
  
  // Blockchain Configuration
  DOJO_COIN_ADDRESS: string;
  
  // AI Services Configuration
  VITE_3DAI_STUDIO_API_KEY: string;
  
  // Google Maps Configuration
  VITE_GOOGLE_MAPS_API_KEY: string;
  
  // Environment flags
  NODE_ENV: string;
  DEV: boolean;
  PROD: boolean;
}

// Create backend environment configuration using only process.env
export const env: BackendEnvironmentConfig = {
  // API Configuration
  API_URL: process.env.VITE_API_URL || '',
  WEBSOCKET_URL: process.env.VITE_WEBSOCKET_URL || '',
  
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
  NODE_ENV: process.env.NODE_ENV || '',
  DEV: process.env.NODE_ENV === 'development',
  PROD: process.env.NODE_ENV === 'production',
};

// Export default environment config
export default env; 