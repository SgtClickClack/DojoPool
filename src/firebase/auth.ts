import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  type User,
  deleteUser,
} from 'firebase/auth';
import { auth } from './config';
import {
  doc,
  setDoc,
  query,
  where,
  getDocs,
  collection,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from './config';
import { sendEmail } from './email';

// Auth Providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const twitterProvider = new TwitterAuthProvider();
const githubProvider = new GithubAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

// Helper function to create/update user document
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
  await setDoc(
    doc(db, 'users', user.uid),
    {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLogin: new Date().toISOString(),
      ...additionalData,
    },
    { merge: true }
  );
};

// Google Authentication
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await createUserDocument(result.user);
    return { success: true, user: result.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Facebook Authentication
export const signInWithFacebook = async () => {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    await createUserDocument(result.user);
    return { success: true, user: result.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Twitter Authentication
export const signInWithTwitter = async () => {
  try {
    const result = await signInWithPopup(auth, twitterProvider);
    await createUserDocument(result.user);
    return { success: true, user: result.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// GitHub Authentication
export const signInWithGithub = async () => {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    await createUserDocument(result.user);
    return { success: true, user: result.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Apple Authentication
export const signInWithApple = async () => {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    await createUserDocument(result.user);
    return { success: true, user: result.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Email/Password Authentication
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string,
  playerNickname?: string,
  skillLevel?: string
) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    // Update profile with display name
    await updateProfile(user, { displayName });

    // Create user document with additional player data
    await createUserDocument(user, { playerNickname, skillLevel });

    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await createUserDocument(result.user);
    return { success: true, user: result.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Check if a player nickname is unique
export const isNicknameUnique = async (nickname: string): Promise<boolean> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('playerNickname', '==', nickname));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  } catch (error: any) {
    console.error('Error checking nickname uniqueness:', error);
    return false;
  }
};

// Send email verification
export const sendVerificationEmail = async (
  user: User
): Promise<{ success: boolean; error?: string }> => {
  try {
    await sendEmailVerification(user);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
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
    // Check if there's already a pending deletion request
    const deletionRef = doc(db, 'accountDeletions', user.uid);
    const deletionDoc = await getDoc(deletionRef);

    if (deletionDoc.exists()) {
      return { success: false, error: 'A deletion request is already pending' };
    }

    // Create deletion request document
    const cooldownPeriod =
      process.env.NODE_ENV === 'development'
        ? ACCOUNT_DELETION.TEST_COOLDOWN_PERIOD
        : ACCOUNT_DELETION.COOLDOWN_PERIOD;

    await setDoc(deletionRef, {
      userId: user.uid,
      email: user.email,
      displayName: user.displayName,
      requestedAt: new Date().toISOString(),
      scheduledFor: new Date(Date.now() + cooldownPeriod).toISOString(),
      status: 'pending',
    });

    // Send notification email
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: ACCOUNT_DELETION.EMAIL_TEMPLATES.DELETION_REQUEST.subject,
        body: ACCOUNT_DELETION.EMAIL_TEMPLATES.DELETION_REQUEST.body(
          user.displayName || 'User'
        ),
      });
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Cancel account deletion
export const cancelAccountDeletion = async (
  user: User
): Promise<{ success: boolean; error?: string }> => {
  try {
    const deletionRef = doc(db, 'accountDeletions', user.uid);
    const deletionDoc = await getDoc(deletionRef);

    if (!deletionDoc.exists()) {
      return { success: false, error: 'No pending deletion request found' };
    }

    const deletionData = deletionDoc.data();
    if (deletionData.status !== 'pending') {
      return {
        success: false,
        error: 'Deletion request is not in pending state',
      };
    }

    // Delete the deletion request
    await deleteDoc(deletionRef);

    // Send cancellation email
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: ACCOUNT_DELETION.EMAIL_TEMPLATES.DELETION_CANCELLED.subject,
        body: ACCOUNT_DELETION.EMAIL_TEMPLATES.DELETION_CANCELLED.body(
          user.displayName || 'User'
        ),
      });
    }

    return { success: true };
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
    const deletionRef = doc(db, 'accountDeletions', user.uid);
    const deletionDoc = await getDoc(deletionRef);

    if (!deletionDoc.exists()) {
      return { success: true, status: null };
    }

    const deletionData = deletionDoc.data();
    return {
      success: true,
      status: deletionData.status,
      scheduledFor: deletionData.scheduledFor,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Modified delete account function to handle the cooldown period
export const deleteAccount = async (
  user: User
): Promise<{ success: boolean; error?: string }> => {
  try {
    const deletionRef = doc(db, 'accountDeletions', user.uid);
    const deletionDoc = await getDoc(deletionRef);

    if (!deletionDoc.exists()) {
      return { success: false, error: 'No deletion request found' };
    }

    const deletionData = deletionDoc.data();
    if (deletionData.status !== 'pending') {
      return {
        success: false,
        error: 'Deletion request is not in pending state',
      };
    }

    const scheduledTime = new Date(deletionData.scheduledFor);
    if (new Date() < scheduledTime) {
      return { success: false, error: 'Cooldown period has not elapsed' };
    }

    // Delete user document from Firestore
    await deleteDoc(doc(db, 'users', user.uid));

    // Delete user account from Firebase Auth
    await deleteUser(user);

    // Update deletion request status
    await setDoc(
      deletionRef,
      {
        ...deletionData,
        status: 'completed',
        completedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Send completion email
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: ACCOUNT_DELETION.EMAIL_TEMPLATES.DELETION_COMPLETED.subject,
        body: ACCOUNT_DELETION.EMAIL_TEMPLATES.DELETION_COMPLETED.body(
          user.displayName || 'User'
        ),
      });
    }

    return { success: true };
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
