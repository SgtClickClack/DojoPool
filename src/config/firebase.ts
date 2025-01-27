import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD16FMC42OX4BFsFb5qowKJndOqejk8KCk",
    authDomain: "dojo-pool.firebaseapp.com",
    projectId: "dojo-pool",
    storageBucket: "dojo-pool.firebasestorage.app",
    messagingSenderId: "190541475829",
    appId: "1:190541475829:web:fa40fa669241ed46353abc",
    measurementId: "G-KTRPH35FX8"
};

let app;
let auth;
let analytics = null;

try {
    // Initialize Firebase
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    
    // Initialize Auth
    auth = getAuth(app);
    
    // Initialize Analytics only on client side
    if (typeof window !== 'undefined') {
        analytics = getAnalytics(app);
    }
} catch (error) {
    console.error('Firebase initialization error:', error);
    // Set defaults if initialization fails
    app = null;
    auth = null;
    analytics = null;
}

export { app, auth, analytics }; 