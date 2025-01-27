import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { 
  signInWithEmail, 
  signInWithGoogle,
  signInWithFacebook,
  signInWithTwitter,
  signInWithGithub,
  signInWithApple,
  signUpWithEmail, 
  resetPassword, 
  logOut 
} from '@/firebase/auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleError = (error: any) => {
    setError(error.message);
    setTimeout(() => setError(null), 5000);
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await signInWithEmail(email, password);
      if (!result.success) throw new Error(result.error);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      const result = await signUpWithEmail(email, password, displayName);
      if (!result.success) throw new Error(result.error);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGooglePopup = async () => {
    try {
      setLoading(true);
      const result = await signInWithGoogle();
      if (!result.success) throw new Error(result.error);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signInWithFacebookPopup = async () => {
    try {
      setLoading(true);
      const result = await signInWithFacebook();
      if (!result.success) throw new Error(result.error);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signInWithTwitterPopup = async () => {
    try {
      setLoading(true);
      const result = await signInWithTwitter();
      if (!result.success) throw new Error(result.error);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGithubPopup = async () => {
    try {
      setLoading(true);
      const result = await signInWithGithub();
      if (!result.success) throw new Error(result.error);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signInWithApplePopup = async () => {
    try {
      setLoading(true);
      const result = await signInWithApple();
      if (!result.success) throw new Error(result.error);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const resetUserPassword = async (email: string) => {
    try {
      setLoading(true);
      const result = await resetPassword(email);
      if (!result.success) throw new Error(result.error);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    try {
      setLoading(true);
      const result = await logOut();
      if (!result.success) throw new Error(result.error);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signInWithGooglePopup,
    signInWithFacebookPopup,
    signInWithTwitterPopup,
    signInWithGithubPopup,
    signInWithApplePopup,
    resetUserPassword,
    signOutUser
  };
}; 