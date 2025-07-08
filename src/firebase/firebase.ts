// This file is frontend-only. Do not use in backend.
import { getAnalytics, Analytics } from 'firebase/analytics';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  Auth,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { env } from '../config/environment';

// Use centralized environment config
console.log('[FB]firebase.ts:2 [Firebase Config Debug]', {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID,
  measurementId: env.FIREBASE_MEASUREMENT_ID,
});

const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID,
  measurementId: env.FIREBASE_MEASUREMENT_ID,
};

console.log('[FB][DEBUG] Firebase API Key:', env.FIREBASE_API_KEY);
console.log('[FB][DEBUG] Full Firebase Config:', firebaseConfig);

let app: FirebaseApp | null = null;
try {
  // Only initialize Firebase if we have valid config (not mock values)
  if (env.FIREBASE_API_KEY && env.FIREBASE_API_KEY !== 'mock-api-key-for-development') {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  } else {
    console.log('Firebase not configured - running in development mode without Firebase');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  // app remains null
}

let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;
let analyticsInstance: Analytics | null = null;

if (app) {
  authInstance = getAuth(app);
  dbInstance = getFirestore(app);
  storageInstance = getStorage(app);

  // Initialize Analytics only if in browser context
  if (typeof window !== 'undefined') {
    try {
      analyticsInstance = getAnalytics(app);
    } catch (e) {
      console.error('Failed to initialize Firebase Analytics in browser:', e);
    }
  }

  // Configure auth persistence (example, adjust as needed)
  if (authInstance && (env.NODE_ENV === 'production' || env.PROD)) {
    setPersistence(authInstance, browserLocalPersistence)
      .catch((error: any) => {
        console.error('Error setting auth persistence:', error);
      });
  }
} else {
  console.log('Firebase app not initialized - running in development mode without Firebase services');
}

const googleAuthProvider = new GoogleAuthProvider();
if (authInstance && Object.keys(authInstance).length > 0) {
  if (typeof googleAuthProvider.setCustomParameters === 'function') {
    googleAuthProvider.setCustomParameters({
      prompt: 'select_account',
      scope: 'email profile',
    });
  }
} else {
  console.log('Auth instance not available for GoogleAuthProvider configuration - running in development mode');
}

if (!authInstance) {
  console.warn('Firebase Auth instance could not be initialized. Running in development mode without Firebase.');
  // Create a mock auth instance for development
  authInstance = {} as Auth;
}
export const auth: Auth = authInstance;
export const db: Firestore | null = dbInstance;
export const storage: FirebaseStorage | null = storageInstance;
export const analytics: Analytics | null = analyticsInstance;
export const currentApp: FirebaseApp | null = app;

export {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  googleAuthProvider,
  signInWithPopup,
};

export default currentApp;