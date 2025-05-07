import { getAnalytics, Analytics } from 'firebase/analytics';
import { initializeApp, getApps, FirebaseApp, FirebaseOptions } from 'firebase/app';
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

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-mode',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-mode',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-mode',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-mode',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'demo-mode',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'demo-mode',
};

let app: FirebaseApp | null = null;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
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
  if (authInstance && process.env.NODE_ENV === 'production') {
    setPersistence(authInstance, browserLocalPersistence)
      .catch((error: any) => {
        console.error('Error setting auth persistence:', error);
      });
  }
} else {
  console.error('Firebase app initialization failed. Firebase services will be unavailable.');
}

const googleAuthProvider = new GoogleAuthProvider();
if (authInstance) {
  // Example: authInstance.settings is not directly available on Auth object in v9+
  // For test configurations like disabling app verification, you'd typically handle this during specific test setups or emulators.
  // googleAuthProvider.setCustomParameters is correct.
  googleAuthProvider.setCustomParameters({
    prompt: 'select_account',
    scope: 'email profile',
  });
} else {
  console.warn('Auth instance not available for GoogleAuthProvider configuration.');
}

// Export instances safely
export const auth: Auth | null = authInstance;
export const db: Firestore | null = dbInstance;
export const storage: FirebaseStorage | null = storageInstance;
export const analytics: Analytics | null = analyticsInstance;
export const currentApp: FirebaseApp | null = app; // Exporting the app instance itself

// Export auth methods (they are standalone functions in v9+ and don't strictly need auth instance passed if auth is globally initialized via getAuth())
// However, it's good practice to ensure auth is initialized.
export {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider, // Export the class itself
  googleAuthProvider, // Export the configured instance
  signInWithPopup,
};

export default currentApp; // Exporting the app as default, consistent with original JS 