import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { env } from '../config/environment';

// Fallback configuration for development when environment variables are not set
const getFirebaseConfig = () => {
  const config = {
    apiKey: env.FIREBASE_API_KEY || 'AIzaSyCmock_api_key_for_development_only',
    authDomain: env.FIREBASE_AUTH_DOMAIN || 'dojopool-dev.firebaseapp.com',
    projectId: env.FIREBASE_PROJECT_ID || 'dojopool-dev',
    storageBucket: env.FIREBASE_STORAGE_BUCKET || 'dojopool-dev.appspot.com',
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID || '123456789012',
    appId: env.FIREBASE_APP_ID || '1:123456789012:web:abcdef1234567890',
    measurementId: env.FIREBASE_MEASUREMENT_ID || 'G-XXXXXXXXXX'
  };

  // Debug logging for development
  if (env.DEV) {
    console.log('[FB][DEBUG] Firebase API Key:', config.apiKey);
    console.log('[FB][DEBUG] Full Firebase Config:', config);
  }

  return config;
};

const firebaseConfig = getFirebaseConfig();

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize analytics only if supported and not in development
let analytics: any = null;
if (!env.DEV) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { analytics };