// FRONTEND-ONLY ENVIRONMENT CONFIG
// Do NOT import this file in backend code. Use environment.backend.ts for backend.

if (typeof window === 'undefined') {
  throw new Error('src/config/environment.ts is frontend-only and must not be imported in backend code. Use environment.backend.ts instead.');
}

export const env = {
  NODE_ENV: import.meta.env.MODE || 'development',
  PORT: import.meta.env.VITE_PORT || 8080,
  DATABASE_URL: import.meta.env.VITE_DATABASE_URL || 'sqlite:./dojopool.db',
  JWT_SECRET: import.meta.env.VITE_JWT_SECRET || 'your-secret-key',
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY || '',
  AWS_ACCESS_KEY_ID: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
  NEXT_PUBLIC_API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  NEXT_PUBLIC_GA_TRACKING_ID: import.meta.env.VITE_GA_TRACKING_ID || '',
  ENCRYPTION_KEY: import.meta.env.VITE_ENCRYPTION_KEY || '',
  WEBSOCKET_URL: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080',
};

export const environment = env;
export default env;
