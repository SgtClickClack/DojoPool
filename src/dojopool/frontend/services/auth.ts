import { GoogleAuthProvider, browserLocalPersistence, browserPopupRedirectResolver, getAuth, getRedirectResult, inMemoryPersistence, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { analyticsService } from './analytics';

class AuthService {
  private auth = getAuth();
  private googleProvider = new GoogleAuthProvider();

  constructor() {
    // Configure auth persistence based on environment
    this.auth.setPersistence(process.env.NODE_ENV === 'production' ? browserLocalPersistence : inMemoryPersistence);

    // Configure Google provider
    this.googleProvider.setCustomParameters({
      prompt: 'select_account',
      // Ensure redirect happens to same origin
      redirect_uri: window.location.origin + '/auth/callback'
    });

    // Handle redirect results on page load
    this.handleRedirectResult();
  }

  private async handleRedirectResult() {
    try {
      const result = await getRedirectResult(this.auth, browserPopupRedirectResolver);
      if (result) {
        await this.handleAuthSuccess(result);
      }
    } catch (error) {
      console.error('Auth redirect error:', error);
      analyticsService.trackUserEvent({
        type: 'auth_redirect_error',
        userId: 'anonymous',
        details: { error: error.message }
      });
    }
  }

  private async handleAuthSuccess(result: any) {
    const user = result.user;
    analyticsService.trackUserEvent({
      type: 'auth_success',
      userId: user.uid,
      details: {
        provider: result.providerId,
        timestamp: new Date().toISOString()
      }
    });
  }

  async signInWithGoogle() {
    try {
      // Try popup first as it's more reliable
      const result = await signInWithPopup(this.auth, this.googleProvider);
      await this.handleAuthSuccess(result);
    } catch (popupError) {
      console.warn('Popup blocked, falling back to redirect:', popupError);

      // If popup blocked, fall back to redirect
      try {
        await signInWithRedirect(this.auth, this.googleProvider);
      } catch (redirectError) {
        console.error('Sign in error:', redirectError);
        analyticsService.trackUserEvent({
          type: 'auth_error',
          userId: 'anonymous',
          details: { error: redirectError.message }
        });
        throw redirectError;
      }
    }
  }

  async signOut() {
    try {
      const user = this.auth.currentUser;
      await this.auth.signOut();
      analyticsService.trackUserEvent({
        type: 'sign_out',
        userId: user?.uid || 'anonymous',
        details: { timestamp: new Date().toISOString() }
      });
    } catch (error) {
      console.error('Sign out error:', error);
      analyticsService.trackUserEvent({
        type: 'sign_out_error',
        userId: this.auth.currentUser?.uid || 'anonymous',
        details: { error: error.message }
      });
      throw error;
    }
  }

  onAuthStateChanged(callback: (user: any) => void) {
    return this.auth.onAuthStateChanged(callback);
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }

  isAuthenticated() {
    return !!this.auth.currentUser;
  }
}

export const authService = new AuthService();
