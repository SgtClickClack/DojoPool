// Frontend env (JS) - safe in browser without process polyfill
const readMetaEnv = (key) => {
  try {
    const meta = import.meta;
    if (meta && meta.env && meta.env[key] !== undefined) {
      return String(meta.env[key]);
    }
  } catch {}
  return undefined;
};

const readProcessEnv = (key) => {
  if (
    typeof process !== 'undefined' &&
    process.env &&
    process.env[key] !== undefined
  ) {
    return process.env[key];
  }
  return undefined;
};

const getEnv = (keys, fallback = '') => {
  const list = Array.isArray(keys) ? keys : [keys];
  for (const k of list) {
    const v = readMetaEnv(k);
    if (v !== undefined) return v;
    const pv = readProcessEnv(k);
    if (pv !== undefined) return pv;
  }
  return fallback;
};

export const env = {
  ENABLE_FIREBASE:
    getEnv(['NEXT_PUBLIC_ENABLE_FIREBASE', 'VITE_ENABLE_FIREBASE'], '') ===
    'true',
  FIREBASE_API_KEY: getEnv(
    ['NEXT_PUBLIC_FIREBASE_API_KEY', 'VITE_FIREBASE_API_KEY'],
    ''
  ),
  FIREBASE_AUTH_DOMAIN: getEnv(
    ['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_AUTH_DOMAIN'],
    ''
  ),
  FIREBASE_PROJECT_ID: getEnv(
    ['NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_PROJECT_ID'],
    ''
  ),
  FIREBASE_STORAGE_BUCKET: getEnv(
    ['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_STORAGE_BUCKET'],
    ''
  ),
  FIREBASE_MESSAGING_SENDER_ID: getEnv(
    [
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
    ],
    ''
  ),
  FIREBASE_APP_ID: getEnv(
    ['NEXT_PUBLIC_FIREBASE_APP_ID', 'VITE_FIREBASE_APP_ID'],
    ''
  ),
  FIREBASE_MEASUREMENT_ID: getEnv(
    ['NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID', 'VITE_FIREBASE_MEASUREMENT_ID'],
    ''
  ),
};
