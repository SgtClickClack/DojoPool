import { useState, useEffect } from "react";
import { User, updateProfile } from "firebase/auth";
import { auth } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import {
  signInWithEmail,
  signInWithGoogle,
  signInWithFacebook,
  signInWithTwitter,
  signInWithGithub,
  signInWithApple,
  signUpWithEmail,
  resetPassword,
  logOut,
  sendVerificationEmail,
  isEmailVerified,
  createUserDocument,
  deleteAccount,
  exportUserData,
  requestAccountDeletion,
  cancelAccountDeletion,
  getDeletionRequestStatus,
} from "@/firebase/auth";
import { useRouter } from "next/router";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface ProfileData {
  playerNickname?: string;
  skillLevel?: string;
  preferredGameType?: string;
  location?: string;
  photoURL?: string | null;
  displayName?: string;
  email?: string;
}

interface DeletionStatus {
  success: boolean;
  status?: "pending" | "completed" | "cancelled" | null;
  scheduledFor?: string;
  error?: string;
}

interface AuthResponse {
  success: boolean;
  error?: string;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setAuthState({
          user,
          loading: false,
          error: null,
        });
      },
      (error) => {
        setAuthState({
          user: null,
          loading: false,
          error: error.message,
        });
      },
    );

    return () => unsubscribe();
  }, []);

  const handleError = (error: any) => {
    setAuthState({
      ...authState,
      error: error.message,
    });
    setTimeout(() => setAuthState({ ...authState, error: null }), 5000);
  };

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState({ ...authState, loading: true });
      const result = await signInWithEmail(email, password);
      if (!result.success) throw new Error(result.error);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setAuthState({ ...authState, loading: false });
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
  ) => {
    try {
      setAuthState({ ...authState, loading: true });
      const result = await signUpWithEmail(email, password, displayName);
      if (!result.success) throw new Error(result.error);

      // Send verification email after successful signup
      if (result.user) {
        const verificationResult = await sendVerificationEmail(result.user);
        if (!verificationResult.success) {
          console.error(
            "Failed to send verification email:",
            verificationResult.error,
          );
        }
      }

      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setAuthState({ ...authState, loading: false });
    }
  };

  const signInWithGooglePopup = async () => {
    try {
      setAuthState({ ...authState, loading: true });
      const result = await signInWithGoogle();
      if (!result.success) throw new Error(result.error);
      router.push("/auth/complete-profile");
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setAuthState({ ...authState, loading: false });
    }
  };

  const signInWithFacebookPopup = async () => {
    try {
      setAuthState({ ...authState, loading: true });
      const result = await signInWithFacebook();
      if (!result.success) throw new Error(result.error);
      router.push("/auth/complete-profile");
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setAuthState({ ...authState, loading: false });
    }
  };

  const signInWithTwitterPopup = async () => {
    try {
      setAuthState({ ...authState, loading: true });
      const result = await signInWithTwitter();
      if (!result.success) throw new Error(result.error);
      router.push("/auth/complete-profile");
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setAuthState({ ...authState, loading: false });
    }
  };

  const signInWithGithubPopup = async () => {
    try {
      setAuthState({ ...authState, loading: true });
      const result = await signInWithGithub();
      if (!result.success) throw new Error(result.error);
      router.push("/auth/complete-profile");
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setAuthState({ ...authState, loading: false });
    }
  };

  const signInWithApplePopup = async () => {
    try {
      setAuthState({ ...authState, loading: true });
      const result = await signInWithApple();
      if (!result.success) throw new Error(result.error);
      router.push("/auth/complete-profile");
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setAuthState({ ...authState, loading: false });
    }
  };

  const resetUserPassword = async (email: string) => {
    try {
      setAuthState({ ...authState, loading: true });
      const result = await resetPassword(email);
      if (!result.success) throw new Error(result.error);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setAuthState({ ...authState, loading: false });
    }
  };

  const signOutUser = async () => {
    try {
      setAuthState({ ...authState, loading: true });
      const result = await logOut();
      if (!result.success) throw new Error(result.error);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setAuthState({ ...authState, loading: false });
    }
  };

  const sendVerification = async () => {
    if (!authState.user) return { success: false, error: "No user logged in" };

    try {
      setAuthState({ ...authState, loading: true });
      const result = await sendVerificationEmail(authState.user);
      if (!result.success) throw new Error(result.error);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setAuthState({ ...authState, loading: false });
    }
  };

  const checkEmailVerification = (): boolean => {
    if (!authState.user) return false;
    return isEmailVerified(authState.user);
  };

  const updateUserProfile = async (profileData: ProfileData) => {
    if (!authState.user) return { success: false, error: "No user logged in" };

    try {
      setAuthState({ ...authState, loading: true });

      // Update Firestore document if player-specific data is provided
      if (
        profileData.playerNickname ||
        profileData.skillLevel ||
        profileData.preferredGameType ||
        profileData.location
      ) {
        await createUserDocument(authState.user, {
          playerNickname: profileData.playerNickname,
          skillLevel: profileData.skillLevel,
          preferredGameType: profileData.preferredGameType,
          location: profileData.location,
          photoURL: profileData.photoURL,
        });
      }

      // Update Firebase Auth profile if auth-specific data is provided
      if (profileData.displayName || profileData.photoURL) {
        await updateProfile(authState.user, {
          displayName: profileData.displayName || undefined,
          photoURL: profileData.photoURL || null,
        });
      }

      return { success: true };
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setAuthState({ ...authState, loading: false });
    }
  };

  const fetchUserProfile = async (uid: string) => {
    try {
      setAuthState({ ...authState, loading: true });
      const userDoc = await getDoc(doc(db, "users", uid));
      if (!userDoc.exists()) {
        throw new Error("User profile not found");
      }
      return userDoc.data();
    } catch (error: any) {
      handleError(error);
      throw error;
    } finally {
      setAuthState({ ...authState, loading: false });
    }
  };

  const deleteUserAccount = async () => {
    if (!authState.user) return { success: false, error: "No user logged in" };

    try {
      setAuthState({ ...authState, loading: true });
      const result = await deleteAccount(authState.user);
      if (!result.success) throw new Error(result.error);

      // Sign out after successful deletion
      await signOutUser();

      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setAuthState({ ...authState, loading: false });
    }
  };

  const exportAccountData = async () => {
    if (!authState.user) return { success: false, error: "No user logged in" };

    try {
      setAuthState({ ...authState, loading: true });
      const result = await exportUserData(authState.user);
      if (!result.success) throw new Error(result.error);

      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setAuthState({ ...authState, loading: false });
    }
  };

  const requestAccountDeletionRequest = async (): Promise<AuthResponse> => {
    if (!authState.user) return { success: false, error: "No user logged in" };

    try {
      setAuthState({ ...authState, loading: true });
      const result = await requestAccountDeletion(authState.user);
      if (!result.success) throw new Error(result.error);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setAuthState({ ...authState, loading: false });
    }
  };

  const cancelAccountDeletionRequest = async (): Promise<AuthResponse> => {
    if (!authState.user) return { success: false, error: "No user logged in" };

    try {
      setAuthState({ ...authState, loading: true });
      const result = await cancelAccountDeletion(authState.user);
      if (!result.success) throw new Error(result.error);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setAuthState({ ...authState, loading: false });
    }
  };

  const getDeletionRequestStatusCheck = async (): Promise<DeletionStatus> => {
    if (!authState.user) return { success: false, error: "No user logged in" };

    try {
      setAuthState({ ...authState, loading: true });
      const result = await getDeletionRequestStatus(authState.user);
      if (!result.success) throw new Error(result.error);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setAuthState({ ...authState, loading: false });
    }
  };

  return {
    ...authState,
    signIn,
    signUp,
    signInWithGooglePopup,
    signInWithFacebookPopup,
    signInWithTwitterPopup,
    signInWithGithubPopup,
    signInWithApplePopup,
    resetUserPassword,
    signOutUser,
    sendVerification,
    checkEmailVerification,
    updateUserProfile,
    fetchUserProfile,
    deleteUserAccount,
    exportAccountData,
    requestAccountDeletion: requestAccountDeletionRequest,
    cancelAccountDeletion: cancelAccountDeletionRequest,
    getDeletionRequestStatus: getDeletionRequestStatusCheck,
  };
};
