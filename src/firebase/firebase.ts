// This file is frontend-only. Do not use in backend.
import { getAnalytics, Analytics } from 'firebase/analytics';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged as _onAuthStateChanged,
  createUserWithEmailAndPassword as _createUserWithEmailAndPassword,
  signInWithEmailAndPassword as _signInWithEmailAndPassword,
  signOut as _signOut,
  sendPasswordResetEmail as _sendPasswordResetEmail,
  updateProfile as _updateProfile,
  GoogleAuthProvider as _GoogleAuthProvider,
  signInWithPopup as _signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  Auth,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { env } from '../config/environment.js';

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

if (env.ENABLE_FIREBASE) {
  currentApp = getApps().length === 0
    ? initializeApp({
        apiKey: env.FIREBASE_API_KEY,
        authDomain: env.FIREBASE_AUTH_DOMAIN,
        projectId: env.FIREBASE_PROJECT_ID,
        storageBucket: env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
        appId: env.FIREBASE_APP_ID,
        measurementId: env.FIREBASE_MEASUREMENT_ID,
      })
    : getApps()[0];
  auth = getAuth(currentApp);
  db = getFirestore(currentApp);
  storage = getStorage(currentApp);
  analytics = getAnalytics(currentApp);
  onAuthStateChanged = _onAuthStateChanged;
  createUserWithEmailAndPassword = _createUserWithEmailAndPassword;
  signInWithEmailAndPassword = _signInWithEmailAndPassword;
  signOut = _signOut;
  sendPasswordResetEmail = _sendPasswordResetEmail;
  updateProfile = _updateProfile;
  GoogleAuthProvider = _GoogleAuthProvider;
  signInWithPopup = _signInWithPopup;
}

export {
  auth,
  db,
  storage,
  analytics,
  currentApp,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
};