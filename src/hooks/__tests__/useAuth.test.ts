import { renderHook, act } from "@testing-library/react";
import { useAuth } from "../useAuth";
import * as firebaseAuth from "firebase/auth";

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
