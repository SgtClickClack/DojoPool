// FRONTEND-ONLY ENVIRONMENT CONFIG
// Do NOT import this file in backend code. Use environment.backend.ts for backend.

if (typeof window === 'undefined') {
  throw new Error(
    'src/config/environment.ts is frontend-only and must not be imported in backend code. Use environment.backend.ts instead.'
  );
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 8080,
  DATABASE_URL: process.env.DATABASE_URL || 'sqlite:./dojopool.db',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  NEXT_PUBLIC_API_URL:
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  NEXT_PUBLIC_GA_TRACKING_ID: process.env.NEXT_PUBLIC_GA_TRACKING_ID || '',
  NEXT_PUBLIC_DOJO_COIN_ADDRESS: process.env.NEXT_PUBLIC_DOJO_COIN_ADDRESS || '',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',
  WEBSOCKET_URL: process.env.WEBSOCKET_URL || 'ws://localhost:8080',

  // Firebase Configuration
  FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  FIREBASE_MESSAGING_SENDER_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',

  // AI Services Configuration
  VITE_3DAI_STUDIO_API_KEY: process.env.VITE_3DAI_STUDIO_API_KEY || '',

  // Environment flags
  DEV: process.env.NODE_ENV === 'development',
  ENABLE_FIREBASE: process.env.NEXT_PUBLIC_ENABLE_FIREBASE === 'true',
};

export const environment = env;
export default env;
