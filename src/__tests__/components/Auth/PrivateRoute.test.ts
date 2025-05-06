import React from "react";
import { screen, render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PrivateRoute from "../../../dojopool/frontend/components/Auth/[AUTH]PrivateRoute";
import { useAuth } from "@/hooks/useAuth";

// Mock the auth hook from the correct path
jest.mock("@/hooks/useAuth");

// Remove the direct mock for firebase/auth
// jest.mock("firebase/auth", () => { /* ... */ });

// Mock the src/firebase/auth module which is used by the useAuth hook
jest.mock("@/firebase/auth", () => ({
  // Mock functions and providers used by the useAuth hook
  signInWithEmail: jest.fn(),
  signUpWithEmail: jest.fn(),
  resetPassword: jest.fn(),
  logOut: jest.fn(),
  sendVerificationEmail: jest.fn(),
  isEmailVerified: jest.fn(),
  createUserDocument: jest.fn(),
  deleteAccount: jest.fn(),
  exportUserData: jest.fn(),
  requestAccountDeletion: jest.fn(),
  cancelAccountDeletion: jest.fn(),
  getDeletionRequestStatus: jest.fn(),
  // Mock social sign-in functions
  signInWithGoogle: jest.fn(),
  signInWithFacebook: jest.fn(),
  signInWithTwitter: jest.fn(),
  signInWithGithub: jest.fn(),
  signInWithApple: jest.fn(),
  // If useAuth uses any direct exports from firebase/auth (unlikely given the auth object import),
  // they would also need to be mocked here or use requireActual if applicable.
}));

describe("PrivateRoute Component", () => {
  const mockUseAuth = useAuth as jest.Mock;

  // ... existing code ...
}); 