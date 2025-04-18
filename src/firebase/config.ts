import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication with optimized settings
const auth = getAuth(app);
auth.settings.appVerificationDisabledForTesting = false;

// Initialize Firestore with performance optimizations
const db = getFirestore(app);
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn(
        "Multiple tabs open, persistence can only be enabled in one tab at a time.",
      );
    } else if (err.code === "unimplemented") {
      console.warn("The current browser does not support persistence.");
    }
  });
}

// Initialize Storage with optimized settings
const storage = getStorage(app);
storage.maxUploadRetryTime = 60000; // 1 minute
storage.maxOperationRetryTime = 60000; // 1 minute

// Development mode optimizations
if (process.env.NODE_ENV === "development") {
  // Disable analytics in development
  if (
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  ) {
    (window as any)[
      `ga-disable-${process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}`
    ] = true;
  }

  // Enable debug logging
  if (process.env.NEXT_PUBLIC_FIREBASE_DEBUG === "true") {
    console.log("Firebase Debug Mode Enabled");
  }
}

export { app, auth, db, storage };
