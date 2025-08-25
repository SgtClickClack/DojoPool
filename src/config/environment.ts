// FRONTEND-ONLY ENVIRONMENT CONFIG
// Do NOT import this file in backend code. Use environment.backend.ts for backend.

if (typeof window === 'undefined') {
  throw new Error(
    'src/config/environment.ts is frontend-only and must not be imported in backend code. Use environment.backend.ts instead.'
  );
}

// Safe helpers to read env in Node and Next.js
const readProcessEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
    return process.env[key] as string;
  }
  return undefined;
};

const getEnv = (keys: string | string[], fallback = ''): string => {
  const list = Array.isArray(keys) ? keys : [keys];
  for (const k of list) {
    const pv = readProcessEnv(k);
    if (pv !== undefined) return pv;
  }
  return fallback;
};

export const env = {
  NODE_ENV: getEnv(['NODE_ENV'], 'development'),
  PORT: getEnv(['PORT'], '8080'),
  DATABASE_URL: getEnv(['DATABASE_URL'], 'sqlite:./dojopool.db'),
  JWT_SECRET: getEnv(['JWT_SECRET'], 'your-secret-key'),
  GOOGLE_MAPS_API_KEY: getEnv(
    ['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'],
    ''
  ),
  OPENAI_API_KEY: getEnv(['OPENAI_API_KEY'], ''),
  AWS_ACCESS_KEY_ID: getEnv(['AWS_ACCESS_KEY_ID'], ''),
  AWS_SECRET_ACCESS_KEY: getEnv(['AWS_SECRET_ACCESS_KEY'], ''),
  NEXT_PUBLIC_API_URL: getEnv(
    ['NEXT_PUBLIC_API_URL'],
    'http://localhost:8080/api'
  ),
  NEXT_PUBLIC_GA_TRACKING_ID: getEnv(['NEXT_PUBLIC_GA_TRACKING_ID'], ''),
  NEXT_PUBLIC_DOJO_COIN_ADDRESS: getEnv(
    ['NEXT_PUBLIC_DOJO_COIN_ADDRESS'],
    ''
  ),
  ENCRYPTION_KEY: getEnv(['ENCRYPTION_KEY'], ''),
  WEBSOCKET_URL: getEnv(
    ['NEXT_PUBLIC_WEBSOCKET_URL', 'WEBSOCKET_URL'],
    'ws://localhost:8080'
  ),

  // Firebase Configuration
  FIREBASE_API_KEY: getEnv(
    ['NEXT_PUBLIC_FIREBASE_API_KEY'],
    ''
  ),
  FIREBASE_AUTH_DOMAIN: getEnv(
    ['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'],
    ''
  ),
  FIREBASE_PROJECT_ID: getEnv(
    ['NEXT_PUBLIC_FIREBASE_PROJECT_ID'],
    ''
  ),
  FIREBASE_STORAGE_BUCKET: getEnv(
    ['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'],
    ''
  ),
  FIREBASE_MESSAGING_SENDER_ID: getEnv(
    ['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'],
    ''
  ),
  FIREBASE_APP_ID: getEnv(
    ['NEXT_PUBLIC_FIREBASE_APP_ID'],
    ''
  ),
  FIREBASE_MEASUREMENT_ID: getEnv(
    ['NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'],
    ''
  ),

  // AI Services Configuration
  NEXT_PUBLIC_3DAI_STUDIO_API_KEY: getEnv(['NEXT_PUBLIC_3DAI_STUDIO_API_KEY'], ''),

  // Environment flags
  DEV: getEnv(['NODE_ENV'], '') === 'development',
  ENABLE_FIREBASE:
    getEnv(['NEXT_PUBLIC_ENABLE_FIREBASE'], '') === 'true',
};

export const environment = env;
export default env;
