import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
// Removed explicit ChakraProvider and related imports
// import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";
import ResetPassword from "../reset-password";
import { useRouter } from "next/router";
import { renderWithChakra } from "test-utils";
import { useToast } from '@chakra-ui/react';

// Mock next/router
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Removed local theme system creation
// const themeSystem = createSystem(defaultConfig, {}); // Create a basic system

describe("ResetPassword", () => {
  const mockRouter = {
    push: jest.fn(),
    query: { token: "valid-token" },
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (global.fetch as jest.Mock).mockReset();
    jest.clearAllMocks();
  });

  // Removed local renderComponent function
  // const renderComponent = () => {
  //   const system = createSystem(defaultConfig, {});
  //   return render(
  //     <ChakraProvider value={system}>
  //       {/* Wrap the component with necessary providers for hooks */}
  //       {/* <ToastProvider> - Removing this usage */}
  //         <ResetPassword />
  //       {/* </ToastProvider> */}
  //       {/* Add other necessary providers here */}
  //     </ChakraProvider>,
  //   );
  // };

  it("renders the reset password form", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    // Use the new renderWithChakra helper
    renderWithChakra(<ResetPassword />);

    await waitFor(() => {
      expect(screen.getByText("Reset Password")).toBeInTheDocument();
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/confirm new password/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /reset password/i }),
      ).toBeInTheDocument();
    });
  });

  it("shows validation error for weak password", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    renderWithChakra(<ResetPassword />);

    await waitFor(() => {
      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput =
        screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole("button", {
        name: /reset password/i,
      });

      fireEvent.change(passwordInput, { target: { value: "weak" } });
      fireEvent.change(confirmPasswordInput, { target: { value: "weak" } });
      fireEvent.click(submitButton);

      expect(
        screen.getByText(/password must be at least 8 characters/i),
      ).toBeInTheDocument();
    });
  });

  it("shows validation error for non-matching passwords", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    renderWithChakra(<ResetPassword />);

    await waitFor(() => {
      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput =
        screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole("button", {
        name: /reset password/i,
      });

      fireEvent.change(passwordInput, { target: { value: "StrongPass123!" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "DifferentPass123!" },
      });
      fireEvent.click(submitButton);

      expect(screen.getByText(/passwords must match/i)).toBeInTheDocument();
    });
  });

  it("handles successful password reset", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true }) // Token validation
      .mockResolvedValueOnce({ ok: true }); // Password reset

    renderWithChakra(<ResetPassword />);

    await waitFor(() => {
      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput =
        screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole("button", {
        name: /reset password/i,
      });

      fireEvent.change(passwordInput, { target: { value: "StrongPass123!" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "StrongPass123!" },
      });
      fireEvent.click(submitButton);

      expect(global.fetch).toHaveBeenCalledWith("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: "valid-token",
          password: "StrongPass123!",
        }),
      });

      expect(mockRouter.push).toHaveBeenCalledWith("/auth/login");
    });
  });

  it("handles failed password reset", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true }) // Token validation
      .mockResolvedValueOnce({ ok: false }); // Password reset

    renderWithChakra(<ResetPassword />);

    await waitFor(() => {
      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput =
        screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole("button", {
        name: /reset password/i,
      });

      fireEvent.change(passwordInput, { target: { value: "StrongPass123!" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "StrongPass123!" },
      });
      fireEvent.click(submitButton);

      expect(screen.getByText(/failed to reset password/i)).toBeInTheDocument();
    });
  });

  it("handles invalid token", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    renderWithChakra(<ResetPassword />);

    await waitFor(() => {
      expect(
        screen.getByText(/invalid or expired reset token/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /request new reset link/i }),
      ).toBeInTheDocument();
    });
  });
});
