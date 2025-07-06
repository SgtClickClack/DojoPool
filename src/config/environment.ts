// Centralized environment configuration that works in both Node.js and browser environments

interface EnvironmentConfig {
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

// Helper function to get environment variables
const getEnvVar = (key: string, fallback: string = ''): string => {
  if (typeof window !== 'undefined' && (window as any).__ENV__ && (window as any).__ENV__[key] !== undefined) {
    return (window as any).__ENV__[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
    return process.env[key] as string;
  }
  return fallback;
};

// Helper function to get boolean environment variables
const getEnvBool = (key: string, fallback: boolean = false): boolean => {
  const value = getEnvVar(key);
  if (value === '') return fallback;
  return value.toLowerCase() === 'true' || value === '1';
};

// Create environment configuration
export const env: EnvironmentConfig = {
  // API Configuration
  API_URL: getEnvVar('VITE_API_URL', 'http://localhost:8080'),
  WEBSOCKET_URL: getEnvVar('VITE_WEBSOCKET_URL', 'ws://localhost:8080'),
  
  // Firebase Configuration
  FIREBASE_API_KEY: getEnvVar('VITE_FIREBASE_API_KEY'),
  FIREBASE_AUTH_DOMAIN: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  FIREBASE_PROJECT_ID: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  FIREBASE_STORAGE_BUCKET: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  FIREBASE_MESSAGING_SENDER_ID: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  FIREBASE_APP_ID: getEnvVar('VITE_FIREBASE_APP_ID'),
  FIREBASE_MEASUREMENT_ID: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID'),
  
  // Blockchain Configuration
  DOJO_COIN_ADDRESS: getEnvVar('VITE_DOJO_COIN_ADDRESS'),
  
  // AI Services Configuration
  VITE_3DAI_STUDIO_API_KEY: getEnvVar('VITE_3DAI_STUDIO_API_KEY'),
  
  // Google Maps Configuration
  VITE_GOOGLE_MAPS_API_KEY: getEnvVar('VITE_GOOGLE_MAPS_API_KEY'),
  
  // Environment flags
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  DEV: getEnvVar('NODE_ENV', 'development') === 'development',
  PROD: getEnvVar('NODE_ENV', 'development') === 'production',
};

// Export helper functions for use in other files
export { getEnvVar, getEnvBool };

// Export default environment config
export default env; 