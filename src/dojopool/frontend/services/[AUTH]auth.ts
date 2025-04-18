import {
  GoogleAuthProvider,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  getAuth,
  getRedirectResult,
  inMemoryPersistence,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { analyticsService } from "./analytics";

class AuthService {
  private auth;
  private googleProvider;

  constructor() {
    this.auth = getAuth();
    this.googleProvider = new GoogleAuthProvider();

    if (typeof window !== "undefined") {
      this.initializeAuth();
    }
  }

  private initializeAuth() {
    // Configure auth persistence based on environment
    this.auth.setPersistence(
      process.env.NODE_ENV === "production"
        ? browserLocalPersistence
        : inMemoryPersistence,
    );

    // Configure Google provider
    this.googleProvider.setCustomParameters({
      prompt: "select_account",
      // Ensure redirect happens to same origin
      redirect_uri: `${window.location.origin}/auth/callback`,
    });

    // Handle redirect results on page load
    this.handleRedirectResult();
  }

  private async handleRedirectResult() {
    try {
      const result = await getRedirectResult(
        this.auth,
        browserPopupRedirectResolver,
      );
      if (result) {
        await this.handleAuthSuccess(result);
      }
    } catch (error) {
      console.error("Error handling redirect result:", error);
    }
  }

  private async handleAuthSuccess(result: any) {
    // Track successful sign in
    analyticsService.trackEvent("user_signed_in", {
      method: result.providerId,
    });
  }

  async signInWithGoogle() {
    if (typeof window === "undefined") {
      throw new Error("Cannot sign in on server side");
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
      console.error("Error signing in with Google:", error);
      throw error;
    }
  }

  async signOut() {
    if (typeof window === "undefined") {
      throw new Error("Cannot sign out on server side");
    }

    try {
      await this.auth.signOut();
      analyticsService.trackEvent("user_signed_out");
    } catch (error) {
      console.error("Error signing out:", error);
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
