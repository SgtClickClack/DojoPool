// Temporarily disabled due to Firebase import issues
// import {
//   createUserWithEmailAndPassword as firebaseCreateUser,
//   signInWithEmailAndPassword,
//   signInWithPopup,
//   GoogleAuthProvider,
//   FacebookAuthProvider,
//   TwitterAuthProvider,
//   GithubAuthProvider,
//   OAuthProvider,
//   signOut,
//   sendPasswordResetEmail,
//   updateProfile,
//   sendEmailVerification,
//   type User,
//   deleteUser,
// } from 'firebase/auth';

// Temporary stubs
type User = any;
const GoogleAuthProvider = class {};
const FacebookAuthProvider = class {};
const TwitterAuthProvider = class {};
const GithubAuthProvider = class {};
const OAuthProvider = class {};

// Temporarily disabled due to Firebase import issues
// import {
//   doc,
//   setDoc,
//   query,
//   where,
//   getDocs,
//   collection,
//   deleteDoc,
//   getDoc,
// } from 'firebase/firestore';

// Temporary Firestore stubs
const doc = (db: any, collection: string, id: string) => ({ id, collection });
const setDoc = async (ref: any, data: any) => console.log('setDoc temporarily disabled', { ref, data });
const getDoc = async (ref: any) => ({ exists: () => false, data: () => null });
const deleteDoc = async (ref: any) => console.log('deleteDoc temporarily disabled', { ref });
const collection = (db: any, name: string) => ({ name });
const query = (ref: any, ...constraints: any[]) => ({ ref, constraints });
const where = (field: string, op: string, value: any) => ({ field, op, value });
const getDocs = async (query: any) => ({ docs: [] });

import { db } from './config';
import { sendEmail } from './email';

// Auth Providers - temporarily disabled
// const googleProvider = new GoogleAuthProvider();
// const facebookProvider = new FacebookAuthProvider();
// const twitterProvider = new TwitterAuthProvider();
// const githubProvider = new GithubAuthProvider();
// const appleProvider = new OAuthProvider('apple.com');

// Helper function to create/update user document - temporarily disabled
export const createUserDocument = async (
  user: User,
  additionalData?: {
    playerNickname?: string;
    skillLevel?: string;
    preferredGameType?: string;
    location?: string;
    photoURL?: string | null;
  }
) => {
  console.log('User document creation temporarily disabled');
};

// Google Authentication - temporarily disabled
export const signInWithGoogle = async () => {
  console.log('Google sign-in temporarily disabled');
  return { success: false, error: 'Google sign-in temporarily disabled' };
};

// Facebook Authentication - temporarily disabled
export const signInWithFacebook = async () => {
  console.log('Facebook sign-in temporarily disabled');
  return { success: false, error: 'Facebook sign-in temporarily disabled' };
};

// Twitter Authentication - temporarily disabled
export const signInWithTwitter = async () => {
  console.log('Twitter sign-in temporarily disabled');
  return { success: false, error: 'Twitter sign-in temporarily disabled' };
};

// GitHub Authentication - temporarily disabled
export const signInWithGithub = async () => {
  console.log('GitHub sign-in temporarily disabled');
  return { success: false, error: 'GitHub sign-in temporarily disabled' };
};

// Apple Authentication - temporarily disabled
export const signInWithApple = async () => {
  console.log('Apple sign-in temporarily disabled');
  return { success: false, error: 'Apple sign-in temporarily disabled' };
};

// Email/Password Authentication
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string,
  playerNickname?: string,
  skillLevel?: string
) => {
  console.log('Email/password sign-up temporarily disabled');
  return {
    success: false,
    error: 'Email/password sign-up temporarily disabled',
  };
};

export const signInWithEmail = async (email: string, password: string) => {
  console.log('Email/password sign-in temporarily disabled');
  return {
    success: false,
    error: 'Email/password sign-in temporarily disabled',
  };
};

export const resetPassword = async (email: string) => {
  console.log('Password reset temporarily disabled');
  return { success: false, error: 'Password reset temporarily disabled' };
};

export const logOut = async () => {
  console.log('Logout temporarily disabled');
  return { success: false, error: 'Logout temporarily disabled' };
};

// Check if a player nickname is unique - temporarily disabled
export const isNicknameUnique = async (nickname: string): Promise<boolean> => {
  console.log('Nickname uniqueness check temporarily disabled');
  return true;
};

// Send email verification - temporarily disabled
export const sendVerificationEmail = async (
  user: User
): Promise<{ success: boolean; error?: string }> => {
  console.log('Email verification temporarily disabled');
  return { success: false, error: 'Email verification temporarily disabled' };
};

// Check if email is verified
export const isEmailVerified = (user: User): boolean => {
  return user.emailVerified;
};

// Constants for account deletion
const ACCOUNT_DELETION = {
  COOLDOWN_PERIOD: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  TEST_COOLDOWN_PERIOD: 5 * 60 * 1000, // 5 minutes in milliseconds
  EMAIL_TEMPLATES: {
    DELETION_REQUEST: {
      subject: 'Account Deletion Requested',
      body: (displayName: string) => `
        Dear ${displayName},

        We have received your request to delete your DojoPool account. This action cannot be undone.

        Your account will be permanently deleted in 24 hours. If you did not request this deletion, please log in to your account and cancel the deletion request.

        Best regards,
        The DojoPool Team
      `,
    },
    DELETION_CANCELLED: {
      subject: 'Account Deletion Cancelled',
      body: (displayName: string) => `
        Dear ${displayName},

        Your account deletion request has been cancelled. Your account is safe and will not be deleted.

        If you did not cancel this request, please contact our support team immediately.

        Best regards,
        The DojoPool Team
      `,
    },
    DELETION_COMPLETED: {
      subject: 'Account Deleted',
      body: (displayName: string) => `
        Dear ${displayName},

        Your DojoPool account has been permanently deleted as requested.

        We're sorry to see you go. If you change your mind, you can always create a new account.

        Best regards,
        The DojoPool Team
      `,
    },
  },
};

// Request account deletion
export const requestAccountDeletion = async (
  user: User
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Account deletion request temporarily disabled');
    return { success: false, error: 'Account deletion temporarily disabled' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Cancel account deletion
export const cancelAccountDeletion = async (
  user: User
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Account deletion cancellation temporarily disabled');
    return { success: false, error: 'Account deletion cancellation temporarily disabled' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get deletion request status
export const getDeletionRequestStatus = async (
  user: User
): Promise<{
  success: boolean;
  status?: 'pending' | 'completed' | 'cancelled' | null;
  scheduledFor?: string;
  error?: string;
}> => {
  try {
    console.log('Deletion request status check temporarily disabled');
    return { success: true, status: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Process account deletion
export const processAccountDeletion = async (
  user: User
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Account deletion processing temporarily disabled');
    return { success: false, error: 'Account deletion processing temporarily disabled' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Delete user account and all associated data
export const deleteUserAccount = async (
  user: User
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('User account deletion temporarily disabled');
    return { success: false, error: 'User account deletion temporarily disabled' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get user profile data
export const getUserProfile = async (
  userId: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    console.log('User profile retrieval temporarily disabled');
    return { success: false, error: 'User profile retrieval temporarily disabled' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Export user data
export const exportUserData = async (
  user: User
): Promise<{ success: boolean; data?: unknown; error?: string }> => {
  try {
    // Get user document from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();

    // Get game history
    const gamesRef = collection(db, 'games');
    const gamesQuery = query(gamesRef, where('userId', '==', user.uid));
    const gamesSnapshot = await getDocs(gamesQuery);
    const games = gamesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get match history
    const matchesRef = collection(db, 'matches');
    const matchesQuery = query(matchesRef, where('userId', '==', user.uid));
    const matchesSnapshot = await getDocs(matchesQuery);
    const matches = matchesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Compile all user data
    const exportData = {
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        metadata: {
          creationTime: user.metadata.creationTime,
          lastSignInTime: user.metadata.lastSignInTime,
        },
      },
      profile: userData,
      games,
      matches,
      exportDate: new Date().toISOString(),
    };

    return { success: true, data: exportData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
