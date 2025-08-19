// Temporarily disabled due to Firebase import issues
// import {
//   GoogleAuthProvider,
//   signInWithPopup,
//   signOut as firebaseSignOut,
//   onAuthStateChanged,
//   signInWithEmailAndPassword,
//   type User,
// } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
// import { auth } from '../../firebase/firebase';
// import { analyticsService } from '../../services/analytics/AnalyticsService';

// Temporary type stub
type User = any;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signIn: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Temporarily disabled Firebase auth
    console.log('Firebase authentication temporarily disabled');
    setLoading(false);
    // If auth is a mock (Firebase not configured), set loading to false immediately
    // if (!auth || Object.keys(auth).length === 0) {
    //   setLoading(false);
    //   return;
    // }

    // const unsubscribe = onAuthStateChanged(auth, (user) => {
    //   setUser(user);
    //   setLoading(false);
    //   if (user) {
    //     analyticsService.setUserId(user.uid);
    //     analyticsService.logEvent('user_authenticated');
    //   }
    // });

    // return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Sign in temporarily disabled', { email });
      throw new Error('Authentication temporarily disabled');
      // if (!auth) {
      //   throw new Error('Firebase authentication is not initialized');
      // }
      // setError(null);
      // const result = await signInWithEmailAndPassword(auth, email, password);
      // analyticsService.trackEvent('user_sign_in', { method: 'email' });
      // setUser(result.user);
    } catch (err: any) {
      console.error('Sign in error:', err);
      let errorMessage = 'Authentication temporarily disabled';
      // let errorMessage = 'An error occurred during sign in';
      // if (err.code === 'auth/operation-not-allowed') {
      //   errorMessage =
      //     'Email/Password sign-in is not enabled. Please contact support or use Google sign-in.';
      // } else if (
      //   err.code === 'auth/user-not-found' ||
      //   err.code === 'auth/wrong-password'
      // ) {
      //   errorMessage = 'Invalid email or password';
      // } else if (err.code === 'auth/invalid-email') {
      //   errorMessage = 'Invalid email address format';
      // } else if (err.code === 'auth/user-disabled') {
      //   errorMessage = 'This account has been disabled';
      // } else if (err.code === 'auth/too-many-requests') {
      //   errorMessage = 'Too many failed attempts. Please try again later';
      // }
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Google sign in temporarily disabled');
      throw new Error('Google authentication temporarily disabled');
      // if (!auth) {
      //   throw new Error('Firebase authentication is not initialized');
      // }
      // setError(null);
      // const provider = new GoogleAuthProvider();
      // provider.setCustomParameters({
      //   prompt: 'select_account',
      // });
      // const result = await signInWithPopup(auth, provider);
      // analyticsService.trackEvent('user_signed_in', {
      //   method: 'google',
      //   userId: result.user.uid,
      // });
      // setUser(result.user);
    } catch (err: any) {
      console.error('Google sign in error:', err);
      let errorMessage = 'An error occurred during Google sign in';
      if (err.code === 'auth/popup-blocked') {
        errorMessage =
          'Please allow popups for this site to sign in with Google';
      } else if (err.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Sign in cancelled';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage =
          'Google sign-in is not enabled. Please contact support or use email/password.';
      }
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signOut = async () => {
    try {
      console.log('Sign out temporarily disabled');
      // if (!auth) {
      //   throw new Error('Firebase authentication is not initialized');
      // }
      // await firebaseSignOut(auth);
      // analyticsService.trackEvent('user_sign_out');
      setUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
      setError('An error occurred during sign out');
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, error, signIn, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};
