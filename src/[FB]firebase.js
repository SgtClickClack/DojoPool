import { getAnalytics } from 'firebase/analytics';
import { getApps, initializeApp } from 'firebase/app';
import {
    browserLocalPersistence,
    createUserWithEmailAndPassword,
    getAuth,
    GoogleAuthProvider,
    onAuthStateChanged,
    sendPasswordResetEmail,
    setPersistence,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-mode',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-mode',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-mode',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-mode',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'demo-mode',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'demo-mode'
};

let app;
try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
} catch (error) {
    console.error('Firebase initialization error:', error);
    app = null;
}

export const auth = app ? getAuth(app) : null;
export default app;

const googleProvider = new GoogleAuthProvider();
// Add security settings
auth.settings.appVerificationDisabledForTesting = false;  // Ensure app verification is enabled
googleProvider.setCustomParameters({
    prompt: 'select_account',  // Force account selection
    // Add additional OAuth 2.0 scopes as needed
    scope: 'email profile'
});
// Enable persistence only in production
if (process.env.NODE_ENV === 'production') {
    setPersistence(auth, browserLocalPersistence);
}
const db = getFirestore(app);
const storage = getStorage(app);

let analytics = null;
if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
}

export {
    analytics,
    auth,
    createUserWithEmailAndPassword,
    db,
    GoogleAuthProvider,
    googleProvider,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    storage,
    updateProfile
};

