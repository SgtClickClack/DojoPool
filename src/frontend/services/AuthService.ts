import {
  GoogleAuthProvider,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  getAuth,
  getRedirectResult,
  inMemoryPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { analyticsService } from '@/services/analytics';

class AuthService {
  private auth;
  private googleProvider;

  constructor() {
    this.auth = getAuth();
    this.googleProvider = new GoogleAuthProvider();

    if (typeof window !== 'undefined') {
      this.initializeAuth();
    }
  }

  private initializeAuth() {
    // Configure auth persistence based on environment
    this.auth.setPersistence(
      process.env.NODE_ENV === 'production'
        ? browserLocalPersistence
        : inMemoryPersistence
    );

    // Configure Google provider
    this.googleProvider.setCustomParameters({
      prompt: 'select_account',
      scope: 'email profile',
    });

    // Handle redirect results on page load
    this.handleRedirectResult();
  }

  private async handleRedirectResult() {
    try {
      const result = await getRedirectResult(this.auth);
      if (result) {
        await this.handleAuthSuccess(result);
      }
    } catch (error) {
      console.error('Error handling redirect result:', error);
    }
  }

  private async handleAuthSuccess(result: any) {
    // Get the Firebase ID token
    const idToken = await result.user.getIdToken();

    // Send token to backend for verification
    const response = await fetch('/auth/verify-token', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to verify token with backend');
    }

    // Log analytics event
    analyticsService.logEvent('login', {
      method: 'google',
      success: true,
    });
  }

  async signInWithGoogle() {
    if (typeof window === 'undefined') {
      throw new Error('Cannot sign in on server side');
    }

    try {
      // Use popup for desktop and redirect for mobile
      if (window.innerWidth > 768) {
        const result = await signInWithPopup(this.auth, this.googleProvider);
        await this.handleAuthSuccess(result);
      } else {
        await signInWithRedirect(this.auth, this.googleProvider);
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      await firebaseSignOut(this.auth);
      await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      // Log analytics event
      analyticsService.logEvent('logout', {
        success: true,
      });
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(this.auth, callback);
  }
}

export const authService = new AuthService();
export default authService;
