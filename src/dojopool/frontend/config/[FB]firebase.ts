// Debug logging for Firebase configuration
console.log('[Firebase Config Debug]', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
});

import { Analytics, getAnalytics } from "firebase/analytics";
import { FirebaseApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";
import {
  browserLocalPersistence,
  GoogleAuthProvider,
  setPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-mode",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-mode",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-mode",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-mode",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "demo-mode",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "demo-mode",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "demo-mode",
};

// Validate required configuration
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "demo-mode") {
  console.error('Firebase API Key is missing or set to demo-mode');
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;

if (typeof window !== "undefined") {
  try {
    // Initialize Firebase
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

    // Initialize services
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    // Only initialize analytics in production
    if (process.env.NODE_ENV === "production") {
      analytics = getAnalytics(app);
    }
  } catch (error) {
    console.error("Firebase initialization error:", error);
    // Keep services as null if initialization fails
  }
}

// Configure auth persistence and Google provider
if (auth) {
  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: "select_account",
    scope: "email profile",
  });

  if (process.env.NODE_ENV === "production") {
    setPersistence(auth, browserLocalPersistence);
  }
}

export { app, auth, db, storage, analytics };
