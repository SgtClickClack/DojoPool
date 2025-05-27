import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
// import { ForgotPassword } from '../../frontend/components/Auth/ForgotPassword';
import { renderWithChakra } from "test-utils";
import { useNavigate } from "react-router-dom";
// Import useAuth hook
// import { useAuth } from '../../frontend/hooks/useAuth';
import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";
import { useRouter } from "next/router";

// Mock hooks
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
  Link: jest.fn().mockImplementation(({ children }) => children),
}));
// Mock useAuth hook
jest.mock("../../../dojopool/frontend/hooks/useAuth");

// Mock next/router
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Explicitly mock the firebase/auth module with only necessary mocks
jest.mock("firebase/auth", () => ({
  // Explicitly mock only the functions and providers used by useAuth hook
  getAuth: jest.fn(() => ({
    // Mock auth instance properties/methods used in tests
    onAuthStateChanged: jest.fn(() => jest.fn()), // Ensure instance method mock returns a function
    settings: { // Add mock settings property
      appVerificationDisabledForTesting: false,
    },
    // Add other mocked properties/methods of the auth instance if needed
  })),
  onAuthStateChanged: jest.fn(() => jest.fn()), // <<< FIX: Ensure direct import mock returns a function
  signInWithEmailAndPassword: jest.fn(), // Assuming this might be used indirectly
  createUserWithEmailAndPassword: jest.fn(), // Assuming this might be used indirectly
  signInWithPopup: jest.fn(), // Assuming this might be used indirectly
  signOut: jest.fn(), // Assuming this might be used indirectly
  sendPasswordResetEmail: jest.fn(),
  updateProfile: jest.fn(), // Assuming this might be used indirectly
  sendEmailVerification: jest.fn(), // Assuming this might be used indirectly
  deleteUser: jest.fn(), // Assuming this might be used indirectly
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
}));

// Create a basic theme system using createSystem
const themeSystem = createSystem(defaultConfig, {}); // Create a basic system

describe("ForgotPassword Component", () => {
  const mockNavigate = jest.fn();
  // Mock function for useAuth
  const mockSendPasswordResetEmail = jest.fn();

  beforeEach(() => {
    // Reset mocks
    mockNavigate.mockClear();
    mockSendPasswordResetEmail.mockClear();

    // Setup mocks
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    // Provide mock implementation for useAuth
    // (useAuth as jest.Mock).mockReturnValue({
    //   sendPasswordResetEmail: mockSendPasswordResetEmail,
    //   loading: false,
    //   error: null,
    //   // Add any other state the component might use from useAuth
    //   // e.g., successMessage: null
    // });

    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      query: {},
    });
    (global.fetch as jest.Mock).mockReset();
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return renderWithChakra(
      <ChakraProvider value={themeSystem}>
        {/* <ForgotPassword /> */}
      </ChakraProvider>,
    );
  };

  it("renders forgot password form correctly", () => {
    renderComponent();

    expect(screen.getByText("Reset Password")).toBeInTheDocument();
    expect(screen.getByText(/Enter your email address/)).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send Reset Link" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Back to Sign In")).toBeInTheDocument();
  });

  it("calls sendPasswordResetEmail on submit and shows success message", async () => {
    // Mock useAuth to simulate successful call
    mockSendPasswordResetEmail.mockResolvedValueOnce({ success: true }); // Assuming success response

    renderComponent();

    const emailInput = screen.getByLabelText("Email");
    const submitButton = screen.getByRole("button", { name: "Send Reset Link" });

    await userEvent.type(emailInput, "test@example.com");
    fireEvent.click(submitButton);

    // Check if the hook function was called
    expect(mockSendPasswordResetEmail).toHaveBeenCalledTimes(1);
    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith("test@example.com");

    // Check for success state (assuming component shows a message)
    // This requires the component to be updated to show success
    await waitFor(() => {
        expect(screen.getByText(/Check your email for instructions/)).toBeInTheDocument();
        // Or check if a specific success state/message is set via the hook
    });

    // Ensure button is re-enabled after success
    expect(submitButton).not.toBeDisabled();
  });

  it("shows error message when sendPasswordResetEmail fails", async () => {
    // Mock useAuth to simulate failure
    const errorMessage = "Failed to send reset email";
    mockSendPasswordResetEmail.mockRejectedValueOnce(new Error(errorMessage));
    // Update the hook state to reflect the error
    // (useAuth as jest.Mock).mockReturnValue({
    //   sendPasswordResetEmail: mockSendPasswordResetEmail,
    //   loading: false,
    //   error: errorMessage, // Assume the hook sets the error state
    // });

    renderComponent();

    const emailInput = screen.getByLabelText("Email");
    const submitButton = screen.getByRole("button", { name: "Send Reset Link" });

    await userEvent.type(emailInput, "test@example.com");
    fireEvent.click(submitButton); // Click happens before mock state update in real component
    
    // We need to trigger a re-render AFTER the mock is updated 
    // or assert based on the updated mock state provided above.
    
    // Re-render with the error state (simpler for testing)
    // (useAuth as jest.Mock).mockReturnValue({
    //   sendPasswordResetEmail: mockSendPasswordResetEmail.mockRejectedValueOnce(new Error(errorMessage)), // Ensure the function rejects
    //   loading: false,
    //   error: errorMessage,
    // });
    renderComponent(); // Re-render with error state

    // Check if the error message from the hook is displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith("test@example.com");
    // Ensure button is re-enabled after error
     expect(submitButton).not.toBeDisabled();
  });

  it("validates required email field", async () => {
    renderComponent();
    const submitButton = screen.getByRole("button", { name: "Send Reset Link" });
    fireEvent.click(submitButton);

    expect(screen.getByLabelText("Email")).toBeInvalid();
    expect(mockSendPasswordResetEmail).not.toHaveBeenCalled(); // Hook function shouldn't be called
  });

  it("validates email format", async () => {
    renderComponent();
    const emailInput = screen.getByLabelText("Email");
    const submitButton = screen.getByRole("button", { name: "Send Reset Link" });

    await userEvent.type(emailInput, "invalid-email");
    fireEvent.click(submitButton);

    expect(emailInput).toBeInvalid();
    expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("navigates to login page", async () => {
    renderComponent();
    const loginLink = screen.getByText("Back to Sign In");
    fireEvent.click(loginLink);
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("disables submit button during request (checks loading state)", async () => {
    // Mock useAuth to be in a loading state
     // (useAuth as jest.Mock).mockReturnValue({
      //  sendPasswordResetEmail: mockSendPasswordResetEmail.mockImplementation(() => new Promise(() => {})), // Function that never resolves
      //  loading: true, // Set loading state
      //  error: null,
      // });

    renderComponent();

    // Now the component should render with the button disabled based on loading=true
    const submitButton = screen.getByRole("button", { name: "Send Reset Link" });
    expect(submitButton).toBeDisabled();
  });

  it("shows validation error for invalid email", async () => {
    renderComponent();

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole("button", {
      name: /send reset link/i,
    });

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it("handles successful password reset email", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    renderComponent();

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole("button", {
      name: /send reset link/i,
    });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: "test@example.com" }),
        },
      );

      expect(
        screen.getByText(
          /password reset email sent\. please check your inbox/i,
        ),
      ).toBeInTheDocument();
    });
  });

  it("handles failed password reset email", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    renderComponent();

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole("button", {
      name: /send reset link/i,
    });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/failed to send password reset email/i),
      ).toBeInTheDocument();
    });
  });
});
