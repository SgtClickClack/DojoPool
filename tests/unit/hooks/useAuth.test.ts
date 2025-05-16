import { renderHook, act } from "@testing-library/react";
import { useAuth } from "../useAuth";
import * as firebaseAuth from "firebase/auth";
import { useRouter } from "next/router";

// Explicitly mock the firebase/auth module with only necessary mocks
jest.mock("firebase/auth", () => {
  return {
    // Explicitly mock only the functions and providers used by useAuth hook
    getAuth: jest.fn(() => ({
      // Mock auth instance properties/methods used in tests
      onAuthStateChanged: jest.fn(),
      settings: { // Add mock settings property
        appVerificationDisabledForTesting: false,
      },
      // Add other mocked properties/methods of the auth instance if needed
    })),
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signInWithPopup: jest.fn(),
    signOut: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    updateProfile: jest.fn(),
    sendEmailVerification: jest.fn(),
    deleteUser: jest.fn(),
    // Mock the OAuthProvider constructor
    OAuthProvider: jest.fn().mockImplementation((providerId) => ({
      providerId: providerId,
      // Add any methods or properties expected on an OAuthProvider instance
    })),
    // Mock other specific auth providers if they are directly imported and used as constructors
    GoogleAuthProvider: jest.fn().mockImplementation(() => ({ providerId: 'google.com' })) as any,
    FacebookAuthProvider: jest.fn().mockImplementation(() => ({ providerId: 'facebook.com' })) as any,
    TwitterAuthProvider: jest.fn().mockImplementation(() => ({ providerId: 'twitter.com' })) as any,
    GithubAuthProvider: jest.fn().mockImplementation(() => ({ providerId: 'github.com' })) as any,
    // Explicitly NOT including other exports from actual firebase/auth
  };
});

// Mock the next/router module
jest.mock("next/router", () => ({
  useRouter: jest.fn(() => ({
    route: '/',
    pathname: '',
    query: {},
    asPath: '',
    push: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
    isLocaleDomain: false,
    isReady: true,
    defaultLocale: 'en',
    domainLocales: [],
    isPreview: false,
  })),
}));

const mockUser = {
  uid: "123",
  email: "test@example.com",
  displayName: "Test User",
};

describe("useAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (firebaseAuth.getAuth as jest.Mock).mockReturnValue({
      onAuthStateChanged: jest.fn((callback) => {
        callback(null);
        return jest.fn();
      }),
    });
  });

  it("should initialize with null user and loading true", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should sign in with email and password", async () => {
    (firebaseAuth.signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: mockUser,
    });
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const response = await result.current.signIn(
        "test@example.com",
        "password",
      );
      expect(response.success).toBe(true);
      expect(response.user).toEqual(mockUser);
    });
  });

  it("should sign up with email and password", async () => {
    (
      firebaseAuth.createUserWithEmailAndPassword as jest.Mock
    ).mockResolvedValue({ user: mockUser });
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const response = await result.current.signUp(
        "test@example.com",
        "password",
        "Test User",
      );
      expect(response.success).toBe(true);
      expect(response.user).toEqual(mockUser);
    });
  });

  it("should sign in with Google", async () => {
    (firebaseAuth.signInWithPopup as jest.Mock).mockResolvedValue({
      user: mockUser,
    });
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const response = await result.current.signInWithGooglePopup();
      expect(response.success).toBe(true);
      expect(response.user).toEqual(mockUser);
    });
  });

  it("should sign in with Facebook", async () => {
    (firebaseAuth.signInWithPopup as jest.Mock).mockResolvedValue({
      user: mockUser,
    });
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const response = await result.current.signInWithFacebookPopup();
      expect(response.success).toBe(true);
      expect(response.user).toEqual(mockUser);
    });
  });

  it("should sign in with Twitter", async () => {
    (firebaseAuth.signInWithPopup as jest.Mock).mockResolvedValue({
      user: mockUser,
    });
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const response = await result.current.signInWithTwitterPopup();
      expect(response.success).toBe(true);
      expect(response.user).toEqual(mockUser);
    });
  });

  it("should sign in with GitHub", async () => {
    (firebaseAuth.signInWithPopup as jest.Mock).mockResolvedValue({
      user: mockUser,
    });
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const response = await result.current.signInWithGithubPopup();
      expect(response.success).toBe(true);
      expect(response.user).toEqual(mockUser);
    });
  });

  it("should sign in with Apple", async () => {
    (firebaseAuth.signInWithPopup as jest.Mock).mockResolvedValue({
      user: mockUser,
    });
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const response = await result.current.signInWithApplePopup();
      expect(response.success).toBe(true);
      expect(response.user).toEqual(mockUser);
    });
  });

  it("should reset password", async () => {
    (firebaseAuth.sendPasswordResetEmail as jest.Mock).mockResolvedValue(
      undefined,
    );
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const response =
        await result.current.resetUserPassword("test@example.com");
      expect(response.success).toBe(true);
    });
  });

  it("should sign out", async () => {
    (firebaseAuth.signOut as jest.Mock).mockResolvedValue(undefined);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const response = await result.current.signOutUser();
      expect(response.success).toBe(true);
    });
  });

  it("should handle errors", async () => {
    const error = new Error("Auth error");
    (firebaseAuth.signInWithEmailAndPassword as jest.Mock).mockRejectedValue(
      error,
    );
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const response = await result.current.signIn(
        "test@example.com",
        "password",
      );
      expect(response.success).toBe(false);
      expect(response.error).toBe(error.message);
    });
  });

  it("should handle auth state changes", () => {
    (firebaseAuth.getAuth as jest.Mock).mockReturnValue({
      onAuthStateChanged: jest.fn((callback) => {
        callback(mockUser);
        return jest.fn();
      }),
    });

    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
  });

  it("should clean up auth listener on unmount", () => {
    const unsubscribe = jest.fn();
    (firebaseAuth.getAuth as jest.Mock).mockReturnValue({
      onAuthStateChanged: jest.fn(() => unsubscribe),
    });

    const { unmount } = renderHook(() => useAuth());
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
