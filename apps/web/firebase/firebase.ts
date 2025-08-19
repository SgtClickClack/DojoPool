// This file is frontend-only. Do not use in backend.
// Temporarily disabled due to Firebase import issues
// import { getAnalytics } from 'firebase/analytics';
// import { getApps, initializeApp } from 'firebase/app';
// import {
//   GoogleAuthProvider as _GoogleAuthProvider,
//   createUserWithEmailAndPassword as _createUserWithEmailAndPassword,
//   onAuthStateChanged as _onAuthStateChanged,
//   sendPasswordResetEmail as _sendPasswordResetEmail,
//   signInWithEmailAndPassword as _signInWithEmailAndPassword,
//   signInWithPopup as _signInWithPopup,
//   signOut as _signOut,
//   updateProfile as _updateProfile,
//   getAuth,
// } from 'firebase/auth';
// import { getFirestore } from 'firebase/firestore';
// import { getStorage } from 'firebase/storage';
import { env } from '../config/environment';

let auth: any = {};
let db: any = null;
let storage: any = null;
let analytics: any = null;
let currentApp: any = null;
let onAuthStateChanged: any = () => {};
let createUserWithEmailAndPassword: any = () => Promise.resolve();
let signInWithEmailAndPassword: any = () => Promise.resolve();
let signOut: any = () => Promise.resolve();
let sendPasswordResetEmail: any = () => Promise.resolve();
let updateProfile: any = () => Promise.resolve();
let GoogleAuthProvider: any = class {};
let signInWithPopup: any = () => Promise.resolve();

// Temporarily disabled Firebase initialization
// if (env.ENABLE_FIREBASE) {
//   currentApp =
//     getApps().length === 0
//       ? initializeApp({
//           apiKey: env.FIREBASE_API_KEY,
//           authDomain: env.FIREBASE_AUTH_DOMAIN,
//           projectId: env.FIREBASE_PROJECT_ID,
//           storageBucket: env.FIREBASE_STORAGE_BUCKET,
//           messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
//           appId: env.FIREBASE_APP_ID,
//           measurementId: env.FIREBASE_MEASUREMENT_ID,
//         })
//       : getApps()[0];
//   auth = getAuth(currentApp);
//   db = getFirestore(currentApp);
//   storage = getStorage(currentApp);
//   analytics = getAnalytics(currentApp);
//   onAuthStateChanged = _onAuthStateChanged;
//   createUserWithEmailAndPassword = _createUserWithEmailAndPassword;
//   signInWithEmailAndPassword = _signInWithEmailAndPassword;
//   signOut = _signOut;
//   sendPasswordResetEmail = _sendPasswordResetEmail;
//   updateProfile = _updateProfile;
//   GoogleAuthProvider = _GoogleAuthProvider;
//   signInWithPopup = _signInWithPopup;
// }

export {
  GoogleAuthProvider,
  analytics,
  auth,
  createUserWithEmailAndPassword,
  currentApp,
  db,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  storage,
  updateProfile,
};
